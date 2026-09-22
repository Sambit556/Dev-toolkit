import {
  encodeBase64, decodeBase64,
  encodeBase32, decodeBase32,
  encodeBase58, decodeBase58,
  encodeBase85, decodeBase85,
  encodeHex, decodeHex,
  encodeBinary, decodeBinary,
  encodeUrl, decodeUrl,
  encodeHtmlEntities, decodeHtmlEntities,
  encodePunycode, decodePunycode,
  encodeQuotedPrintable, decodeQuotedPrintable,
  encodeUUEncode, decodeUUEncode,
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
  encryptAes, decryptAes,
  encryptDes, decryptDes,
  encryptTripleDes, decryptTripleDes,
  encryptRc4, decryptRc4,
  encryptRabbit, decryptRabbit,
  encryptBlowfish, decryptBlowfish,
  xorCipher,
  calculateMd5,
  calculateSha256,
  calculateCrc32,
  detectFormat,
  executeConversion,
} from '../index';

describe('Universal Encoder / Decoder & Encryption Suite', () => {
  const sample = 'Hello, World! 123';

  test('Base64 encode and decode roundtrip', () => {
    const encoded = encodeBase64(sample);
    expect(decodeBase64(encoded)).toBe(sample);
  });

  test('Base32 encode and decode roundtrip', () => {
    const encoded = encodeBase32(sample);
    expect(decodeBase32(encoded)).toBe(sample);
  });

  test('Base58 encode and decode roundtrip', () => {
    const encoded = encodeBase58(sample);
    expect(decodeBase58(encoded)).toBe(sample);
  });

  test('Base85 encode and decode roundtrip', () => {
    const encoded = encodeBase85(sample);
    expect(decodeBase85(encoded)).toBe(sample);
  });

  test('Hexadecimal encode and decode roundtrip', () => {
    const encoded = encodeHex(sample);
    expect(decodeHex(encoded)).toBe(sample);
  });

  test('Binary encode and decode roundtrip', () => {
    const encoded = encodeBinary(sample);
    expect(decodeBinary(encoded)).toBe(sample);
  });

  test('URL encode and decode roundtrip', () => {
    const encoded = encodeUrl(sample);
    expect(decodeUrl(encoded)).toBe(sample);
  });

  test('HTML entities encode and decode roundtrip', () => {
    const text = '<b>"Dev & Test"</b>';
    const encoded = encodeHtmlEntities(text);
    expect(decodeHtmlEntities(encoded)).toBe(text);
  });

  test('Punycode domain encode and decode', () => {
    const domain = 'münchen.de';
    const encoded = encodePunycode(domain);
    expect(encoded).toContain('xn--');
    expect(decodePunycode(encoded)).toBe(domain);
  });

  test('Quoted-Printable encode and decode roundtrip', () => {
    const text = 'Hello = World! àéîô';
    const encoded = encodeQuotedPrintable(text);
    expect(decodeQuotedPrintable(encoded)).toBe(text);
  });

  test('UUEncode encode and decode roundtrip', () => {
    const encoded = encodeUUEncode(sample);
    expect(decodeUUEncode(encoded)).toBe(sample);
  });

  test('Caesar Cipher shift roundtrip', () => {
    const shift = 7;
    const cipher = caesarCipher(sample, shift, false);
    expect(caesarCipher(cipher, shift, true)).toBe(sample);
  });

  test('ROT13 / ROT47 roundtrips', () => {
    expect(rot13(rot13(sample))).toBe(sample);
    expect(rot47(rot47(sample))).toBe(sample);
  });

  test('Atbash Cipher roundtrip', () => {
    expect(atbashCipher(atbashCipher(sample))).toBe(sample);
  });

  test('Vigenère Cipher roundtrip', () => {
    const key = 'CIPHERKEY';
    const encrypted = vigenereCipher(sample, key, false);
    expect(vigenereCipher(encrypted, key, true)).toBe(sample);
  });

  test('Affine Cipher roundtrip', () => {
    const encrypted = affineCipher(sample, 5, 8, false);
    expect(affineCipher(encrypted, 5, 8, true)).toBe(sample);
  });

  test('Rail Fence Cipher roundtrip', () => {
    const encrypted = encodeRailFence(sample, 4);
    expect(decodeRailFence(encrypted, 4)).toBe(sample);
  });

  test('Morse Code encode and decode', () => {
    const text = 'HELLO WORLD';
    const encoded = encodeMorse(text);
    expect(decodeMorse(encoded)).toBe(text);
  });

  test('Braille encode and decode', () => {
    const text = 'hello world';
    const encoded = encodeBraille(text);
    expect(decodeBraille(encoded)).toBe(text);
  });

  test('AES-256 Encryption and Decryption with Passphrase', () => {
    const pass = 'SuperSecretDevPass123!';
    const ciphertext = encryptAes(sample, { passphrase: pass });
    expect(ciphertext.startsWith('U2FsdGVkX1')).toBe(true);
    expect(decryptAes(ciphertext, { passphrase: pass })).toBe(sample);
  });

  test('DES and TripleDES Encryption and Decryption', () => {
    const pass = 'DesKey123';
    const desCipher = encryptDes(sample, { passphrase: pass });
    expect(decryptDes(desCipher, { passphrase: pass })).toBe(sample);

    const tripleDesCipher = encryptTripleDes(sample, { passphrase: pass });
    expect(decryptTripleDes(tripleDesCipher, { passphrase: pass })).toBe(sample);
  });

  test('RC4 and Rabbit Stream Ciphers', () => {
    const pass = 'StreamKey';
    const rc4Cipher = encryptRc4(sample, { passphrase: pass });
    expect(decryptRc4(rc4Cipher, { passphrase: pass })).toBe(sample);

    const rabbitCipher = encryptRabbit(sample, { passphrase: pass });
    expect(decryptRabbit(rabbitCipher, { passphrase: pass })).toBe(sample);
  });

  test('Blowfish and XOR Ciphers', () => {
    const pass = 'BlowfishKey';
    const bfCipher = encryptBlowfish(sample, { passphrase: pass });
    expect(decryptBlowfish(bfCipher, { passphrase: pass })).toBe(sample);

    const xorEnc = xorCipher(sample, { passphrase: pass }, false);
    expect(xorCipher(xorEnc, { passphrase: pass }, true)).toBe(sample);
  });

  test('Hashes: MD5, SHA-256, CRC32', () => {
    expect(calculateMd5('test')).toBe('098f6bcd4621d373cade4e832627b4f6');
    expect(calculateSha256('test')).toBe('9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08');
    expect(calculateCrc32('test')).toBe('D87F7E0C');
  });

  test('Auto-detection: OpenSSL AES Salted Ciphertext', () => {
    const ciphertext = encryptAes('Secret message', { passphrase: 'secret' });
    const detections = detectFormat(ciphertext);
    expect(detections.length).toBeGreaterThan(0);
    expect(detections[0].methodId).toBe('aes-256');
    expect(detections[0].requiresPassphrase).toBe(true);
  });

  test('Auto-detection: Morse code', () => {
    const morse = '.... . .-.. .-.. --- / .-- --- .-. .-.. -..';
    const detections = detectFormat(morse);
    expect(detections.length).toBeGreaterThan(0);
    expect(detections[0].methodId).toBe('morse');
  });

  test('Auto-detection: Hex dump', () => {
    const hex = '48 65 6c 6c 6f 20 57 6f 72 6c 64';
    const detections = detectFormat(hex);
    expect(detections.some((d) => d.methodId === 'hex')).toBe(true);
  });

  test('Auto-detection: Base64', () => {
    const b64 = 'SGVsbG8sIFdvcmxkIQ==';
    const detections = detectFormat(b64);
    expect(detections.some((d) => d.methodId === 'base64')).toBe(true);
  });

  test('Auto-detection: URL encoded', () => {
    const urlEnc = 'hello%20world%20test%3Ffoo%3Dbar';
    const detections = detectFormat(urlEnc);
    expect(detections.some((d) => d.methodId === 'url')).toBe(true);
  });
});
