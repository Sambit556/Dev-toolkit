import {
  ConversionMethodId,
  MethodDefinition,
  ConversionOptions,
  ConversionExecutionResult,
} from './types';
import {
  encodeBase64, decodeBase64,
  encodeBase64Url, decodeBase64Url,
  encodeBase32, decodeBase32,
  encodeBase58, decodeBase58,
  encodeBase85, decodeBase85,
  encodeZ85, decodeZ85,
  encodeHex, decodeHex,
  encodeBinary, decodeBinary,
  encodeOctal, decodeOctal,
  encodeDecimal, decodeDecimal,
  encodeUnicode, decodeUnicode,
  encodeUrl, decodeUrl,
  encodeHtmlEntities, decodeHtmlEntities,
  encodePunycode, decodePunycode,
  encodeQuotedPrintable, decodeQuotedPrintable,
  encodeUUEncode, decodeUUEncode,
} from './methods/encodings';
import {
  caesarCipher,
  rot13, rot5, rot18, rot47,
  atbashCipher,
  vigenereCipher,
  affineCipher,
  encodeRailFence, decodeRailFence,
  encodeBacon, decodeBacon,
  encodePolybius, decodePolybius,
  encodeMorse, decodeMorse,
  encodeBraille, decodeBraille,
  encodeTapCode, decodeTapCode,
  reverseText,
} from './methods/ciphers';
import {
  encryptAes, decryptAes,
  encryptDes, decryptDes,
  encryptTripleDes, decryptTripleDes,
  encryptRc4, decryptRc4,
  encryptRabbit, decryptRabbit,
  encryptBlowfish, decryptBlowfish,
  xorCipher,
} from './methods/encryption';
import {
  encryptRsa, decryptRsa,
} from './methods/rsa';
import {
  calculateMd5,
  calculateSha1,
  calculateSha256,
  calculateSha512,
  calculateSha3,
  calculateRipemd160,
  calculateCrc32,
  calculateHmacSha256,
  calculateHmacSha512,
  calculateHmacMd5,
} from './methods/hashes';
import { detectFormat, calculateShannonEntropy } from './detector';

export * from './types';
export * from './detector';
export * from './methods/ciphers';
export * from './methods/encodings';
export * from './methods/encryption';
export * from './methods/rsa';
export * from './methods/hashes';

