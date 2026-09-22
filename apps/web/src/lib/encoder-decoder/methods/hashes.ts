import CryptoJS from 'crypto-js';
import { ConversionOptions } from '../types';

// ======================== CRC32 IMPLEMENTATION ========================
const CRC32_TABLE: number[] = (() => {
  const table: number[] = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

export function calculateCrc32(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let crc = 0 ^ -1;
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ bytes[i]) & 0xff];
  }
  return ((crc ^ -1) >>> 0).toString(16).padStart(8, '0').toUpperCase();
}

// ======================== HASH FUNCTIONS ========================
export function calculateMd5(input: string): string {
  return CryptoJS.MD5(input).toString();
}

export function calculateSha1(input: string): string {
  return CryptoJS.SHA1(input).toString();
}

export function calculateSha224(input: string): string {
  return CryptoJS.SHA224(input).toString();
}

export function calculateSha256(input: string): string {
  return CryptoJS.SHA256(input).toString();
}

export function calculateSha384(input: string): string {
  return CryptoJS.SHA384(input).toString();
}

export function calculateSha512(input: string): string {
  return CryptoJS.SHA512(input).toString();
}

export function calculateSha3(input: string): string {
  return CryptoJS.SHA3(input).toString();
}

export function calculateRipemd160(input: string): string {
  return CryptoJS.RIPEMD160(input).toString();
}

// ======================== HMAC FUNCTIONS ========================
export function calculateHmacSha256(input: string, options?: ConversionOptions): string {
  const key = options?.hmacKey || options?.passphrase || 'secret';
  return CryptoJS.HmacSHA256(input, key).toString();
}

export function calculateHmacSha512(input: string, options?: ConversionOptions): string {
  const key = options?.hmacKey || options?.passphrase || 'secret';
  return CryptoJS.HmacSHA512(input, key).toString();
}

export function calculateHmacMd5(input: string, options?: ConversionOptions): string {
  const key = options?.hmacKey || options?.passphrase || 'secret';
  return CryptoJS.HmacMD5(input, key).toString();
}

// ======================== HASH IDENTIFIER ========================
export interface HashMatch {
  algorithm: string;
  bitLength: number;
  description: string;
}

export function identifyHash(input: string): HashMatch[] {
  const clean = input.trim().replace(/\s+/g, '');
  const len = clean.length;
  const isHex = /^[0-9a-fA-F]+$/.test(clean);

  if (!isHex) return [];

  const matches: HashMatch[] = [];

  if (len === 8) {
    matches.push({ algorithm: 'CRC32 / Adler32', bitLength: 32, description: '32-bit standard cyclic redundancy check checksum' });
  } else if (len === 32) {
    matches.push(
      { algorithm: 'MD5', bitLength: 128, description: '128-bit MD5 message digest' },
      { algorithm: 'MD4 / MD2', bitLength: 128, description: 'Legacy 128-bit hash algorithms' },
      { algorithm: 'NTLM', bitLength: 128, description: 'Windows NTLM authentication hash' }
    );
  } else if (len === 40) {
    matches.push(
      { algorithm: 'SHA-1', bitLength: 160, description: '160-bit Secure Hash Algorithm 1' },
      { algorithm: 'RIPEMD-160', bitLength: 160, description: '160-bit RACE Integrity Primitives digest' },
      { algorithm: 'MySQL 4.1+', bitLength: 160, description: 'MySQL double SHA-1 password hash' }
    );
  } else if (len === 56) {
    matches.push(
      { algorithm: 'SHA-224', bitLength: 224, description: '224-bit truncated SHA-256 digest' },
      { algorithm: 'SHA3-224', bitLength: 224, description: '224-bit Keccak/SHA-3 digest' }
    );
  } else if (len === 64) {
    matches.push(
      { algorithm: 'SHA-256', bitLength: 256, description: '256-bit SHA-2 cryptographic hash' },
      { algorithm: 'SHA3-256', bitLength: 256, description: '256-bit Keccak/SHA-3 digest' },
      { algorithm: 'BLAKE2s-256', bitLength: 256, description: '256-bit BLAKE2s digest' },
      { algorithm: 'RIPEMD-256', bitLength: 256, description: '256-bit RIPEMD digest' }
    );
  } else if (len === 96) {
    matches.push(
      { algorithm: 'SHA-384', bitLength: 384, description: '384-bit SHA-2 truncated digest' },
      { algorithm: 'SHA3-384', bitLength: 384, description: '384-bit Keccak/SHA-3 digest' }
    );
  } else if (len === 128) {
    matches.push(
      { algorithm: 'SHA-512', bitLength: 512, description: '512-bit SHA-2 cryptographic hash' },
      { algorithm: 'SHA3-512', bitLength: 512, description: '512-bit Keccak/SHA-3 digest' },
      { algorithm: 'BLAKE2b-512', bitLength: 512, description: '512-bit BLAKE2b digest' },
      { algorithm: 'Whirlpool', bitLength: 512, description: '512-bit Whirlpool hash' }
    );
  }

  return matches;
}
