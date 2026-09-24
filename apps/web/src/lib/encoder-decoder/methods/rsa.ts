import CryptoJS from 'crypto-js';
import { ConversionOptions } from '../types';

// ======================== BIGINT CONSTANTS & ARITHMETIC ========================

const ZERO = BigInt(0);
const ONE = BigInt(1);
const TWO = BigInt(2);
const THREE = BigInt(3);
const E_DEFAULT = BigInt(65537);

export function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  if (mod === ONE) return ZERO;
  let result = ONE;
  base = base % mod;
  if (base < ZERO) base += mod;
  while (exp > ZERO) {
    if ((exp & ONE) === ONE) result = (result * base) % mod;
    base = (base * base) % mod;
    exp >>= ONE;
  }
  return result;
}

export function gcd(a: bigint, b: bigint): bigint {
  while (b > ZERO) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

export function modInverse(a: bigint, m: bigint): bigint {
  let [m0, y, x] = [m, ZERO, ONE];
  if (m === ONE) return ZERO;
  a = ((a % m) + m) % m;
  while (a > ONE) {
    if (m0 === ZERO) throw new Error('Modular inverse does not exist (numbers not coprime)');
    const q = a / m0;
    let t = m0;
    m0 = a % m0;
    a = t;
    t = y;
    y = x - q * y;
    x = t;
  }
  if (x < ZERO) x += m;
  return x;
}

export function bytesToBigInt(bytes: Uint8Array): bigint {
  let res = ZERO;
  for (let i = 0; i < bytes.length; i++) {
    res = (res << BigInt(8)) | BigInt(bytes[i]);
  }
  return res;
}

export function bigIntToBytes(n: bigint, targetLength?: number): Uint8Array {
  if (n === ZERO) {
    return new Uint8Array(targetLength || 1);
  }
  const hex = n.toString(16);
  const paddedHex = hex.length % 2 === 0 ? hex : '0' + hex;
  const byteLen = paddedHex.length / 2;
  const rawBytes = new Uint8Array(byteLen);
  for (let i = 0; i < byteLen; i++) {
    rawBytes[i] = parseInt(paddedHex.substring(i * 2, i * 2 + 2), 16);
  }

  if (targetLength !== undefined) {
    if (rawBytes.length === targetLength) {
      return rawBytes;
    }
    if (rawBytes.length < targetLength) {
      const out = new Uint8Array(targetLength);
      out.set(rawBytes, targetLength - rawBytes.length);
      return out;
    }
    // If rawBytes has leading zero that can be trimmed
    let start = 0;
    while (start < rawBytes.length - targetLength && rawBytes[start] === 0) {
      start++;
    }
    return rawBytes.subarray(start);
  }
  return rawBytes;
}

function encodeUtf8(str: string): Uint8Array {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str);
  }
  const unescaped = unescape(encodeURIComponent(str));
  const bytes = new Uint8Array(unescaped.length);
  for (let i = 0; i < unescaped.length; i++) bytes[i] = unescaped.charCodeAt(i);
  return bytes;
}

function decodeUtf8(bytes: Uint8Array): string {
  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder().decode(bytes);
  }
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return decodeURIComponent(escape(bin));
}

function getRandomBytes(len: number): Uint8Array {
  const bytes = new Uint8Array(len);
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < len; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return bytes;
}

// ======================== PRIME GENERATION (MILLER-RABIN) ========================

const SMALL_PRIMES = [
  3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67,
  71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139,
  149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223,
  227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293,
].map((n) => BigInt(n));

