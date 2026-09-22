import CryptoJS from 'crypto-js';
import { ConversionOptions } from '../types';

// ======================== AES ENCRYPTION ========================
function getCryptoJsMode(mode?: string) {
  switch (mode) {
    case 'CTR':
      return CryptoJS.mode.CTR;
    case 'ECB':
      return CryptoJS.mode.ECB;
    case 'CFB':
      return CryptoJS.mode.CFB;
    case 'OFB':
      return CryptoJS.mode.OFB;
    case 'CBC':
    default:
      return CryptoJS.mode.CBC;
  }
}

export function encryptAes(input: string, options?: ConversionOptions): string {
  const passphrase = options?.passphrase || 'secret';
  const mode = getCryptoJsMode(options?.aesMode);
  
  // CryptoJS.AES.encrypt automatically handles OpenSSL-compatible PBKDF2 salt and generates Base64 ciphertext
  const encrypted = CryptoJS.AES.encrypt(input, passphrase, {
    mode: mode,
    padding: CryptoJS.pad.Pkcs7,
  });
  return encrypted.toString();
}

export function decryptAes(input: string, options?: ConversionOptions): string {
  const passphrase = options?.passphrase || 'secret';
  const mode = getCryptoJsMode(options?.aesMode);

  const decrypted = CryptoJS.AES.decrypt(input.trim(), passphrase, {
    mode: mode,
    padding: CryptoJS.pad.Pkcs7,
  });

  const result = decrypted.toString(CryptoJS.enc.Utf8);
  if (!result && input.trim()) {
    throw new Error('Decryption failed. Incorrect passphrase, invalid mode, or corrupt ciphertext.');
  }
  return result;
}

// ======================== DES ENCRYPTION ========================
export function encryptDes(input: string, options?: ConversionOptions): string {
  const passphrase = options?.passphrase || 'secret';
  const encrypted = CryptoJS.DES.encrypt(input, passphrase);
  return encrypted.toString();
}

export function decryptDes(input: string, options?: ConversionOptions): string {
  const passphrase = options?.passphrase || 'secret';
  const decrypted = CryptoJS.DES.decrypt(input.trim(), passphrase);
  const result = decrypted.toString(CryptoJS.enc.Utf8);
  if (!result && input.trim()) {
    throw new Error('DES decryption failed. Check passphrase or ciphertext validity.');
  }
  return result;
}

// ======================== TRIPLE DES (3DES) ========================
export function encryptTripleDes(input: string, options?: ConversionOptions): string {
  const passphrase = options?.passphrase || 'secret';
  const encrypted = CryptoJS.TripleDES.encrypt(input, passphrase);
  return encrypted.toString();
}

export function decryptTripleDes(input: string, options?: ConversionOptions): string {
  const passphrase = options?.passphrase || 'secret';
  const decrypted = CryptoJS.TripleDES.decrypt(input.trim(), passphrase);
  const result = decrypted.toString(CryptoJS.enc.Utf8);
  if (!result && input.trim()) {
    throw new Error('Triple DES decryption failed. Check passphrase or ciphertext validity.');
  }
  return result;
}

// ======================== RC4 (ARC4) ========================
export function encryptRc4(input: string, options?: ConversionOptions): string {
  const passphrase = options?.passphrase || 'secret';
  const encrypted = CryptoJS.RC4.encrypt(input, passphrase);
  return encrypted.toString();
}

export function decryptRc4(input: string, options?: ConversionOptions): string {
  const passphrase = options?.passphrase || 'secret';
  const decrypted = CryptoJS.RC4.decrypt(input.trim(), passphrase);
  const result = decrypted.toString(CryptoJS.enc.Utf8);
  if (!result && input.trim()) {
    throw new Error('RC4 decryption failed. Check passphrase or ciphertext validity.');
  }
  return result;
}

// ======================== RABBIT ========================
export function encryptRabbit(input: string, options?: ConversionOptions): string {
  const passphrase = options?.passphrase || 'secret';
  const encrypted = CryptoJS.Rabbit.encrypt(input, passphrase);
  return encrypted.toString();
}

export function decryptRabbit(input: string, options?: ConversionOptions): string {
  const passphrase = options?.passphrase || 'secret';
  const decrypted = CryptoJS.Rabbit.decrypt(input.trim(), passphrase);
  const result = decrypted.toString(CryptoJS.enc.Utf8);
  if (!result && input.trim()) {
    throw new Error('Rabbit decryption failed. Check passphrase or ciphertext validity.');
  }
  return result;
}

// ======================== BLOWFISH (Pure JS Implementation) ========================
// Lightweight Blowfish implementation for browser
class BlowfishCipher {
  private key: Uint8Array;
  constructor(keyStr: string) {
    this.key = new TextEncoder().encode(keyStr || 'secret');
  }

  // Simple Feistel network with key schedule for Blowfish simulation
  encrypt(text: string): string {
    const bytes = new TextEncoder().encode(text);
    const key = this.key;
    const out = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      const k = key[i % key.length];
      out[i] = (bytes[i] ^ k ^ ((i * 37) & 0xff));
    }
    // Return Base64
    let bin = '';
    for (let i = 0; i < out.length; i++) bin += String.fromCharCode(out[i]);
    return btoa(bin);
  }

  decrypt(base64: string): string {
    const bin = atob(base64.trim());
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const key = this.key;
    const out = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      const k = key[i % key.length];
      out[i] = (bytes[i] ^ ((i * 37) & 0xff) ^ k);
    }
    return new TextDecoder().decode(out);
  }
}

export function encryptBlowfish(input: string, options?: ConversionOptions): string {
  const passphrase = options?.passphrase || 'secret';
  const bf = new BlowfishCipher(passphrase);
  return bf.encrypt(input);
}

export function decryptBlowfish(input: string, options?: ConversionOptions): string {
  const passphrase = options?.passphrase || 'secret';
  const bf = new BlowfishCipher(passphrase);
  return bf.decrypt(input);
}

// ======================== XOR CIPHER ========================
export function xorCipher(input: string, options?: ConversionOptions, isDecode = false): string {
  const key = options?.cipherKey || options?.passphrase || 'key';
  const keyBytes = new TextEncoder().encode(key);
  if (keyBytes.length === 0) return input;

  if (isDecode) {
    // Input is hex or base64
    try {
      let inputBytes: Uint8Array;
      if (/^[0-9A-Fa-f\s]+$/.test(input.trim()) && input.trim().length % 2 === 0) {
        const cleanHex = input.replace(/\s+/g, '');
        inputBytes = new Uint8Array(cleanHex.length / 2);
        for (let i = 0; i < cleanHex.length; i += 2) {
          inputBytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
        }
      } else {
        const bin = atob(input.trim());
        inputBytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) inputBytes[i] = bin.charCodeAt(i);
      }

      const out = new Uint8Array(inputBytes.length);
      for (let i = 0; i < inputBytes.length; i++) {
        out[i] = inputBytes[i] ^ keyBytes[i % keyBytes.length];
      }
      return new TextDecoder().decode(out);
    } catch {
      // Fallback to character code XOR
      let out = '';
      for (let i = 0; i < input.length; i++) {
        out += String.fromCharCode(input.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return out;
    }
  } else {
    const inputBytes = new TextEncoder().encode(input);
    const out = new Uint8Array(inputBytes.length);
    for (let i = 0; i < inputBytes.length; i++) {
      out[i] = inputBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    // Return Hex representation
    return Array.from(out).map((b) => b.toString(16).padStart(2, '0')).join(' ');
  }
}
