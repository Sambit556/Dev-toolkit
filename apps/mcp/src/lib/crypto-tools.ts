import bcrypt from 'bcryptjs';

const BASE32_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function randomBytes(size: number): Uint8Array {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return bytes;
}

export function generatePassword(opts: {
  length: number;
  upper: boolean;
  lower: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeSimilar: boolean;
}): string {
  let charset = '';
  if (opts.lower) charset += 'abcdefghijklmnopqrstuvwxyz';
  if (opts.upper) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (opts.numbers) charset += '0123456789';
  if (opts.symbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
  if (opts.excludeSimilar) charset = charset.replace(/[il1Lo0O!|;:,.]/g, '');
  if (!charset) throw new Error('At least one character set must be enabled');

  const bytes = randomBytes(opts.length);
  let password = '';
  for (let i = 0; i < opts.length; i++) password += charset[bytes[i] % charset.length];
  return password;
}

export function passwordEntropy(pass: string): { entropyBits: number; rating: string } {
  if (!pass) return { entropyBits: 0, rating: 'Empty' };
  let pool = 0;
  if (/[a-z]/.test(pass)) pool += 26;
  if (/[A-Z]/.test(pass)) pool += 26;
  if (/[0-9]/.test(pass)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(pass)) pool += 32;
  const entropyBits = Math.round(pass.length * Math.log2(pool || 1));
  let rating = 'Weak';
  if (entropyBits >= 80) rating = 'Very Strong';
  else if (entropyBits >= 60) rating = 'Strong';
  else if (entropyBits >= 40) rating = 'Fair';
  return { entropyBits, rating };
}

export function generateSecureToken(type: string, length: number, count: number): string[] {
  const tokens: string[] = [];
  for (let c = 0; c < count; c++) {
    if (type === 'hex') {
      const bytes = randomBytes(Math.ceil(length / 2));
      tokens.push(Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('').substring(0, length));
    } else if (type === 'base64' || type === 'base64url') {
      const bytes = randomBytes(length);
      let b64 = Buffer.from(bytes).toString('base64');
      if (type === 'base64url') b64 = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      tokens.push(b64.substring(0, length));
    } else if (type === 'uuid') {
      tokens.push(crypto.randomUUID());
    } else {
      let chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      if (type === 'alpha') chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const bytes = randomBytes(length);
      let tok = '';
      for (let i = 0; i < length; i++) tok += chars[bytes[i] % chars.length];
      tokens.push(tok);
    }
  }
  return tokens;
}

export function generateUuidV4(): string {
  return crypto.randomUUID();
}

export function generateUuidV1(): string {
  const GregorianEpochOffset = BigInt('122192928000000000');
  const now = BigInt(Date.now());
  const offset100ns = BigInt(Math.floor(Math.random() * 10000));
  const time = now * BigInt(10000) + GregorianEpochOffset + offset100ns;
  const timeHex = time.toString(16).padStart(16, '0');
  const timeLow = timeHex.substring(8, 16);
  const timeMid = timeHex.substring(4, 8);
  const timeHiAndVersion = '1' + timeHex.substring(1, 4);
  const clockSeq = (Math.floor(Math.random() * 0x3fff) | 0x8000).toString(16).padStart(4, '0');
  const node = Array.from({ length: 6 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');
  return `${timeLow}-${timeMid}-${timeHiAndVersion}-${clockSeq}-${node}`;
}

export function generateUlid(timestamp = Date.now()): string {
  let timeStr = '';
  let time = timestamp;
  for (let i = 9; i >= 0; i--) {
    const mod = time % 32;
    timeStr = BASE32_ALPHABET[mod] + timeStr;
    time = Math.floor(time / 32);
  }
  const bytes = randomBytes(16);
  let randStr = '';
  for (let i = 0; i < 16; i++) randStr += BASE32_ALPHABET[bytes[i] % 32];
  return timeStr + randStr;
}

export function generateNanoId(
  size = 21,
  alphabet = 'ModuleSymbhasOwnPr-0123456789ABCDEFGHNRVfgctiUOpqradsjhUXVWhwzI',
): string {
  const bytes = randomBytes(size);
  let id = '';
  for (let i = 0; i < size; i++) id += alphabet[bytes[i] % alphabet.length];
  return id;
}

function uuidToBytes(uuid: string): Uint8Array {
  const clean = uuid.replace(/-/g, '');
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) bytes[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
  return bytes;
}
function bytesToUuid(bytes: Uint8Array): string {
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
}

export async function generateUuidV5(namespaceUuid: string, name: string): Promise<string> {
  const nsBytes = uuidToBytes(namespaceUuid);
  const nameBytes = new TextEncoder().encode(name);
  const combined = new Uint8Array(nsBytes.length + nameBytes.length);
  combined.set(nsBytes);
  combined.set(nameBytes, nsBytes.length);
  const hashBuffer = await crypto.subtle.digest('SHA-1', combined);
  const hashBytes = new Uint8Array(hashBuffer);
  hashBytes[6] = (hashBytes[6] & 0x0f) | 0x50;
  hashBytes[8] = (hashBytes[8] & 0x3f) | 0x80;
  return bytesToUuid(hashBytes.subarray(0, 16));
}

export interface UuidV1Details {
  timestamp: string;
  node: string;
  clockSequence: string;
}

export function decodeUuidV1(uuid: string): UuidV1Details | null {
  const cleanUuid = uuid.trim().toLowerCase();
  const parts = cleanUuid.split('-');
  if (parts.length !== 5 || cleanUuid[14] !== '1') return null;
  try {
    const [timeLow, timeMid, timeHiAndVersion, clockSequence, node] = parts;
    const timeHi = timeHiAndVersion.substring(1, 4);
    const timeHex = timeHi + timeMid + timeLow;
    const gTimestamp = BigInt(`0x${timeHex}`);
    const GregorianEpochOffset = BigInt('122192928000000000');
    const unixMs = Number((gTimestamp - GregorianEpochOffset) / BigInt(10000));
    const formattedMac = node.match(/.{1,2}/g)?.join(':') || node;
    return {
      timestamp: new Date(unixMs).toISOString(),
      node: formattedMac.toUpperCase(),
      clockSequence: `0x${clockSequence}`,
    };
  } catch {
    return null;
  }
}

export async function computeHmac(message: string, key: string, algo: string): Promise<{ hex: string; base64: string }> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'HMAC', hash: { name: algo } },
    false,
    ['sign'],
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const hex = signatureArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  const base64 = Buffer.from(signatureArray).toString('base64');
  return { hex, base64 };
}

export function bcryptHash(password: string, rounds: number): string {
  const salt = bcrypt.genSaltSync(rounds);
  return bcrypt.hashSync(password, salt);
}

export function bcryptVerify(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}