function isMillerRabinProbablePrime(n: bigint, rounds = 24): boolean {
  if (n <= ONE) return false;
  if (n === TWO || n === THREE) return true;
  if ((n & ONE) === ZERO) return false;

  // Fast pre-filter using small primes
  for (let i = 0; i < SMALL_PRIMES.length; i++) {
    const p = SMALL_PRIMES[i];
    if (n === p) return true;
    if (n % p === ZERO) return false;
  }

  // Write n - 1 as 2^s * d
  let d = n - ONE;
  let s = ZERO;
  while ((d & ONE) === ZERO) {
    d >>= ONE;
    s += ONE;
  }

  const nMinus1 = n - ONE;
  const nMinus3 = n - THREE;

  for (let r = 0; r < rounds; r++) {
    // Generate random base a in [2, n - 2]
    const byteLen = (n.toString(2).length + 7) >> 3;
    let a: bigint;
    do {
      const randBytes = getRandomBytes(byteLen);
      a = (bytesToBigInt(randBytes) % nMinus3) + TWO;
    } while (a <= ONE || a >= nMinus1);

    let x = modPow(a, d, n);
    if (x === ONE || x === nMinus1) continue;

    let composite = true;
    for (let i = ONE; i < s; i += ONE) {
      x = (x * x) % n;
      if (x === nMinus1) {
        composite = false;
        break;
      }
      if (x === ONE) return false;
    }
    if (composite) return false;
  }
  return true;
}

function generatePrime(bits: number): bigint {
  const bytesNeeded = (bits + 7) >> 3;
  while (true) {
    const bytes = getRandomBytes(bytesNeeded);
    // Ensure exact bit length and odd
    bytes[0] |= 0xc0; // Set two highest bits so product p*q has 2*bits length
    bytes[bytesNeeded - 1] |= 0x01; // Ensure odd
    const candidate = bytesToBigInt(bytes);
    if (isMillerRabinProbablePrime(candidate)) {
      return candidate;
    }
  }
}

// ======================== ASN.1 DER ENCODING / PARSING ========================

function encodeDerLength(len: number): Uint8Array {
  if (len < 128) {
    return new Uint8Array([len]);
  }
  const bytes: number[] = [];
  let temp = len;
  while (temp > 0) {
    bytes.unshift(temp & 0xff);
    temp >>= 8;
  }
  return new Uint8Array([0x80 | bytes.length, ...bytes]);
}

function encodeDerInteger(n: bigint): Uint8Array {
  let hex = n.toString(16);
  if (hex.length % 2 !== 0) hex = '0' + hex;
  const raw: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    raw.push(parseInt(hex.substring(i, i + 2), 16));
  }
  // If highest bit is 1, prefix with 0x00 to denote positive signed integer
  if ((raw[0] & 0x80) !== 0) {
    raw.unshift(0x00);
  }
  const content = new Uint8Array(raw);
  const lenBytes = encodeDerLength(content.length);
  const result = new Uint8Array(1 + lenBytes.length + content.length);
  result[0] = 0x02; // Tag INTEGER
  result.set(lenBytes, 1);
  result.set(content, 1 + lenBytes.length);
  return result;
}

