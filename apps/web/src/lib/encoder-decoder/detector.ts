import { DetectionResult, ConversionOptions } from './types';
import { decodeBase64, decodeHex, decodeUrl, decodeHtmlEntities, decodeBinary } from './methods/encodings';
import { getAllCaesarShifts, scoreEnglishText } from './methods/ciphers';

// Calculate Shannon Entropy (bits per byte, 0 - 8)
export function calculateShannonEntropy(str: string): number {
  if (!str) return 0;
  const len = str.length;
  const freq: Record<string, number> = {};
  for (let i = 0; i < len; i++) {
    const char = str[i];
    freq[char] = (freq[char] || 0) + 1;
  }
  let entropy = 0;
  for (const count of Object.values(freq)) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return Math.min(8, Number(entropy.toFixed(3)));
}

// Check if string is predominantly printable text
function isPrintableText(str: string): boolean {
  if (!str || str.length === 0) return false;
  // eslint-disable-next-line no-control-regex
  const printable = str.replace(/[\x20-\x7E\t\r\n\u00A0-\uFFFF]/g, '');
  return printable.length / str.length < 0.05;
}

export function detectFormat(input: string): DetectionResult[] {
  const trimmed = input.trim();
  if (!trimmed) return [];

  const results: DetectionResult[] = [];

  // 1. RSA PEM Key
  if (
    trimmed.startsWith('-----BEGIN RSA PUBLIC KEY-----') ||
    trimmed.startsWith('-----BEGIN PUBLIC KEY-----') ||
    trimmed.startsWith('-----BEGIN RSA PRIVATE KEY-----') ||
    trimmed.startsWith('-----BEGIN PRIVATE KEY-----')
  ) {
    const isPrivate = trimmed.includes('PRIVATE KEY');
    results.push({
      methodId: 'rsa',
      name: isPrivate ? 'RSA Private Key (PEM)' : 'RSA Public Key (PEM)',
      category: 'encryption',
      confidence: 100,
      reason: isPrivate ? 'Standard PEM PKCS#1 / PKCS#8 RSA Private Key header' : 'Standard PEM SPKI / PKCS#1 RSA Public Key header',
      requiresPassphrase: true,
      suggestedAction: isPrivate ? 'decode' : 'encode',
      detectedParams: isPrivate ? { rsaPrivateKey: trimmed } : { rsaPublicKey: trimmed },
    });
  }

  // 2. OpenSSL AES / DES Salted Ciphertext (Base64 starts with U2FsdGVkX1...)
  if (trimmed.startsWith('U2FsdGVkX1')) {
    results.push({
      methodId: 'aes-256',
      name: 'OpenSSL AES / Symmetric Ciphertext',
      category: 'encryption',
      confidence: 99,
      reason: 'Starts with OpenSSL "Salted__" magic header (U2FsdGVkX1...)',
      requiresPassphrase: true,
      suggestedAction: 'decode',
    });
  }

  // 2. Morse Code (dots, dashes, slashes, spaces)
  if (/^[.\-/_| ]+$/.test(trimmed) && (trimmed.includes('.') || trimmed.includes('-')) && trimmed.length >= 2) {
    results.push({
      methodId: 'morse',
      name: 'Morse Code',
      category: 'ciphers',
      confidence: 96,
      reason: 'Composed entirely of dots, dashes, and word delimiters',
      suggestedAction: 'decode',
    });
  }

  // 3. Braille
  if (/^[\u2800-\u28FF\s]+$/.test(trimmed) && trimmed.length > 0) {
    results.push({
      methodId: 'braille',
      name: 'Braille Code',
      category: 'ciphers',
      confidence: 98,
      reason: 'Contains standard Unicode Braille pattern characters',
      suggestedAction: 'decode',
    });
  }

  // 4. Tap Code
  if (/^(\.+[ \t]+\.+([ \t]{2,}|\/|\n|$))+$/.test(trimmed)) {
    results.push({
      methodId: 'tapcode',
      name: 'Tap Code',
      category: 'ciphers',
      confidence: 90,
      reason: 'Pattern of dot pairs corresponding to 5x5 Polybius matrix taps',
      suggestedAction: 'decode',
    });
  }

  // 5. Bacon's Cipher (Sequences of 5 A/B characters)
  if (/^[AB\s]{5,}$/i.test(trimmed)) {
    const cleanAB = trimmed.replace(/\s+/g, '');
    if (cleanAB.length % 5 === 0) {
      results.push({
        methodId: 'bacon',
        name: "Bacon's Cipher",
        category: 'ciphers',
        confidence: 88,
        reason: '5-character groupings of letters A and B',
        suggestedAction: 'decode',
      });
    }
  }

  // 6. Punycode (IDNA)
  if (trimmed.toLowerCase().includes('xn--')) {
    results.push({
      methodId: 'punycode',
      name: 'Punycode (IDNA)',
      category: 'web',
      confidence: 95,
      reason: 'Contains internationalized domain prefix "xn--"',
      suggestedAction: 'decode',
    });
  }

  // 7. UUEncode
  if (trimmed.startsWith('begin ') || /^begin\s+[0-7]{3}\s+\S+/m.test(trimmed)) {
    results.push({
      methodId: 'uuencode',
      name: 'UUEncode',
      category: 'encoding',
      confidence: 98,
      reason: 'Contains standard Unix-to-Unix "begin" file header',
      suggestedAction: 'decode',
    });
  }

  // 8. Quoted-Printable
  if (/=[0-9A-Fa-f]{2}/.test(trimmed) || /=\r?\n/.test(trimmed)) {
    const count = (trimmed.match(/=[0-9A-Fa-f]{2}/g) || []).length;
    if (count >= 2 || /=\r?\n/.test(trimmed)) {
      results.push({
        methodId: 'quoted-printable',
        name: 'Quoted-Printable',
        category: 'encoding',
        confidence: 85,
        reason: 'Contains MIME quoted-printable hex escapes (=XX)',
        suggestedAction: 'decode',
      });
    }
  }

  // 9. Binary String
  const cleanBin = trimmed.replace(/[\s,]+/g, '');
  if (/^[01]+$/.test(cleanBin) && cleanBin.length >= 8) {
    let conf = 85;
    if (cleanBin.length % 8 === 0) conf = 95;
    try {
      const decoded = decodeBinary(trimmed);
      if (isPrintableText(decoded)) {
        conf = 98;
      }
      results.push({
        methodId: 'binary',
        name: 'Binary (Base2)',
        category: 'encoding',
        confidence: conf,
        reason: 'Composed entirely of binary bits (0 and 1)',
        suggestedAction: 'decode',
        decodedSample: decoded.slice(0, 100),
      });
    } catch {
      // Ignored
    }
  }

  // 10. Hexadecimal / Hash Analysis
  const isHexOnly = /^[0-9a-fA-F\s:,-]+$/.test(trimmed);
  const cleanHex = trimmed.replace(/0x|\\x|[\s:,-]+/g, '');
  if (isHexOnly && cleanHex.length >= 2 && cleanHex.length % 2 === 0) {
    let hashCandidate = false;
    // Check if it's a typical fixed-length hash
    if (!trimmed.includes(' ') && !trimmed.includes(':') && !trimmed.includes(',')) {
      if (cleanHex.length === 32) {
        results.push({
          methodId: 'md5',
          name: 'MD5 Hash Digest (32 hex chars)',
          category: 'hashes',
          confidence: 85,
          reason: 'Exact 32-hex character length matching MD5 / NTLM hash',
          suggestedAction: 'encode',
        });
        hashCandidate = true;
      } else if (cleanHex.length === 40) {
        results.push({
          methodId: 'sha1',
          name: 'SHA-1 Hash Digest (40 hex chars)',
          category: 'hashes',
          confidence: 85,
          reason: 'Exact 40-hex character length matching SHA-1 / RIPEMD-160 hash',
          suggestedAction: 'encode',
        });
        hashCandidate = true;
      } else if (cleanHex.length === 64) {
        results.push({
          methodId: 'sha256',
          name: 'SHA-256 Hash Digest (64 hex chars)',
          category: 'hashes',
          confidence: 85,
          reason: 'Exact 64-hex character length matching SHA-256 / SHA3-256',
          suggestedAction: 'encode',
        });
        hashCandidate = true;
      } else if (cleanHex.length === 128) {
        results.push({
          methodId: 'sha512',
          name: 'SHA-512 Hash Digest (128 hex chars)',
          category: 'hashes',
          confidence: 85,
          reason: 'Exact 128-hex character length matching SHA-512',
          suggestedAction: 'encode',
        });
        hashCandidate = true;
      }
    }

    try {
      const decoded = decodeHex(trimmed);
      if (isPrintableText(decoded)) {
        results.push({
          methodId: 'hex',
          name: 'Hexadecimal (Base16)',
          category: 'encoding',
          confidence: hashCandidate ? 75 : 94,
          reason: 'Valid hex byte sequence that decodes to printable text',
          suggestedAction: 'decode',
          decodedSample: decoded.slice(0, 100),
        });
      }
    } catch {
      // Ignored
    }
  }

  // 11. HTML Entities
  if (/&[a-zA-Z]+;|&#[0-9]+;|&#x[0-9a-fA-F]+;/.test(trimmed)) {
    results.push({
      methodId: 'html',
      name: 'HTML Entities',
      category: 'web',
      confidence: 92,
      reason: 'Contains encoded HTML special character entities',
      suggestedAction: 'decode',
      decodedSample: decodeHtmlEntities(trimmed).slice(0, 100),
    });
  }

  // 12. URL / URI Encoding
  if (/%[0-9a-fA-F]{2}/.test(trimmed)) {
    const matchCount = (trimmed.match(/%[0-9a-fA-F]{2}/g) || []).length;
    if (matchCount >= 1) {
      results.push({
        methodId: 'url',
        name: 'URL / URI Percent-Encoding',
        category: 'web',
        confidence: matchCount > 2 ? 94 : 80,
        reason: 'Contains URL percent-escaped byte sequences (%XX)',
        suggestedAction: 'decode',
        decodedSample: decodeUrl(trimmed).slice(0, 100),
      });
    }
  }

  // 13. Base64 / Base64URL
  const cleanB64 = trimmed.replace(/\s+/g, '');
  if (/^[A-Za-z0-9+/]+={0,2}$/.test(cleanB64) && cleanB64.length >= 4 && cleanB64.length % 4 === 0) {
    try {
      const decoded = decodeBase64(cleanB64);
      if (isPrintableText(decoded)) {
        results.push({
          methodId: 'base64',
          name: 'Base64 (Standard RFC 4648)',
          category: 'encoding',
          confidence: 92,
          reason: 'Valid Base64 characters and padding that decodes to readable text',
          suggestedAction: 'decode',
          decodedSample: decoded.slice(0, 100),
        });
      }
    } catch {
      // Ignored
    }
  } else if (/^[A-Za-z0-9_-]+$/.test(cleanB64) && cleanB64.length >= 4) {
    try {
      let b64 = cleanB64.replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4 !== 0) b64 += '=';
      const decoded = decodeBase64(b64);
      if (isPrintableText(decoded)) {
        results.push({
          methodId: 'base64url',
          name: 'Base64URL (URL-Safe)',
          category: 'encoding',
          confidence: 88,
          reason: 'Base64 string with URL-safe characters (- and _)',
          suggestedAction: 'decode',
          decodedSample: decoded.slice(0, 100),
        });
      }
    } catch {
      // Ignored
    }
  }

  // 14. Base32
  const cleanB32 = trimmed.toUpperCase().replace(/\s+/g, '');
  if (/^[A-Z2-7]+=*$/.test(cleanB32) && cleanB32.length >= 8) {
    results.push({
      methodId: 'base32',
      name: 'Base32 (RFC 4648)',
      category: 'encoding',
      confidence: 80,
      reason: 'Contains valid Base32 alphabet characters (A-Z, 2-7)',
      suggestedAction: 'decode',
    });
  }

  // 15. Base58 (Bitcoin style)
  const cleanB58 = trimmed.replace(/\s+/g, '');
  if (/^[1-9A-HJ-NP-Za-km-z]{10,}$/.test(cleanB58) && !cleanB58.includes('0') && !cleanB58.includes('O') && !cleanB58.includes('I') && !cleanB58.includes('l')) {
    results.push({
      methodId: 'base58',
      name: 'Base58',
      category: 'encoding',
      confidence: 76,
      reason: 'Base58 alphabet excluding ambiguous characters (0, O, I, l)',
      suggestedAction: 'decode',
    });
  }

  // 16. Caesar Cipher Analysis (Frequency Scoring)
  if (trimmed.length >= 15 && /[a-zA-Z]/.test(trimmed)) {
    const rawScore = scoreEnglishText(trimmed);
    const shifts = getAllCaesarShifts(trimmed);
    const bestShift = shifts[0];

    // If best shift has significantly higher score than raw input and score is high
    if (bestShift && bestShift.score > 800 && bestShift.score > rawScore + 200) {
      results.push({
        methodId: 'caesar',
        name: `Caesar Cipher (Shift ${bestShift.shift})`,
        category: 'ciphers',
        confidence: Math.min(95, Math.round((bestShift.score / 1000) * 100)),
        reason: `Frequency analysis matched English text with high probability at Shift ${bestShift.shift}`,
        suggestedAction: 'decode',
        decodedSample: bestShift.text.slice(0, 100),
        detectedParams: { caesarShift: bestShift.shift },
      });
    }
  }

  // Sort by confidence descending
  return results.sort((a, b) => b.confidence - a.confidence);
}
