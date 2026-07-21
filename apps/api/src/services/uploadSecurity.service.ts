import { AppError } from '../middleware/errorHandler';
import { HttpStatus } from '../utils/httpStatus';

// --- Filename validation -----------------------------------------------------
// Rather than trying to enumerate every Unicode homograph / RTL-override / zero-width
// trick individually, the filename charset is restricted to a known-safe allow-list.
// This single rule defeats path traversal, null-byte injection, RTL-override (U+202E)
// disguises like a filename with reversed/hidden extension text, homograph spoofing,
// and invisible characters all at once — the tradeoff is no non-Latin filenames.
const SAFE_FILENAME_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9 ._\-()\[\],&+'~!]{0,253}[a-zA-Z0-9)\]])?$/;

// Extensions that a browser or web server could ever be tricked into executing.
// Matched against *every* dot-separated segment, not just the last one, to catch
// double-extension attacks (`invoice.pdf.php`, `image.jpg.exe`).
const DANGEROUS_EXTENSIONS = new Set([
  'php', 'php3', 'php4', 'php5', 'phtml', 'pht',
  'asp', 'aspx', 'jsp', 'jspx', 'cgi', 'pl', 'py', 'rb',
  'exe', 'dll', 'com', 'bat', 'cmd', 'msi', 'scr', 'vbs', 'vbe',
  'ps1', 'psm1', 'sh', 'bash', 'jar', 'war', 'ear',
  'htaccess', 'htpasswd', 'config', 'ini',
  'svg', // XML-based; can carry <script> — stored XSS via SVG. Blocked outright.
]);

const RESERVED_WINDOWS_NAMES = new Set([
  'con', 'prn', 'aux', 'nul',
  'com1', 'com2', 'com3', 'com4', 'com5', 'com6', 'com7', 'com8', 'com9',
  'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9',
]);

export function validateFileName(rawName: string): void {
  if (!rawName || typeof rawName !== 'string') {
    throw new AppError(HttpStatus.BAD_REQUEST, 'File name is required', 'UPLOAD_REJECTED');
  }
  // Encoded null byte (a literal 0x00 is already rejected by the charset test below,
  // since it isn't a member of the allowed character class).
  if (rawName.toLowerCase().includes('%00')) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'File name contains an encoded null byte', 'UPLOAD_REJECTED');
  }
  // Reject anything that isn't in the safe, boring charset — see comment above.
  if (!SAFE_FILENAME_RE.test(rawName)) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'File name contains unsupported characters. Use letters, numbers, spaces, and basic punctuation only.', 'UPLOAD_REJECTED');
  }
  if (rawName.includes('/') || rawName.includes('\\') || rawName.includes('..')) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'File name cannot contain path separators', 'UPLOAD_REJECTED');
  }

  const segments = rawName.split('.').map((s) => s.toLowerCase());
  const baseName = segments[0];
  if (RESERVED_WINDOWS_NAMES.has(baseName)) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'File name uses a reserved system name', 'UPLOAD_REJECTED');
  }

  // Every extension-shaped segment (not just the final one) is checked, so
  // `report.pdf.php` is rejected even though its *final* extension looks harmless
  // and its Content-Type might claim `application/pdf`.
  for (const seg of segments.slice(1)) {
    if (DANGEROUS_EXTENSIONS.has(seg)) {
      throw new AppError(HttpStatus.BAD_REQUEST, `File type ".${seg}" is not allowed`, 'UPLOAD_REJECTED');
    }
  }
}

// --- MIME / declared content-type validation ---------------------------------
const DANGEROUS_MIME_TYPES = new Set([
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-sh',
  'application/x-bat',
  'application/x-php',
  'application/x-httpd-php',
  'text/x-php',
  'application/x-executable',
  'application/x-elf',
  'image/svg+xml',
]);

export function validateMimeType(mimeType: string | undefined | null): void {
  if (!mimeType) return;
  const normalized = mimeType.toLowerCase().split(';')[0].trim();
  if (DANGEROUS_MIME_TYPES.has(normalized)) {
    throw new AppError(HttpStatus.BAD_REQUEST, `File type "${mimeType}" is not allowed`, 'UPLOAD_REJECTED');
  }
}

// --- Magic-byte (file signature) validation -----------------------------------
// Detects "extension spoofing" / "MIME type spoofing": a file whose actual byte
// signature doesn't match — or is outright an executable — regardless of what the
// filename or declared Content-Type claim.
const EXECUTABLE_SIGNATURES: Array<{ name: string; check: (b: Buffer) => boolean }> = [
  { name: 'Windows PE/EXE', check: (b) => b.length >= 2 && b[0] === 0x4d && b[1] === 0x5a }, // "MZ"
  { name: 'ELF binary', check: (b) => b.length >= 4 && b[0] === 0x7f && b[1] === 0x45 && b[2] === 0x4c && b[3] === 0x46 },
  { name: 'Mach-O binary', check: (b) => b.length >= 4 && (b.readUInt32BE(0) === 0xfeedface || b.readUInt32BE(0) === 0xfeedfacf || b.readUInt32BE(0) === 0xcafebabe) },
  { name: 'shell script', check: (b) => b.length >= 2 && b[0] === 0x23 && b[1] === 0x21 }, // "#!"
];

