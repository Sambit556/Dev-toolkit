export type MethodCategory =
  | 'auto'
  | 'encoding'
  | 'ciphers'
  | 'encryption'
  | 'web'
  | 'hashes';

export type ConversionMethodId =
  // Auto
  | 'auto'
  // Encodings
  | 'base64'
  | 'base64url'
  | 'base32'
  | 'base32hex'
  | 'base58'
  | 'base85'
  | 'z85'
  | 'hex'
  | 'binary'
  | 'octal'
  | 'decimal'
  | 'unicode'
  | 'punycode'
  | 'quoted-printable'
  | 'uuencode'
  // Web & Format
  | 'url'
  | 'html'
  // Classical Ciphers
  | 'caesar'
  | 'rot13'
  | 'rot5'
  | 'rot18'
  | 'rot47'
  | 'atbash'
  | 'vigenere'
  | 'affine'
  | 'railfence'
  | 'bacon'
  | 'polybius'
  | 'morse'
  | 'braille'
  | 'tapcode'
  | 'reverse'
  // Asymmetric & Symmetric Encryption
  | 'rsa'
  | 'aes-256'
  | 'aes-192'
  | 'aes-128'
  | 'des'
  | 'tripledes'
  | 'rc4'
  | 'rabbit'
  | 'blowfish'
  | 'xor'
  // Hashes & Digests (One-way / Verify / HMAC)
  | 'md5'
  | 'sha1'
  | 'sha256'
  | 'sha512'
  | 'sha3'
  | 'ripemd160'
  | 'crc32'
  | 'hmac-sha256'
  | 'hmac-sha512'
  | 'hmac-md5';

export interface MethodDefinition {
  id: ConversionMethodId;
  name: string;
  category: MethodCategory;
  description: string;
  isOneWay?: boolean;
  requiresPassphrase?: boolean;
  defaultMode?: 'encode' | 'decode';
  placeholder?: {
    encode?: string;
    decode?: string;
  };
}

export interface ConversionOptions {
  // Passphrase / Secret Key
  passphrase?: string;
  // Caesar cipher
  caesarShift?: number;
  // Affine cipher
  affineA?: number;
  affineB?: number;
  // Rail fence cipher
  railCount?: number;
  // Vigenere / XOR key
  cipherKey?: string;
  // Hex format options
  hexDelimiter?: 'space' | 'none' | 'colon' | 'prefix-0x' | 'escaped';
  // Binary format options
  binaryByteSpaced?: boolean;
  // AES mode
  aesMode?: 'CBC' | 'CTR' | 'ECB' | 'CFB' | 'OFB';
  // HMAC key
  hmacKey?: string;
  // Morse separator
  morseLetterSeparator?: string;
  morseWordSeparator?: string;
  // URL encoding strictness
  urlFullEncoding?: boolean;
  // RSA options
  rsaPublicKey?: string;
  rsaPrivateKey?: string;
  rsaPadding?: 'OAEP-SHA256' | 'OAEP-SHA1' | 'PKCS1-v1_5' | 'RAW';
  rsaKeySize?: 1024 | 2048 | 4096;
  rsaOutputFormat?: 'base64' | 'hex';
}

export interface DetectionResult {
  methodId: ConversionMethodId;
  name: string;
  category: MethodCategory;
  confidence: number; // 0 to 100
  reason: string;
  requiresPassphrase?: boolean;
  suggestedAction?: 'decode' | 'encode';
  decodedSample?: string;
  detectedParams?: Partial<ConversionOptions>;
}

export interface ConversionExecutionResult {
  output: string;
  error?: string;
  detectedMethod?: DetectionResult;
  stats?: {
    inputChars: number;
    inputBytes: number;
    inputLines: number;
    outputChars: number;
    outputBytes: number;
    outputLines: number;
    entropy: number; // Shannon entropy 0-8
  };
}