export const METHOD_DEFINITIONS: MethodDefinition[] = [
  // Auto
  {
    id: 'auto',
    name: '⚡ Auto-Detect Format',
    category: 'auto',
    description: 'Automatically analyzes input pattern, structure, and frequency to select the optimal decoder.',
  },

  // Encodings
  {
    id: 'base64',
    name: 'Base64 (RFC 4648)',
    category: 'encoding',
    description: 'Standard 64-character ASCII text representation of binary data.',
  },
  {
    id: 'base64url',
    name: 'Base64URL (URL-Safe)',
    category: 'encoding',
    description: 'URL-safe Base64 using "-" and "_" without trailing "=" padding.',
  },
  {
    id: 'base32',
    name: 'Base32 (RFC 4648)',
    category: 'encoding',
    description: 'Case-insensitive 32-character encoding using letters A-Z and digits 2-7.',
  },
  {
    id: 'base58',
    name: 'Base58 (Bitcoin)',
    category: 'encoding',
    description: 'Compact binary encoding without ambiguous characters (0, O, I, l).',
  },
  {
    id: 'base85',
    name: 'Base85 / Ascii85 (Adobe)',
    category: 'encoding',
    description: 'Compact 85-character encoding designed by Adobe for PostScript / PDF.',
  },
  {
    id: 'z85',
    name: 'Z85 (ZeroMQ Base85)',
    category: 'encoding',
    description: 'String-safe Base85 variant designed by ZeroMQ with strict 4:5 byte ratio.',
  },
  {
    id: 'hex',
    name: 'Hexadecimal (Base16)',
    category: 'encoding',
    description: 'Hex byte representation with selectable spacing, 0x prefix, or colon delimiters.',
  },
  {
    id: 'binary',
    name: 'Binary (Base2)',
    category: 'encoding',
    description: 'Raw 8-bit byte representation consisting of 0s and 1s.',
  },
  {
    id: 'octal',
    name: 'Octal (Base8)',
    category: 'encoding',
    description: 'Base-8 numeral system using digits 0 to 7.',
  },
  {
    id: 'decimal',
    name: 'Decimal / Byte Array',
    category: 'encoding',
    description: 'Comma-separated UTF-8 integer byte values (0-255).',
  },
  {
    id: 'unicode',
    name: 'Unicode Code Points (\\uXXXX)',
    category: 'encoding',
    description: 'Hexadecimal Unicode escape sequences (\\uXXXX or U+XXXX).',
  },
  {
    id: 'quoted-printable',
    name: 'Quoted-Printable (MIME)',
    category: 'encoding',
    description: 'RFC 2045 encoding using hex escapes (=XX) for non-ASCII characters.',
  },
  {
    id: 'uuencode',
    name: 'UUEncode / UUDecode',
    category: 'encoding',
    description: 'Historical Unix-to-Unix binary-to-text encoding with header line.',
  },

  // Web & Format
  {
    id: 'url',
    name: 'URL / Percent-Encoding',
    category: 'web',
    description: 'Escapes URI query parameters and special characters using %XX.',
  },
  {
    id: 'html',
    name: 'HTML Entities',
    category: 'web',
    description: 'Converts HTML special characters (&, <, >, ", \') into named or numeric entities.',
  },
  {
    id: 'punycode',
    name: 'Punycode / IDNA Domains',
    category: 'web',
    description: 'Encodes Unicode internationalized domain names into ASCII (xn--...).',
  },

  // Classical Ciphers
  {
    id: 'caesar',
    name: 'Caesar Cipher',
    category: 'ciphers',
    description: 'Classical substitution cipher shifting alphabet by 1-25 positions.',
  },
  {
    id: 'rot13',
    name: 'ROT13 Cipher',
    category: 'ciphers',
    description: 'Rotate-by-13 substitution cipher commonly used for obfuscation.',
  },
  {
    id: 'rot5',
    name: 'ROT5 (Digits 0-9)',
    category: 'ciphers',
    description: 'Rotates numerical digits 0-9 by 5 positions.',
  },
  {
    id: 'rot18',
    name: 'ROT18 (ROT13 + ROT5)',
    category: 'ciphers',
    description: 'Combined ROT13 for letters and ROT5 for numbers.',
  },
  {
    id: 'rot47',
    name: 'ROT47 (ASCII 33-126)',
    category: 'ciphers',
    description: 'Rotates all standard printable ASCII characters by 47 positions.',
  },
  {
    id: 'atbash',
    name: 'Atbash Cipher',
    category: 'ciphers',
    description: 'Monoalphabetic substitution mapping A↔Z, B↔Y, C↔X.',
  },
  {
    id: 'vigenere',
    name: 'Vigenère Cipher',
    category: 'ciphers',
    requiresPassphrase: true,
    description: 'Polyalphabetic substitution cipher using a repeating keyword passphrase.',
  },
  {
    id: 'affine',
    name: 'Affine Cipher',
    category: 'ciphers',
    description: 'Mathematical cipher: E(x) = (a·x + b) mod 26 where gcd(a, 26) = 1.',
  },
  {
    id: 'railfence',
    name: 'Rail Fence (Zig-Zag)',
    category: 'ciphers',
    description: 'Transposition cipher writing letters in a zigzag wave across N rails.',
  },
  {
    id: 'bacon',
    name: "Bacon's Cipher",
    category: 'ciphers',
    description: 'Steganographic 5-character binary substitution using letters A and B.',
  },
  {
    id: 'polybius',
    name: 'Polybius Square',
    category: 'ciphers',
    description: '5x5 coordinate matrix cipher encoding letters as two-digit pairs.',
  },
  {
    id: 'morse',
    name: 'Morse Code',
    category: 'ciphers',
    description: 'Telecommunication code representing letters with dots and dashes.',
  },
  {
    id: 'braille',
    name: 'Braille Translation',
    category: 'ciphers',
    description: 'Standard 6-dot Grade 1 tactile Braille Unicode representation.',
  },
  {
    id: 'tapcode',
    name: 'Tap Code',
    category: 'ciphers',
    description: 'Prison cipher tapping row and column counts on a 5x5 Polybius grid.',
  },
  {
    id: 'reverse',
    name: 'Reverse String',
    category: 'ciphers',
    description: 'Reverses the sequence of characters.',
  },

  // Asymmetric & Symmetric Encryption
  {
    id: 'rsa',
    name: 'RSA Encryption / Decryption',
    category: 'encryption',
    requiresPassphrase: true,
    description: 'Asymmetric public-key cryptography (PKCS#1 v1.5 / RSA-OAEP) with PEM keypair support.',
  },
  {
    id: 'aes-256',
    name: 'AES-256 Encryption',
    category: 'encryption',
    requiresPassphrase: true,
    description: 'Advanced Encryption Standard 256-bit with PBKDF2 passphrase and OpenSSL compatibility.',
  },
  {
    id: 'aes-192',
    name: 'AES-192 Encryption',
    category: 'encryption',
    requiresPassphrase: true,
    description: 'AES 192-bit block cipher with passphrase.',
  },
  {
    id: 'aes-128',
    name: 'AES-128 Encryption',
    category: 'encryption',
    requiresPassphrase: true,
    description: 'AES 128-bit block cipher with passphrase.',
  },
  {
    id: 'des',
    name: 'DES (Data Encryption Standard)',
    category: 'encryption',
    requiresPassphrase: true,
    description: 'Legacy 56-bit symmetric block cipher.',
  },
  {
    id: 'tripledes',
    name: 'Triple DES (3DES)',
    category: 'encryption',
    requiresPassphrase: true,
    description: 'Triple Data Encryption Standard applying DES three times with keying.',
  },
  {
    id: 'rc4',
    name: 'RC4 (ARC4)',
    category: 'encryption',
    requiresPassphrase: true,
    description: 'Stream cipher commonly used in legacy SSL/TLS and WEP.',
  },
  {
    id: 'rabbit',
    name: 'Rabbit Stream Cipher',
    category: 'encryption',
    requiresPassphrase: true,
    description: 'High-speed 128-bit stream cipher with 64-bit IV.',
  },
  {
    id: 'blowfish',
    name: 'Blowfish Cipher',
    category: 'encryption',
    requiresPassphrase: true,
    description: 'Symmetric variable-length key block cipher.',
  },
  {
    id: 'xor',
    name: 'XOR Cipher',
    category: 'encryption',
    requiresPassphrase: true,
    description: 'Bitwise exclusive-OR encryption with custom text or hex key.',
  },

  // Hashes & Digests
  {
    id: 'md5',
    name: 'MD5 Hash',
    category: 'hashes',
    isOneWay: true,
    description: '128-bit cryptographic message digest algorithm.',
  },
  {
    id: 'sha1',
    name: 'SHA-1 Hash',
    category: 'hashes',
    isOneWay: true,
    description: '160-bit Secure Hash Algorithm 1.',
  },
  {
    id: 'sha256',
    name: 'SHA-256 Hash',
    category: 'hashes',
    isOneWay: true,
    description: '256-bit cryptographic hash from SHA-2 family.',
  },
  {
    id: 'sha512',
    name: 'SHA-512 Hash',
    category: 'hashes',
    isOneWay: true,
    description: '512-bit cryptographic hash from SHA-2 family.',
  },
  {
    id: 'sha3',
    name: 'SHA-3 / Keccak',
    category: 'hashes',
    isOneWay: true,
    description: 'Next-generation sponge-construction cryptographic hash standard.',
  },
  {
    id: 'ripemd160',
    name: 'RIPEMD-160',
    category: 'hashes',
    isOneWay: true,
    description: '160-bit hash cryptographic digest commonly used in Bitcoin addresses.',
  },
  {
    id: 'crc32',
    name: 'CRC32 Checksum',
    category: 'hashes',
    isOneWay: true,
    description: '32-bit cyclic redundancy check checksum.',
  },
  {
    id: 'hmac-sha256',
    name: 'HMAC-SHA256',
    category: 'hashes',
    isOneWay: true,
    requiresPassphrase: true,
    description: 'Keyed-hash message authentication code using SHA-256.',
  },
  {
    id: 'hmac-sha512',
    name: 'HMAC-SHA512',
    category: 'hashes',
    isOneWay: true,
    requiresPassphrase: true,
    description: 'Keyed-hash message authentication code using SHA-512.',
  },
  {
    id: 'hmac-md5',
    name: 'HMAC-MD5',
    category: 'hashes',
    isOneWay: true,
    requiresPassphrase: true,
    description: 'Keyed-hash message authentication code using MD5.',
  },
];