// EICAR is the industry-standard, harmless antivirus test string — detecting it
// demonstrates a real content scan hook without shipping/handling actual malware.
const EICAR_SIGNATURE = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';

export interface ScanResult {
  clean: boolean;
  reason?: string;
}

/**
 * Inspects a byte prefix of an uploaded object (a small ranged read is enough —
 * we never pull an entire multi-GB file server-side just to scan it).
 */
export function scanBufferPrefix(buffer: Buffer): ScanResult {
  for (const sig of EXECUTABLE_SIGNATURES) {
    if (sig.check(buffer)) {
      return { clean: false, reason: `Executable file signature detected (${sig.name})` };
    }
  }

  const asText = buffer.toString('utf8', 0, Math.min(buffer.length, 4096));
  if (asText.includes(EICAR_SIGNATURE)) {
    return { clean: false, reason: 'Matched antivirus test signature (EICAR)' };
  }
  if (/<\?php/i.test(asText)) {
    return { clean: false, reason: 'Embedded PHP tag detected in file content' };
  }
  if (/<script[\s>]/i.test(asText) && /^\s*(<\?xml|<svg)/i.test(asText)) {
    return { clean: false, reason: 'Embedded script tag detected in SVG/XML content' };
  }

  return { clean: true };
}

/**
 * Full upload security gate: filename shape, declared MIME type, and (when a byte
 * prefix is available) magic-byte / embedded-script scanning. Throws AppError on
 * any violation — callers should treat that as "reject the upload".
 */
export function assertSafeUpload(params: { fileName: string; mimeType?: string | null; contentPrefix?: Buffer }): void {
  validateFileName(params.fileName);
  validateMimeType(params.mimeType);

  if (params.contentPrefix && params.contentPrefix.length > 0) {
    const result = scanBufferPrefix(params.contentPrefix);
    if (!result.clean) {
      throw new AppError(HttpStatus.BAD_REQUEST, `Upload rejected by security scan: ${result.reason}`, 'UPLOAD_REJECTED_SECURITY_SCAN');
    }
  }
}

// --- Profile picture validation ------------------------------------------------
// Stricter than the general upload gate: a profile picture must actually *be* a
// photo, not merely "not obviously dangerous". Declared Content-Type is never
// trusted alone — the real magic bytes must match one of these four raster image
// formats. SVG is refused outright (XML, can carry <script> — stored XSS) and
// nothing here ever executes, so there's no server-side image-parser attack
// surface (no ImageMagick/libvips decode of untrusted input).
const IMAGE_SIGNATURES: Record<string, (b: Buffer) => boolean> = {
  'image/jpeg': (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png': (b) => b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  'image/gif': (b) => b.length >= 6 && ['GIF87a', 'GIF89a'].includes(b.toString('ascii', 0, 6)),
  'image/webp': (b) => b.length >= 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP',
};

const ALLOWED_AVATAR_MIME_TYPES = new Set(Object.keys(IMAGE_SIGNATURES));

export function assertValidProfileImage(params: { buffer: Buffer; declaredMimeType: string; maxBytes: number }): void {
  const { buffer, declaredMimeType, maxBytes } = params;

  if (buffer.length === 0) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Uploaded file is empty', 'UPLOAD_REJECTED');
  }
  if (buffer.length > maxBytes) {
    throw new AppError(HttpStatus.PAYLOAD_TOO_LARGE, `Profile picture exceeds the ${(maxBytes / (1024 * 1024)).toFixed(0)}MB size limit`, 'UPLOAD_REJECTED');
  }

  const normalized = declaredMimeType.toLowerCase().split(';')[0].trim();
  if (!ALLOWED_AVATAR_MIME_TYPES.has(normalized)) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Profile picture must be a JPEG, PNG, GIF, or WEBP image', 'UPLOAD_REJECTED');
  }

  // Execution/RCE protection is first priority: reject any executable signature
  // or embedded script/PHP tag regardless of what the declared type claims.
  const scan = scanBufferPrefix(buffer.subarray(0, Math.min(buffer.length, 4096)));
  if (!scan.clean) {
    throw new AppError(HttpStatus.BAD_REQUEST, `Profile picture rejected by security scan: ${scan.reason}`, 'UPLOAD_REJECTED_SECURITY_SCAN');
  }

  // Anti-spoofing: the actual bytes must match a real image signature — not
  // just "not dangerous" — and must match the *declared* type specifically,
  // so a `.png`-named JPEG (or a renamed non-image entirely) is rejected too.
  const matchesDeclared = IMAGE_SIGNATURES[normalized]?.(buffer);
  if (!matchesDeclared) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'File content does not match a valid image format', 'UPLOAD_REJECTED');
  }
}
