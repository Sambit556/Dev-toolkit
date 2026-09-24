import { ConversionOptions } from '../types';

// Standard Base32 RFC 4648
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const BASE32HEX_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUV';

// Base58 Bitcoin Alphabet
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

// Z85 Alphabet
const Z85_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.-:+=^!/*?&<>()[]{}@%$#';

// UTF-8 Helper
export const stringToUtf8Bytes = (str: string): Uint8Array => {
  return new TextEncoder().encode(str);
};

export const utf8BytesToString = (bytes: Uint8Array): string => {
  return new TextDecoder().decode(bytes);
};

// ======================== BASE64 / BASE64URL ========================
export function encodeBase64(input: string): string {
  const bytes = stringToUtf8Bytes(input);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decodeBase64(input: string): string {
  let cleaned = input.trim().replace(/[\r\n\s]+/g, '');
  if (!cleaned) return '';
  while (cleaned.length % 4 !== 0) {
    cleaned += '=';
  }
  try {
    const binary = atob(cleaned);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return utf8BytesToString(bytes);
  } catch {
    throw new Error('Invalid Base64 input. Ensure input is a valid Base64 string.');
  }
}

export function encodeBase64Url(input: string): string {
  return encodeBase64(input)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function decodeBase64Url(input: string): string {
  let base64 = input.trim().replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  return decodeBase64(base64);
}

// ======================== BASE32 ========================
export function encodeBase32(input: string, alphabet = BASE32_ALPHABET): string {
  const bytes = stringToUtf8Bytes(input);
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }

  while (output.length % 8 !== 0) {
    output += '=';
  }

  return output;
}

export function decodeBase32(input: string, alphabet = BASE32_ALPHABET): string {
  const cleaned = input.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const idx = alphabet.indexOf(cleaned[i]);
    if (idx === -1) {
      throw new Error(`Invalid Base32 character: "${cleaned[i]}"`);
    }
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return utf8BytesToString(new Uint8Array(bytes));
}

// ======================== BASE58 ========================
export function encodeBase58(input: string): string {
  const bytes = stringToUtf8Bytes(input);
  if (bytes.length === 0) return '';

  const digits = [0];
  for (let i = 0; i < bytes.length; i++) {
    let carry = bytes[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }

  let result = '';
  // Deal with leading zeros
  for (let k = 0; k < bytes.length && bytes[k] === 0; k++) {
    result += BASE58_ALPHABET[0];
  }
  for (let q = digits.length - 1; q >= 0; q--) {
    result += BASE58_ALPHABET[digits[q]];
  }
  return result;
}

export function decodeBase58(input: string): string {
  const cleaned = input.trim();
  if (!cleaned) return '';

  const bytes = [0];
  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    const value = BASE58_ALPHABET.indexOf(char);
    if (value === -1) {
      throw new Error(`Invalid Base58 character: "${char}"`);
    }
    let carry = value;
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }

  // Leading zeros
  for (let k = 0; k < cleaned.length && cleaned[k] === BASE58_ALPHABET[0]; k++) {
    bytes.push(0);
  }

  return utf8BytesToString(new Uint8Array(bytes.reverse()));
}

// ======================== BASE85 / ASCII85 ========================
export function encodeBase85(input: string): string {
  const bytes = stringToUtf8Bytes(input);
  let result = '<~';
  const padding = (4 - (bytes.length % 4)) % 4;
  const paddedBytes = new Uint8Array(bytes.length + padding);
  paddedBytes.set(bytes);

  for (let i = 0; i < paddedBytes.length; i += 4) {
    const value =
      ((paddedBytes[i] << 24) >>> 0) +
      (paddedBytes[i + 1] << 16) +
      (paddedBytes[i + 2] << 8) +
      paddedBytes[i + 3];

    if (value === 0 && padding === 0 && i + 4 <= bytes.length) {
      result += 'z';
      continue;
    }

    const chars = [];
    let current = value;
    for (let j = 0; j < 5; j++) {
      chars.push(String.fromCharCode(33 + (current % 85)));
      current = Math.floor(current / 85);
    }
    const chunk = chars.reverse().join('');
    if (i + 4 > bytes.length) {
      result += chunk.substring(0, 5 - padding);
    } else {
      result += chunk;
    }
  }

  result += '~>';
  return result;
}

export function decodeBase85(input: string): string {
  let cleaned = input.trim();
  if (cleaned.startsWith('<~') && cleaned.endsWith('~>')) {
    cleaned = cleaned.slice(2, -2);
  }
  cleaned = cleaned.replace(/\s+/g, '');
  const bytes: number[] = [];
  let i = 0;

  while (i < cleaned.length) {
    if (cleaned[i] === 'z') {
      bytes.push(0, 0, 0, 0);
      i++;
      continue;
    }

    const chunk = cleaned.slice(i, i + 5);
    const chunkLen = chunk.length;
    let paddedChunk = chunk;
    const padLen = 5 - chunkLen;
    if (padLen > 0) {
      paddedChunk += 'u'.repeat(padLen);
    }

    let value = 0;
    for (let j = 0; j < 5; j++) {
      const code = paddedChunk.charCodeAt(j) - 33;
      if (code < 0 || code >= 85) {
        throw new Error(`Invalid Ascii85 character: "${paddedChunk[j]}"`);
      }
      value = value * 85 + code;
    }

    const b1 = (value >>> 24) & 0xff;
    const b2 = (value >>> 16) & 0xff;
    const b3 = (value >>> 8) & 0xff;
    const b4 = value & 0xff;

    const fullBytes = [b1, b2, b3, b4];
    for (let k = 0; k < 4 - padLen; k++) {
      bytes.push(fullBytes[k]);
    }
    i += chunkLen;
  }

  return utf8BytesToString(new Uint8Array(bytes));
}

// ======================== Z85 (ZeroMQ Base85) ========================
export function encodeZ85(input: string): string {
  const bytes = stringToUtf8Bytes(input);
  const remainder = bytes.length % 4;
  const padding = remainder === 0 ? 0 : 4 - remainder;
  const padded = new Uint8Array(bytes.length + padding);
  padded.set(bytes);

  let result = '';
  for (let i = 0; i < padded.length; i += 4) {
    let value =
      ((padded[i] << 24) >>> 0) +
      (padded[i + 1] << 16) +
      (padded[i + 2] << 8) +
      padded[i + 3];

    let divisor = 85 * 85 * 85 * 85;
    for (let j = 0; j < 5; j++) {
      const idx = Math.floor(value / divisor) % 85;
      result += Z85_ALPHABET[idx];
      divisor = Math.floor(divisor / 85);
    }
  }
  return result;
}

export function decodeZ85(input: string): string {
  const cleaned = input.trim().replace(/\s+/g, '');
  if (cleaned.length % 5 !== 0) {
    throw new Error('Z85 string length must be a multiple of 5');
  }

  const bytes: number[] = [];
  for (let i = 0; i < cleaned.length; i += 5) {
    let value = 0;
    for (let j = 0; j < 5; j++) {
      const idx = Z85_ALPHABET.indexOf(cleaned[i + j]);
      if (idx === -1) {
        throw new Error(`Invalid Z85 character: "${cleaned[i + j]}"`);
      }
      value = value * 85 + idx;
    }
    bytes.push((value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff);
  }
  return utf8BytesToString(new Uint8Array(bytes));
}

// ======================== HEXADECIMAL ========================
export function encodeHex(input: string, options?: ConversionOptions): string {
  const bytes = stringToUtf8Bytes(input);
  const delim = options?.hexDelimiter || 'space';
  const hexArr = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0').toUpperCase());

  if (delim === 'none') return hexArr.join('');
  if (delim === 'colon') return hexArr.join(':');
  if (delim === 'prefix-0x') return hexArr.map((h) => `0x${h}`).join(' ');
  if (delim === 'escaped') return hexArr.map((h) => `\\x${h.toLowerCase()}`).join('');
  return hexArr.join(' ');
}

export function decodeHex(input: string): string {
  const hex = input.replace(/0x|\\x|[^0-9A-Fa-f]/g, '');
  if (hex.length % 2 !== 0) {
    throw new Error('Hexadecimal string has an odd number of nibbles');
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return utf8BytesToString(bytes);
}

// ======================== BINARY ========================
export function encodeBinary(input: string, spaced = true): string {
  const bytes = stringToUtf8Bytes(input);
  const binArr = Array.from(bytes).map((b) => b.toString(2).padStart(8, '0'));
  return binArr.join(spaced ? ' ' : '');
}

export function decodeBinary(input: string): string {
  const bin = input.replace(/[^01]/g, '');
  if (bin.length === 0) return '';
  if (bin.length % 8 !== 0) {
    // Pad leading zeros if partial
    const padded = bin.padStart(Math.ceil(bin.length / 8) * 8, '0');
    const bytes = new Uint8Array(padded.length / 8);
    for (let i = 0; i < padded.length; i += 8) {
      bytes[i / 8] = parseInt(padded.substring(i, i + 8), 2);
    }
    return utf8BytesToString(bytes);
  }
  const bytes = new Uint8Array(bin.length / 8);
  for (let i = 0; i < bin.length; i += 8) {
    bytes[i / 8] = parseInt(bin.substring(i, i + 8), 2);
  }
  return utf8BytesToString(bytes);
}

// ======================== OCTAL ========================
export function encodeOctal(input: string): string {
  const bytes = stringToUtf8Bytes(input);
  return Array.from(bytes)
    .map((b) => b.toString(8).padStart(3, '0'))
    .join(' ');
}

export function decodeOctal(input: string): string {
  const octals = input.trim().replace(/\\0/g, ' ').split(/[^0-7]+/).filter(Boolean);
  const bytes = new Uint8Array(octals.map((o) => parseInt(o, 8)));
  return utf8BytesToString(bytes);
}

// ======================== DECIMAL BYTE ARRAY ========================
export function encodeDecimal(input: string): string {
  const bytes = stringToUtf8Bytes(input);
  return Array.from(bytes).join(', ');
}

export function decodeDecimal(input: string): string {
  const nums = input.replace(/[[\]]/g, '').split(/[\s,]+/).filter(Boolean);
  const bytes = new Uint8Array(nums.map((n) => parseInt(n, 10)));
  return utf8BytesToString(bytes);
}

// ======================== UNICODE ESCAPES ========================
export function encodeUnicode(input: string): string {
  return Array.from(input)
    .map((char) => {
      const code = char.codePointAt(0) || 0;
      return `\\u${code.toString(16).padStart(4, '0').toUpperCase()}`;
    })
    .join('');
}

export function decodeUnicode(input: string): string {
  return input.replace(/\\u([0-9a-fA-F]{4})|\\u\{([0-9a-fA-F]+)\}|U\+([0-9a-fA-F]{4,6})/g, (_, g1, g2, g3) => {
    const hex = g1 || g2 || g3;
    return String.fromCodePoint(parseInt(hex, 16));
  });
}

// ======================== URL ENCODING ========================
export function encodeUrl(input: string, full = false): string {
  if (full) {
    return Array.from(stringToUtf8Bytes(input))
      .map((b) => '%' + b.toString(16).padStart(2, '0').toUpperCase())
      .join('');
  }
  return encodeURIComponent(input);
}

export function decodeUrl(input: string): string {
  return decodeURIComponent(input.replace(/\+/g, ' '));
}

// ======================== HTML ENTITIES ========================
export function encodeHtmlEntities(input: string): string {
  return input.replace(/[&<>"']/g, (m) => {
    switch (m) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return m;
    }
  });
}

export function decodeHtmlEntities(input: string): string {
  if (typeof document !== 'undefined') {
    const doc = new DOMParser().parseFromString(input, 'text/html');
    return doc.documentElement.textContent || '';
  }
  return input
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
}

// ======================== PUNYCODE (IDNA) ========================
// RFC 3492 implementation
const PUNYCODE_BASE = 36;
const PUNYCODE_TMIN = 1;
const PUNYCODE_TMAX = 26;
const PUNYCODE_SKEW = 38;
const PUNYCODE_DAMP = 700;
const PUNYCODE_INITIAL_BIAS = 72;
const PUNYCODE_INITIAL_N = 128;

function adaptPunycode(delta: number, numpoints: number, firsttime: boolean): number {
  delta = firsttime ? Math.floor(delta / PUNYCODE_DAMP) : delta >> 1;
  delta += Math.floor(delta / numpoints);
  let k = 0;
  while (delta > (((PUNYCODE_BASE - PUNYCODE_TMIN) * PUNYCODE_TMAX) >> 1)) {
    delta = Math.floor(delta / (PUNYCODE_BASE - PUNYCODE_TMIN));
    k += PUNYCODE_BASE;
  }
  return Math.floor(k + ((PUNYCODE_BASE - PUNYCODE_TMIN + 1) * delta) / (delta + PUNYCODE_SKEW));
}

export function encodePunycode(input: string): string {
  const parts = input.split('.');
  const encodedParts = parts.map((part) => {
    // If pure ASCII, no transformation needed
    if (/^[\x00-\x7F]*$/.test(part)) return part;

    const codePoints = Array.from(part).map((c) => c.codePointAt(0)!);
    const basicChars = codePoints.filter((c) => c < 0x80);
    let output = basicChars.map((c) => String.fromCharCode(c)).join('');
    let handled = basicChars.length;
    const basicCount = handled;

    if (basicCount > 0) output += '-';

    let n = PUNYCODE_INITIAL_N;
    let delta = 0;
    let bias = PUNYCODE_INITIAL_BIAS;

    while (handled < codePoints.length) {
      let m = 0x7fffffff;
      for (const cp of codePoints) {
        if (cp >= n && cp < m) m = cp;
      }

      delta += (m - n) * (handled + 1);
      n = m;

      for (const cp of codePoints) {
        if (cp < n) delta++;
        if (cp === n) {
          let q = delta;
          for (let k = PUNYCODE_BASE; ; k += PUNYCODE_BASE) {
            const t = k <= bias ? PUNYCODE_TMIN : k >= bias + PUNYCODE_TMAX ? PUNYCODE_TMAX : k - bias;
            if (q < t) break;
            const digit = t + ((q - t) % (PUNYCODE_BASE - t));
            output += String.fromCharCode(digit < 26 ? digit + 97 : digit - 26 + 48);
            q = Math.floor((q - t) / (PUNYCODE_BASE - t));
          }
          output += String.fromCharCode(q < 26 ? q + 97 : q - 26 + 48);
          bias = adaptPunycode(delta, handled + 1, handled === basicCount);
          delta = 0;
          handled++;
        }
      }
      delta++;
      n++;
    }
    return 'xn--' + output;
  });
  return encodedParts.join('.');
}

export function decodePunycode(input: string): string {
  const parts = input.split('.');
  const decodedParts = parts.map((part) => {
    if (!part.toLowerCase().startsWith('xn--')) return part;
    const encoded = part.slice(4);
    const codePoints: number[] = [];
    const lastDelim = encoded.lastIndexOf('-');
    let pos = 0;

    if (lastDelim > 0) {
      for (let i = 0; i < lastDelim; i++) {
        codePoints.push(encoded.charCodeAt(i));
      }
      pos = lastDelim + 1;
    }

    let n = PUNYCODE_INITIAL_N;
    let i = 0;
    let bias = PUNYCODE_INITIAL_BIAS;

    while (pos < encoded.length) {
      const oldi = i;
      let w = 1;
      for (let k = PUNYCODE_BASE; ; k += PUNYCODE_BASE) {
        if (pos >= encoded.length) throw new Error('Invalid Punycode string');
        const char = encoded.charCodeAt(pos++);
        let digit = char - 48 < 10 ? char - 22 : char - 65 < 26 ? char - 65 : char - 97 < 26 ? char - 97 : PUNYCODE_BASE;
        if (digit >= PUNYCODE_BASE) throw new Error('Invalid Punycode character');
        i += digit * w;
        const t = k <= bias ? PUNYCODE_TMIN : k >= bias + PUNYCODE_TMAX ? PUNYCODE_TMAX : k - bias;
        if (digit < t) break;
        w *= PUNYCODE_BASE - t;
      }
      bias = adaptPunycode(i - oldi, codePoints.length + 1, oldi === 0);
      n += Math.floor(i / (codePoints.length + 1));
      i %= codePoints.length + 1;
      codePoints.splice(i, 0, n);
      i++;
    }
    return String.fromCodePoint(...codePoints);
  });
  return decodedParts.join('.');
}

// ======================== QUOTED-PRINTABLE ========================
export function encodeQuotedPrintable(input: string): string {
  const bytes = stringToUtf8Bytes(input);
  let output = '';
  let lineLen = 0;

  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    let encoded = '';
    // printable ASCII characters (excluding = and control characters)
    if ((b >= 33 && b <= 60) || (b >= 62 && b <= 126)) {
      encoded = String.fromCharCode(b);
    } else if (b === 32 || b === 9) {
      // Space or tab
      encoded = String.fromCharCode(b);
    } else if (b === 13 && bytes[i + 1] === 10) {
      // CRLF
      output += '\r\n';
      lineLen = 0;
      i++;
      continue;
    } else {
      encoded = '=' + b.toString(16).padStart(2, '0').toUpperCase();
    }

    if (lineLen + encoded.length > 75) {
      output += '=\r\n';
      lineLen = 0;
    }
    output += encoded;
    lineLen += encoded.length;
  }
  return output;
}

export function decodeQuotedPrintable(input: string): string {
  // Remove soft linebreaks
  const cleaned = input.replace(/=\r?\n/g, '');
  const bytes: number[] = [];
  let i = 0;
  while (i < cleaned.length) {
    if (cleaned[i] === '=' && i + 2 < cleaned.length) {
      const hex = cleaned.substring(i + 1, i + 3);
      if (/^[0-9A-Fa-f]{2}$/.test(hex)) {
        bytes.push(parseInt(hex, 16));
        i += 3;
        continue;
      }
    }
    bytes.push(cleaned.charCodeAt(i));
    i++;
  }
  return utf8BytesToString(new Uint8Array(bytes));
}

// ======================== UUENCODE ========================
export function encodeUUEncode(input: string, filename = 'file.txt'): string {
  const bytes = stringToUtf8Bytes(input);
  let output = `begin 644 ${filename}\n`;

  let offset = 0;
  while (offset < bytes.length) {
    const chunkSize = Math.min(45, bytes.length - offset);
    const chunk = bytes.slice(offset, offset + chunkSize);
    offset += chunkSize;

    output += String.fromCharCode(chunkSize + 32);

    for (let i = 0; i < chunk.length; i += 3) {
      const b0 = chunk[i] || 0;
      const b1 = chunk[i + 1] || 0;
      const b2 = chunk[i + 2] || 0;

      const c0 = (b0 >> 2) & 0x3f;
      const c1 = (((b0 << 4) | (b1 >> 4)) & 0x3f);
      const c2 = (((b1 << 2) | (b2 >> 6)) & 0x3f);
      const c3 = (b2 & 0x3f);

      output += String.fromCharCode(c0 ? c0 + 32 : 96);
      output += String.fromCharCode(c1 ? c1 + 32 : 96);
      output += String.fromCharCode(c2 ? c2 + 32 : 96);
      output += String.fromCharCode(c3 ? c3 + 32 : 96);
    }
    output += '\n';
  }

  output += '`\nend\n';
  return output;
}

export function decodeUUEncode(input: string): string {
  const lines = input.trim().split(/\r?\n/);
  const bytes: number[] = [];

  for (const line of lines) {
    if (line.startsWith('begin ') || line === 'end' || line === '`' || !line) {
      continue;
    }

    const lineLen = line.charCodeAt(0) - 32;
    if (lineLen <= 0 || lineLen > 45) continue;

    let lineBytes: number[] = [];
    for (let i = 1; i < line.length; i += 4) {
      const c0 = (line.charCodeAt(i) - 32) & 0x3f;
      const c1 = (line.charCodeAt(i + 1) - 32) & 0x3f;
      const c2 = (line.charCodeAt(i + 2) - 32) & 0x3f;
      const c3 = (line.charCodeAt(i + 3) - 32) & 0x3f;

      const b0 = ((c0 << 2) | (c1 >> 4)) & 0xff;
      const b1 = ((c1 << 4) | (c2 >> 2)) & 0xff;
      const b2 = ((c2 << 6) | c3) & 0xff;

      lineBytes.push(b0, b1, b2);
    }
    lineBytes = lineBytes.slice(0, lineLen);
    bytes.push(...lineBytes);
  }

  return utf8BytesToString(new Uint8Array(bytes));
}