export function executeConversion(
  input: string,
  methodId: ConversionMethodId,
  isDecode: boolean,
  options: ConversionOptions = {}
): ConversionExecutionResult {
  if (!input) {
    return {
      output: '',
      stats: {
        inputChars: 0,
        inputBytes: 0,
        inputLines: 0,
        outputChars: 0,
        outputBytes: 0,
        outputLines: 0,
        entropy: 0,
      },
    };
  }

  const inputBytes = new TextEncoder().encode(input).length;
  const inputLines = input.split('\n').length;
  const entropy = calculateShannonEntropy(input);

  try {
    let output = '';
    let detectedResult = undefined;

    // Handle Auto-Detect Mode
    if (methodId === 'auto') {
      const detections = detectFormat(input);
      if (detections.length > 0) {
        detectedResult = detections[0];
        const targetMethod = detectedResult.methodId;
        const targetOpts = { ...options, ...detectedResult.detectedParams };
        // Auto decode using detected method
        const subResult = executeConversion(input, targetMethod, true, targetOpts);
        output = subResult.output;
      } else {
        // Fallback: Default to Base64 decode or plaintext
        try {
          output = decodeBase64(input);
        } catch {
          output = input;
        }
      }
    } else {
      switch (methodId) {
        // Encodings
        case 'base64':
          output = isDecode ? decodeBase64(input) : encodeBase64(input);
          break;
        case 'base64url':
          output = isDecode ? decodeBase64Url(input) : encodeBase64Url(input);
          break;
        case 'base32':
          output = isDecode ? decodeBase32(input) : encodeBase32(input);
          break;
        case 'base58':
          output = isDecode ? decodeBase58(input) : encodeBase58(input);
          break;
        case 'base85':
          output = isDecode ? decodeBase85(input) : encodeBase85(input);
          break;
        case 'z85':
          output = isDecode ? decodeZ85(input) : encodeZ85(input);
          break;
        case 'hex':
          output = isDecode ? decodeHex(input) : encodeHex(input, options);
          break;
        case 'binary':
          output = isDecode ? decodeBinary(input) : encodeBinary(input, options.binaryByteSpaced !== false);
          break;
        case 'octal':
          output = isDecode ? decodeOctal(input) : encodeOctal(input);
          break;
        case 'decimal':
          output = isDecode ? decodeDecimal(input) : encodeDecimal(input);
          break;
        case 'unicode':
          output = isDecode ? decodeUnicode(input) : encodeUnicode(input);
          break;
        case 'punycode':
          output = isDecode ? decodePunycode(input) : encodePunycode(input);
          break;
        case 'quoted-printable':
          output = isDecode ? decodeQuotedPrintable(input) : encodeQuotedPrintable(input);
          break;
        case 'uuencode':
          output = isDecode ? decodeUUEncode(input) : encodeUUEncode(input);
          break;

        // Web & Format
        case 'url':
          output = isDecode ? decodeUrl(input) : encodeUrl(input, options.urlFullEncoding);
          break;
        case 'html':
          output = isDecode ? decodeHtmlEntities(input) : encodeHtmlEntities(input);
          break;

        // Ciphers
        case 'caesar':
          output = caesarCipher(input, options.caesarShift ?? 3, isDecode);
          break;
        case 'rot13':
          output = rot13(input);
          break;
        case 'rot5':
          output = rot5(input);
          break;
        case 'rot18':
          output = rot18(input);
          break;
        case 'rot47':
          output = rot47(input);
          break;
        case 'atbash':
          output = atbashCipher(input);
          break;
        case 'vigenere':
          output = vigenereCipher(input, options.cipherKey || options.passphrase || 'KEY', isDecode);
          break;
        case 'affine':
          output = affineCipher(input, options.affineA ?? 5, options.affineB ?? 8, isDecode);
          break;
        case 'railfence':
          output = isDecode ? decodeRailFence(input, options.railCount ?? 3) : encodeRailFence(input, options.railCount ?? 3);
          break;
        case 'bacon':
          output = isDecode ? decodeBacon(input) : encodeBacon(input);
          break;
        case 'polybius':
          output = isDecode ? decodePolybius(input) : encodePolybius(input);
          break;
        case 'morse':
          output = isDecode ? decodeMorse(input) : encodeMorse(input, options);
          break;
        case 'braille':
          output = isDecode ? decodeBraille(input) : encodeBraille(input);
          break;
        case 'tapcode':
          output = isDecode ? decodeTapCode(input) : encodeTapCode(input);
          break;
        case 'reverse':
          output = reverseText(input);
          break;

        // Asymmetric & Symmetric Encryption
        case 'rsa':
          output = isDecode ? decryptRsa(input, options) : encryptRsa(input, options);
          break;
        case 'aes-256':
        case 'aes-192':
        case 'aes-128':
          output = isDecode ? decryptAes(input, options) : encryptAes(input, options);
          break;
        case 'des':
          output = isDecode ? decryptDes(input, options) : encryptDes(input, options);
          break;
        case 'tripledes':
          output = isDecode ? decryptTripleDes(input, options) : encryptTripleDes(input, options);
          break;
        case 'rc4':
          output = isDecode ? decryptRc4(input, options) : encryptRc4(input, options);
          break;
        case 'rabbit':
          output = isDecode ? decryptRabbit(input, options) : encryptRabbit(input, options);
          break;
        case 'blowfish':
          output = isDecode ? decryptBlowfish(input, options) : encryptBlowfish(input, options);
          break;
        case 'xor':
          output = xorCipher(input, options, isDecode);
          break;

        // Hashes & HMACs (One-Way)
        case 'md5':
          output = calculateMd5(input);
          break;
        case 'sha1':
          output = calculateSha1(input);
          break;
        case 'sha256':
          output = calculateSha256(input);
          break;
        case 'sha512':
          output = calculateSha512(input);
          break;
        case 'sha3':
          output = calculateSha3(input);
          break;
        case 'ripemd160':
          output = calculateRipemd160(input);
          break;
        case 'crc32':
          output = calculateCrc32(input);
          break;
        case 'hmac-sha256':
          output = calculateHmacSha256(input, options);
          break;
        case 'hmac-sha512':
          output = calculateHmacSha512(input, options);
          break;
        case 'hmac-md5':
          output = calculateHmacMd5(input, options);
          break;

        default:
          output = input;
      }
    }

    const outputBytes = new TextEncoder().encode(output).length;
    const outputLines = output.split('\n').length;

    return {
      output,
      detectedMethod: detectedResult,
      stats: {
        inputChars: input.length,
        inputBytes,
        inputLines,
        outputChars: output.length,
        outputBytes,
        outputLines,
        entropy,
      },
    };
  } catch (err: any) {
    return {
      output: `// Error: ${err.message || 'Conversion failed'}`,
      error: err.message || 'Conversion failed',
      stats: {
        inputChars: input.length,
        inputBytes,
        inputLines,
        outputChars: 0,
        outputBytes: 0,
        outputLines: 0,
        entropy,
      },
    };
  }
}

// Compare across major algorithms for "Try All" Grid
export const MULTI_COMPARE_METHODS: ConversionMethodId[] = [
  'base64',
  'hex',
  'binary',
  'url',
  'html',
  'morse',
  'rot13',
  'caesar',
  'atbash',
  'aes-256',
  'rsa',
  'des',
  'rc4',
  'sha256',
  'md5',
];