function encodeDerSequence(elements: Uint8Array[]): Uint8Array {
  const totalLen = elements.reduce((acc, el) => acc + el.length, 0);
  const lenBytes = encodeDerLength(totalLen);
  const out = new Uint8Array(1 + lenBytes.length + totalLen);
  out[0] = 0x30; // Tag SEQUENCE
  out.set(lenBytes, 1);
  let offset = 1 + lenBytes.length;
  for (const el of elements) {
    out.set(el, offset);
    offset += el.length;
  }
  return out;
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8(base64: string): Uint8Array {
  let cleaned = (base64 || '').replace(/[\r\n\s]+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  if (!cleaned) return new Uint8Array(0);
  while (cleaned.length % 4 !== 0) {
    cleaned += '=';
  }
  // Sanitize characters
  cleaned = cleaned.replace(/[^A-Za-z0-9+/=]/g, '');
  if (!cleaned) return new Uint8Array(0);

  try {
    const binary = atob(cleaned);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    throw new Error('Invalid Base64 / PEM encoding format.');
  }
}

function formatPem(header: string, base64: string): string {
  const lines: string[] = [`-----BEGIN ${header}-----`];
  for (let i = 0; i < base64.length; i += 64) {
    lines.push(base64.substring(i, i + 64));
  }
  lines.push(`-----END ${header}-----`);
  return lines.join('\n');
}

// ASN.1 DER Parser
class DerReader {
  private offset = 0;
  constructor(private buffer: Uint8Array) {}

  hasMore(): boolean {
    return this.offset < this.buffer.length;
  }

  peekTag(): number {
    return this.buffer[this.offset];
  }

  readTag(): number {
    return this.buffer[this.offset++];
  }

  readLength(): number {
    const first = this.buffer[this.offset++];
    if ((first & 0x80) === 0) {
      return first;
    }
    const byteCount = first & 0x7f;
    let len = 0;
    for (let i = 0; i < byteCount; i++) {
      len = (len << 8) | this.buffer[this.offset++];
    }
    return len;
  }

  readInteger(): bigint {
    const tag = this.readTag();
    if (tag !== 0x02) throw new Error(`Expected ASN.1 INTEGER (0x02), got 0x${tag.toString(16)}`);
    const len = this.readLength();
    const bytes = this.buffer.subarray(this.offset, this.offset + len);
    this.offset += len;
    return bytesToBigInt(bytes);
  }

  readSequence(): DerReader {
    const tag = this.readTag();
    if (tag !== 0x30) throw new Error(`Expected ASN.1 SEQUENCE (0x30), got 0x${tag.toString(16)}`);
    const len = this.readLength();
    const seqBytes = this.buffer.subarray(this.offset, this.offset + len);
    this.offset += len;
    return new DerReader(seqBytes);
  }

  readOctetString(): Uint8Array {
    const tag = this.readTag();
    if (tag !== 0x04) throw new Error(`Expected ASN.1 OCTET STRING (0x04), got 0x${tag.toString(16)}`);
    const len = this.readLength();
    const bytes = this.buffer.subarray(this.offset, this.offset + len);
    this.offset += len;
    return bytes;
  }

  readBitString(): Uint8Array {
    const tag = this.readTag();
    if (tag !== 0x03) throw new Error(`Expected ASN.1 BIT STRING (0x03), got 0x${tag.toString(16)}`);
    const len = this.readLength();
    this.offset++; // First byte is unused bit count
    const bytes = this.buffer.subarray(this.offset, this.offset + len - 1);
    this.offset += len - 1;
    return bytes;
  }

  skipValue(): void {
    this.readTag();
    const len = this.readLength();
    this.offset += len;
  }
}

// ======================== KEY PARSING & GENERATION ========================

export interface RsaPublicKey {
  n: bigint;
  e: bigint;
  bitLength: number;
}

export interface RsaPrivateKey {
  n: bigint;
  e: bigint;
  d: bigint;
  p?: bigint;
  q?: bigint;
  dp?: bigint;
  dq?: bigint;
  qinv?: bigint;
  bitLength: number;
}

export interface RsaKeyPair {
  publicKey: string;
  privateKey: string;
  bitLength: number;
}

function cleanPem(pemStr: string): Uint8Array {
  const stripped = pemStr
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s+/g, '');
  return base64ToUint8(stripped);
}

export function parseRsaPublicKey(pemOrDer: string | Uint8Array): RsaPublicKey {
  const der = typeof pemOrDer === 'string' ? cleanPem(pemOrDer) : pemOrDer;
  const reader = new DerReader(der);

  try {
    const rootSeq = reader.readSequence();
    const firstTag = rootSeq.peekTag();

    // Check if SPKI format: SEQUENCE { AlgorithmIdentifier, BIT STRING { RSAPublicKey } }
    if (firstTag === 0x30) {
      rootSeq.skipValue(); // Skip AlgorithmIdentifier
      const bitString = rootSeq.readBitString();
      const innerReader = new DerReader(bitString).readSequence();
      const n = innerReader.readInteger();
      const e = innerReader.readInteger();
      return { n, e, bitLength: n.toString(2).length };
    }

    // Direct PKCS#1 RSAPublicKey: SEQUENCE { modulus, publicExponent }
    const n = rootSeq.readInteger();
    const e = rootSeq.readInteger();
    return { n, e, bitLength: n.toString(2).length };
  } catch (err: any) {
    throw new Error(`Failed to parse RSA Public Key. Ensure it is valid PEM or DER format: ${err.message}`);
  }
}

export function parseRsaPrivateKey(pemOrDer: string | Uint8Array): RsaPrivateKey {
  const der = typeof pemOrDer === 'string' ? cleanPem(pemOrDer) : pemOrDer;
  const reader = new DerReader(der);

  try {
    const rootSeq = reader.readSequence();
    rootSeq.readInteger(); // version

    // Check if PKCS#8 format: SEQUENCE { version (0), AlgorithmIdentifier, OCTET STRING { RSAPrivateKey } }
    if (rootSeq.peekTag() === 0x30) {
      rootSeq.skipValue(); // Skip AlgorithmIdentifier
      const octetString = rootSeq.readOctetString();
      const innerSeq = new DerReader(octetString).readSequence();
      innerSeq.readInteger(); // inner version
      const n = innerSeq.readInteger();
      const e = innerSeq.readInteger();
      const d = innerSeq.readInteger();
      const p = innerSeq.readInteger();
      const q = innerSeq.readInteger();
      const dp = innerSeq.readInteger();
      const dq = innerSeq.readInteger();
      const qinv = innerSeq.readInteger();
      return { n, e, d, p, q, dp, dq, qinv, bitLength: n.toString(2).length };
    }

    // Direct PKCS#1 RSAPrivateKey: SEQUENCE { version, n, e, d, p, q, dp, dq, qinv }
    const n = rootSeq.readInteger();
    const e = rootSeq.readInteger();
    const d = rootSeq.readInteger();
    let p: bigint | undefined;
    let q: bigint | undefined;
    let dp: bigint | undefined;
    let dq: bigint | undefined;
    let qinv: bigint | undefined;

    if (rootSeq.hasMore()) p = rootSeq.readInteger();
    if (rootSeq.hasMore()) q = rootSeq.readInteger();
    if (rootSeq.hasMore()) dp = rootSeq.readInteger();
    if (rootSeq.hasMore()) dq = rootSeq.readInteger();
    if (rootSeq.hasMore()) qinv = rootSeq.readInteger();

    return { n, e, d, p, q, dp, dq, qinv, bitLength: n.toString(2).length };
  } catch (err: any) {
    throw new Error(`Failed to parse RSA Private Key. Ensure it is valid PEM or DER format: ${err.message}`);
  }
}

export function exportRsaPublicKeyPem(key: { n: bigint; e: bigint }): string {
  // Build SPKI: SEQUENCE { SEQUENCE { OID rsaEncryption, NULL }, BIT STRING { RSAPublicKey } }
  const rsaPubDer = encodeDerSequence([encodeDerInteger(key.n), encodeDerInteger(key.e)]);
  // OID 1.2.840.113549.1.1.1 (rsaEncryption) + NULL
  const algIdDer = new Uint8Array([
    0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00,
  ]);

  // BIT STRING: tag 0x03, length, 0x00 (unused bits), content
  const bitStringLen = encodeDerLength(rsaPubDer.length + 1);
  const bitString = new Uint8Array(1 + bitStringLen.length + 1 + rsaPubDer.length);
  bitString[0] = 0x03;
  bitString.set(bitStringLen, 1);
  bitString[1 + bitStringLen.length] = 0x00; // 0 unused bits
  bitString.set(rsaPubDer, 1 + bitStringLen.length + 1);

  const spkiDer = encodeDerSequence([algIdDer, bitString]);
  return formatPem('PUBLIC KEY', uint8ToBase64(spkiDer));
}

export function exportRsaPrivateKeyPem(key: RsaPrivateKey): string {
  // Build PKCS#1 RSAPrivateKey
  const pkcs1Der = encodeDerSequence([
    encodeDerInteger(ZERO), // version
    encodeDerInteger(key.n),
    encodeDerInteger(key.e),
    encodeDerInteger(key.d),
    encodeDerInteger(key.p || ZERO),
    encodeDerInteger(key.q || ZERO),
    encodeDerInteger(key.dp || ZERO),
    encodeDerInteger(key.dq || ZERO),
    encodeDerInteger(key.qinv || ZERO),
  ]);

  // Build PKCS#8 PrivateKeyInfo: SEQUENCE { version(0), algId, OCTET STRING(pkcs1Der) }
  const algIdDer = new Uint8Array([
    0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00,
  ]);
  const octetLen = encodeDerLength(pkcs1Der.length);
  const octetString = new Uint8Array(1 + octetLen.length + pkcs1Der.length);
  octetString[0] = 0x04;
  octetString.set(octetLen, 1);
  octetString.set(pkcs1Der, 1 + octetLen.length);

  const pkcs8Der = encodeDerSequence([encodeDerInteger(ZERO), algIdDer, octetString]);
  return formatPem('PRIVATE KEY', uint8ToBase64(pkcs8Der));
}

export function getPublicKeyFromPrivateKey(privateKeyPem: string): string {
  const parsed = parseRsaPrivateKey(privateKeyPem);
  return exportRsaPublicKeyPem({ n: parsed.n, e: parsed.e });
}

export function generateRsaKeyPair(bitLength: 1024 | 2048 | 4096 = 2048): RsaKeyPair {
  const halfBits = bitLength >> 1;
  const e = E_DEFAULT;

  while (true) {
    const p = generatePrime(halfBits);
    let q = generatePrime(halfBits);
    while (p === q) {
      q = generatePrime(halfBits);
    }

    const n = p * q;
    // Check actual bit length
    if (n.toString(2).length !== bitLength) {
      continue;
    }

    const phi = (p - ONE) * (q - ONE);
    if (gcd(e, phi) !== ONE) {
      continue;
    }

    const d = modInverse(e, phi);
    const dp = d % (p - ONE);
    const dq = d % (q - ONE);
    const qinv = modInverse(q, p);

    const privKey: RsaPrivateKey = {
      n,
      e,
      d,
      p,
      q,
      dp,
      dq,
      qinv,
      bitLength,
    };

    const privateKeyPem = exportRsaPrivateKeyPem(privKey);
    const publicKeyPem = exportRsaPublicKeyPem({ n, e });

    return {
      publicKey: publicKeyPem,
      privateKey: privateKeyPem,
      bitLength,
    };
  }
}

// ======================== HASHES & MGF1 FOR OAEP ========================

function hashSha256(data: Uint8Array): Uint8Array {
  const words: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    words.push(
      ((data[i] || 0) << 24) |
      ((data[i + 1] || 0) << 16) |
      ((data[i + 2] || 0) << 8) |
      (data[i + 3] || 0)
    );
  }
  const wordArray = CryptoJS.lib.WordArray.create(words, data.length);
  const hash = CryptoJS.SHA256(wordArray);
  const hex = hash.toString(CryptoJS.enc.Hex);
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    out[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return out;
}

function hashSha1(data: Uint8Array): Uint8Array {
  const words: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    words.push(
      ((data[i] || 0) << 24) |
      ((data[i + 1] || 0) << 16) |
      ((data[i + 2] || 0) << 8) |
      (data[i + 3] || 0)
    );
  }
  const wordArray = CryptoJS.lib.WordArray.create(words, data.length);
  const hash = CryptoJS.SHA1(wordArray);
  const hex = hash.toString(CryptoJS.enc.Hex);
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    out[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return out;
}

function mgf1(mgfSeed: Uint8Array, maskLen: number, hashFn: (d: Uint8Array) => Uint8Array): Uint8Array {
  const mask = new Uint8Array(maskLen);
  let outLen = 0;
  let counter = 0;
  while (outLen < maskLen) {
    const c = new Uint8Array(4);
    c[0] = (counter >>> 24) & 0xff;
    c[1] = (counter >>> 16) & 0xff;
    c[2] = (counter >>> 8) & 0xff;
    c[3] = counter & 0xff;

    const seedAndC = new Uint8Array(mgfSeed.length + 4);
    seedAndC.set(mgfSeed);
    seedAndC.set(c, mgfSeed.length);

    const hash = hashFn(seedAndC);
    const toCopy = Math.min(hash.length, maskLen - outLen);
    mask.set(hash.subarray(0, toCopy), outLen);
    outLen += toCopy;
    counter++;
  }
  return mask;
}

// ======================== PADDING ENCODING / DECODING ========================

function padPkcs1v15(message: Uint8Array, keyByteLen: number): Uint8Array {
  if (message.length > keyByteLen - 11) {
    throw new Error(
      `Message too long for PKCS#1 v1.5 padding with ${keyByteLen * 8}-bit key. Max message length is ${
        keyByteLen - 11
      } bytes.`
    );
  }
  const psLen = keyByteLen - message.length - 3;
  const ps = new Uint8Array(psLen);
  for (let i = 0; i < psLen; i++) {
    let rand = 0;
    while (rand === 0) {
      rand = getRandomBytes(1)[0];
    }
    ps[i] = rand;
  }

  const em = new Uint8Array(keyByteLen);
  em[0] = 0x00;
  em[1] = 0x02; // Type 2 encryption block
  em.set(ps, 2);
  em[2 + psLen] = 0x00;
  em.set(message, 3 + psLen);
  return em;
}

function unpadPkcs1v15(em: Uint8Array): Uint8Array {
  if (em.length < 11 || em[0] !== 0x00 || em[1] !== 0x02) {
    throw new Error('PKCS#1 v1.5 unpadding failed: Invalid padding header.');
  }
  let separatorIdx = -1;
  for (let i = 2; i < em.length; i++) {
    if (em[i] === 0x00) {
      separatorIdx = i;
      break;
    }
  }
  if (separatorIdx === -1 || separatorIdx < 10) {
    throw new Error('PKCS#1 v1.5 unpadding failed: Invalid padding delimiter.');
  }
  return em.slice(separatorIdx + 1);
}

function padOaep(message: Uint8Array, keyByteLen: number, hashAlgorithm = 'SHA-256'): Uint8Array {
  const isSha1 = hashAlgorithm === 'SHA-1';
  const hashFn = isSha1 ? hashSha1 : hashSha256;
  const hLen = isSha1 ? 20 : 32;

  if (message.length > keyByteLen - 2 * hLen - 2) {
    throw new Error(
      `Message too long for RSA-OAEP (${hashAlgorithm}) with ${keyByteLen * 8}-bit key. Max message length is ${
        keyByteLen - 2 * hLen - 2
      } bytes.`
    );
  }

  const lHash = hashFn(new Uint8Array(0)); // empty label hash
  const psLen = keyByteLen - message.length - 2 * hLen - 2;
  const db = new Uint8Array(hLen + psLen + 1 + message.length);
  db.set(lHash, 0);
  // ps filled with 0x00 already
  db[hLen + psLen] = 0x01;
  db.set(message, hLen + psLen + 1);

  const seed = getRandomBytes(hLen);
  const dbMask = mgf1(seed, keyByteLen - hLen - 1, hashFn);
  const maskedDB = new Uint8Array(db.length);
  for (let i = 0; i < db.length; i++) {
    maskedDB[i] = db[i] ^ dbMask[i];
  }

  const seedMask = mgf1(maskedDB, hLen, hashFn);
  const maskedSeed = new Uint8Array(hLen);
  for (let i = 0; i < hLen; i++) {
    maskedSeed[i] = seed[i] ^ seedMask[i];
  }

  const em = new Uint8Array(keyByteLen);
  em[0] = 0x00;
  em.set(maskedSeed, 1);
  em.set(maskedDB, 1 + hLen);
  return em;
}

function unpadOaep(em: Uint8Array, hashAlgorithm = 'SHA-256'): Uint8Array {
  const isSha1 = hashAlgorithm === 'SHA-1';
  const hashFn = isSha1 ? hashSha1 : hashSha256;
  const hLen = isSha1 ? 20 : 32;

  if (em.length < 2 * hLen + 2 || em[0] !== 0x00) {
    throw new Error('RSA-OAEP unpadding failed: Invalid header byte.');
  }

  const maskedSeed = em.subarray(1, 1 + hLen);
  const maskedDB = em.subarray(1 + hLen);

  const seedMask = mgf1(maskedDB, hLen, hashFn);
  const seed = new Uint8Array(hLen);
  for (let i = 0; i < hLen; i++) {
    seed[i] = maskedSeed[i] ^ seedMask[i];
  }

  const dbMask = mgf1(seed, maskedDB.length, hashFn);
  const db = new Uint8Array(maskedDB.length);
  for (let i = 0; i < maskedDB.length; i++) {
    db[i] = maskedDB[i] ^ dbMask[i];
  }

  const lHash = hashFn(new Uint8Array(0));
  for (let i = 0; i < hLen; i++) {
    if (db[i] !== lHash[i]) {
      throw new Error('RSA-OAEP unpadding failed: Label hash mismatch.');
    }
  }

  let separatorIdx = -1;
  for (let i = hLen; i < db.length; i++) {
    if (db[i] === 0x01) {
      separatorIdx = i;
      break;
    } else if (db[i] !== 0x00) {
      throw new Error('RSA-OAEP unpadding failed: Malformed padding string.');
    }
  }

  if (separatorIdx === -1) {
    throw new Error('RSA-OAEP unpadding failed: 0x01 separator not found.');
  }

  return db.slice(separatorIdx + 1);
}

// ======================== ENCRYPTION & DECRYPTION APIS ========================

export function encryptRsa(input: string, options?: ConversionOptions): string {
  const keyStr = options?.rsaPublicKey || options?.passphrase || options?.rsaPrivateKey;
  if (!keyStr || !keyStr.trim()) {
    throw new Error(
      'RSA Public Key is required. Please paste an RSA Public Key (PEM) or generate a new keypair.'
    );
  }

  let pubKey: RsaPublicKey;
  try {
    pubKey = parseRsaPublicKey(keyStr);
  } catch {
    // If user provided a private key, derive public key from it
    try {
      const privKey = parseRsaPrivateKey(keyStr);
      pubKey = { n: privKey.n, e: privKey.e, bitLength: privKey.bitLength };
    } catch {
      throw new Error('Invalid RSA Key. Please provide a valid PEM format Public or Private Key.');
    }
  }

  const keyByteLen = (pubKey.bitLength + 7) >> 3;
  const paddingMode = options?.rsaPadding || 'OAEP-SHA256';
  const messageBytes = encodeUtf8(input);

  // Determine max chunk size based on padding
  let maxChunkSize = keyByteLen - 11;
  if (paddingMode === 'OAEP-SHA256') maxChunkSize = keyByteLen - 2 * 32 - 2;
  else if (paddingMode === 'OAEP-SHA1') maxChunkSize = keyByteLen - 2 * 20 - 2;
  else if (paddingMode === 'RAW') maxChunkSize = keyByteLen;

  if (maxChunkSize <= 0) {
    throw new Error(`Key size (${pubKey.bitLength}-bit) is too small for ${paddingMode} padding.`);
  }

  // Encrypt chunk by chunk for arbitrary message size
  const encryptedBlocks: Uint8Array[] = [];
  for (let offset = 0; offset < messageBytes.length || offset === 0; offset += maxChunkSize) {
    const chunk = messageBytes.subarray(offset, Math.min(offset + maxChunkSize, messageBytes.length));
    let padded: Uint8Array;

    if (paddingMode === 'OAEP-SHA256') {
      padded = padOaep(chunk, keyByteLen, 'SHA-256');
    } else if (paddingMode === 'OAEP-SHA1') {
      padded = padOaep(chunk, keyByteLen, 'SHA-1');
    } else if (paddingMode === 'PKCS1-v1_5') {
      padded = padPkcs1v15(chunk, keyByteLen);
    } else {
      padded = new Uint8Array(keyByteLen);
      padded.set(chunk, keyByteLen - chunk.length);
    }

    const mBig = bytesToBigInt(padded);
    const cBig = modPow(mBig, pubKey.e, pubKey.n);
    const cBytes = bigIntToBytes(cBig, keyByteLen);
    encryptedBlocks.push(cBytes);
    if (offset + maxChunkSize >= messageBytes.length) break;
  }

  // Concatenate blocks
  const totalEncrypted = new Uint8Array(encryptedBlocks.length * keyByteLen);
  for (let i = 0; i < encryptedBlocks.length; i++) {
    totalEncrypted.set(encryptedBlocks[i], i * keyByteLen);
  }

  if (options?.rsaOutputFormat === 'hex') {
    return Array.from(totalEncrypted)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(' ');
  }

  return uint8ToBase64(totalEncrypted);
}

export function decryptRsa(input: string, options?: ConversionOptions): string {
  const keyStr = options?.rsaPrivateKey || options?.passphrase;
  if (!keyStr || !keyStr.trim()) {
    throw new Error(
      'RSA Private Key is required for decryption. Please paste your RSA Private Key (PEM).'
    );
  }

  let privKey: RsaPrivateKey;
  try {
    privKey = parseRsaPrivateKey(keyStr);
  } catch (err: any) {
    throw new Error('Invalid RSA Private Key. Please provide a valid PEM format Private Key.');
  }

  const keyByteLen = (privKey.bitLength + 7) >> 3;
  const paddingMode = options?.rsaPadding || 'OAEP-SHA256';

  // Decode input ciphertext (Hex or Base64)
  let rawCiphertext: Uint8Array;
  const cleanInput = input.trim();
  if (/^[0-9A-Fa-f\s]+$/.test(cleanInput) && cleanInput.replace(/\s+/g, '').length % 2 === 0 && cleanInput.includes(' ')) {
    const cleanHex = cleanInput.replace(/\s+/g, '');
    rawCiphertext = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < cleanHex.length; i += 2) {
      rawCiphertext[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
    }
  } else {
    rawCiphertext = base64ToUint8(cleanInput);
  }

  if (rawCiphertext.length % keyByteLen !== 0) {
    // If not exact multiple, check if it's a single block with minor length difference
    if (rawCiphertext.length < keyByteLen) {
      const padded = new Uint8Array(keyByteLen);
      padded.set(rawCiphertext, keyByteLen - rawCiphertext.length);
      rawCiphertext = padded;
    } else {
      throw new Error(
        `Ciphertext length (${rawCiphertext.length} bytes) is not a multiple of the key size (${keyByteLen} bytes).`
      );
    }
  }

  const blockCount = Math.max(1, Math.floor(rawCiphertext.length / keyByteLen));
  const decryptedChunks: Uint8Array[] = [];

  for (let i = 0; i < blockCount; i++) {
    const block = rawCiphertext.subarray(i * keyByteLen, (i + 1) * keyByteLen);
    const cBig = bytesToBigInt(block);

    let mBig: bigint;
    // Chinese Remainder Theorem (CRT) acceleration if p, q, dp, dq, qinv are present
    if (privKey.p && privKey.q && privKey.dp && privKey.dq && privKey.qinv) {
      const m1 = modPow(cBig, privKey.dp, privKey.p);
      const m2 = modPow(cBig, privKey.dq, privKey.q);
      let h = ((m1 - m2) % privKey.p + privKey.p) % privKey.p;
      h = (privKey.qinv * h) % privKey.p;
      mBig = m2 + h * privKey.q;
    } else {
      mBig = modPow(cBig, privKey.d, privKey.n);
    }

    const em = bigIntToBytes(mBig, keyByteLen);
    let chunk: Uint8Array;

    if (paddingMode === 'OAEP-SHA256') {
      chunk = unpadOaep(em, 'SHA-256');
    } else if (paddingMode === 'OAEP-SHA1') {
      chunk = unpadOaep(em, 'SHA-1');
    } else if (paddingMode === 'PKCS1-v1_5') {
      chunk = unpadPkcs1v15(em);
    } else {
      // Raw: strip leading zeros
      let start = 0;
      while (start < em.length && em[start] === 0) start++;
      chunk = em.subarray(start);
    }
    decryptedChunks.push(chunk);
  }

  // Combine decrypted bytes and decode UTF-8
  const totalLength = decryptedChunks.reduce((acc, c) => acc + c.length, 0);
  const resultBytes = new Uint8Array(totalLength);
  let offset = 0;
  for (const c of decryptedChunks) {
    resultBytes.set(c, offset);
    offset += c.length;
  }

  return decodeUtf8(resultBytes);
}
