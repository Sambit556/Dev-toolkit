import { ConversionOptions } from '../types';

// ======================== CAESAR CIPHER ========================
export function caesarCipher(input: string, shift: number, decode = false): string {
  const effectiveShift = decode ? (26 - (shift % 26)) % 26 : (shift % 26 + 26) % 26;
  return input.replace(/[a-zA-Z]/g, (char) => {
    const code = char.charCodeAt(0);
    const base = code >= 97 ? 97 : 65;
    return String.fromCharCode(((code - base + effectiveShift) % 26) + base);
  });
}

// English Letter Frequencies for frequency analysis
const ENGLISH_FREQUENCIES: Record<string, number> = {
  a: 8.167, b: 1.492, c: 2.782, d: 4.253, e: 12.702, f: 2.228, g: 2.015,
  h: 6.094, i: 6.966, j: 0.153, k: 0.772, l: 4.025,  m: 2.406, n: 6.749,
  o: 7.507, p: 1.929, q: 0.095, r: 5.987, s: 6.327,  t: 9.056, u: 2.758,
  v: 0.978, w: 2.360, x: 0.150, y: 1.974, z: 0.074,
};

export function scoreEnglishText(text: string): number {
  const letters = text.toLowerCase().replace(/[^a-z]/g, '');
  if (letters.length === 0) return 0;

  const counts: Record<string, number> = {};
  for (const ch of letters) {
    counts[ch] = (counts[ch] || 0) + 1;
  }

  // Chi-squared distance to English letter frequency (lower is closer to English)
  let chiSquared = 0;
  for (const [ch, expectedFreq] of Object.entries(ENGLISH_FREQUENCIES)) {
    const observed = counts[ch] || 0;
    const expected = (expectedFreq / 100) * letters.length;
    chiSquared += Math.pow(observed - expected, 2) / (expected || 1);
  }

  // Common English word bonus
  const commonWords = [' the ', ' be ', ' to ', ' of ', ' and ', ' a ', ' in ', ' that ', ' have ', ' i ', ' it ', ' for ', ' not ', ' on ', ' with ', ' he ', ' as ', ' you ', ' do ', ' at '];
  const lowerText = ` ${text.toLowerCase()} `;
  let bonus = 0;
  for (const w of commonWords) {
    if (lowerText.includes(w)) bonus += 15;
  }

  return Math.max(0, 1000 - chiSquared + bonus);
}

export function getAllCaesarShifts(input: string): Array<{ shift: number; text: string; score: number }> {
  const results = [];
  for (let shift = 1; shift <= 25; shift++) {
    const decoded = caesarCipher(input, shift, true);
    const score = scoreEnglishText(decoded);
    results.push({ shift, text: decoded, score });
  }
  return results.sort((a, b) => b.score - a.score);
}

// ======================== ROT CIPHERS ========================
export function rot13(input: string): string {
  return input.replace(/[a-zA-Z]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) + (c.toLowerCase() < 'n' ? 13 : -13))
  );
}

export function rot5(input: string): string {
  return input.replace(/[0-9]/g, (c) =>
    String.fromCharCode(((c.charCodeAt(0) - 48 + 5) % 10) + 48)
  );
}

export function rot18(input: string): string {
  return rot5(rot13(input));
}

export function rot47(input: string): string {
  return input.replace(/[\x21-\x7E]/g, (c) =>
    String.fromCharCode(33 + ((c.charCodeAt(0) - 33 + 47) % 94))
  );
}

// ======================== ATBASH CIPHER ========================
export function atbashCipher(input: string): string {
  return input.replace(/[a-zA-Z]/g, (c) => {
    const code = c.charCodeAt(0);
    if (code >= 65 && code <= 90) {
      return String.fromCharCode(90 - (code - 65));
    }
    return String.fromCharCode(122 - (code - 97));
  });
}

// ======================== VIGENÈRE CIPHER ========================
export function vigenereCipher(input: string, key: string, decode = false): string {
  const cleanKey = key.toLowerCase().replace(/[^a-z]/g, '');
  if (!cleanKey) return input;

  let keyIndex = 0;
  return input.replace(/[a-zA-Z]/g, (c) => {
    const code = c.charCodeAt(0);
    const isUpper = code >= 65 && code <= 90;
    const base = isUpper ? 65 : 97;
    const shift = cleanKey.charCodeAt(keyIndex % cleanKey.length) - 97;
    keyIndex++;

    const effectiveShift = decode ? (26 - shift) % 26 : shift;
    return String.fromCharCode(((code - base + effectiveShift) % 26) + base);
  });
}

// ======================== AFFINE CIPHER ========================
// E(x) = (ax + b) mod 26
// D(x) = a^-1 (x - b) mod 26
function modInverse(a: number, m: number): number {
  a = ((a % m) + m) % m;
  for (let x = 1; x < m; x++) {
    if ((a * x) % m === 1) return x;
  }
  return 1;
}

export function affineCipher(input: string, a = 5, b = 8, decode = false): string {
  const gcd = (x: number, y: number): number => (!y ? x : gcd(y, x % y));
  if (gcd(a, 26) !== 1) {
    throw new Error('Key "a" must be coprime to 26 (valid values: 1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25)');
  }

  const aInv = modInverse(a, 26);
  return input.replace(/[a-zA-Z]/g, (c) => {
    const code = c.charCodeAt(0);
    const isUpper = code >= 65 && code <= 90;
    const base = isUpper ? 65 : 97;
    const x = code - base;

    let res: number;
    if (decode) {
      res = (aInv * (x - b + 2600)) % 26;
    } else {
      res = (a * x + b) % 26;
    }
    return String.fromCharCode(res + base);
  });
}

// ======================== RAIL FENCE CIPHER ========================
export function encodeRailFence(input: string, rails = 3): string {
  if (rails <= 1 || input.length <= rails) return input;

  const fence: string[][] = Array.from({ length: rails }, () => []);
  let rail = 0;
  let direction = 1;

  for (const char of input) {
    fence[rail].push(char);
    rail += direction;
    if (rail === rails - 1 || rail === 0) {
      direction = -direction;
    }
  }

  return fence.map((r) => r.join('')).join('');
}

export function decodeRailFence(input: string, rails = 3): string {
  if (rails <= 1 || input.length <= rails) return input;

  // Mark pattern positions
  const pattern: number[][] = Array.from({ length: rails }, () => []);
  let rail = 0;
  let direction = 1;

  for (let i = 0; i < input.length; i++) {
    pattern[rail].push(i);
    rail += direction;
    if (rail === rails - 1 || rail === 0) {
      direction = -direction;
    }
  }

  const result: string[] = new Array(input.length);
  let index = 0;
  for (let r = 0; r < rails; r++) {
    for (let c = 0; c < pattern[r].length; c++) {
      result[pattern[r][c]] = input[index++];
    }
  }

  return result.join('');
}

// ======================== BACON'S CIPHER ========================
const BACON_MAP: Record<string, string> = {
  A: 'AAAAA', B: 'AAAAB', C: 'AAABA', D: 'AAABB', E: 'AABAA',
  F: 'AABAB', G: 'AABBA', H: 'AABBB', I: 'ABAAA', J: 'ABAAB',
  K: 'ABABA', L: 'ABABB', M: 'ABBAA', N: 'ABBAB', O: 'ABBBA',
  P: 'ABBBB', Q: 'BAAAA', R: 'BAAAB', S: 'BAABA', T: 'BAABB',
  U: 'BABAA', V: 'BABAB', W: 'BABBA', X: 'BABBB', Y: 'BBAAA',
  Z: 'BBAAB',
};
const BACON_REVERSE = Object.fromEntries(Object.entries(BACON_MAP).map(([k, v]) => [v, k]));

export function encodeBacon(input: string): string {
  return input
    .toUpperCase()
    .split('')
    .map((c) => BACON_MAP[c] || c)
    .join(' ');
}

export function decodeBacon(input: string): string {
  const clean = input.toUpperCase().replace(/[^AB\s]/g, '');
  const tokens = clean.split(/\s+/).filter(Boolean);

  // If no spaces, split into chunks of 5
  if (tokens.length === 1 && clean.length > 5) {
    const chunks = clean.match(/.{1,5}/g) || [];
    return chunks.map((chunk) => BACON_REVERSE[chunk] || '?').join('');
  }

  return tokens.map((token) => BACON_REVERSE[token] || token).join('');
}

// ======================== POLYBIUS SQUARE CIPHER ========================
// 5x5 Square combining I and J
const POLYBIUS_SQUARE: Record<string, string> = {
  A: '11', B: '12', C: '13', D: '14', E: '15',
  F: '21', G: '22', H: '23', I: '24', J: '24', K: '25',
  L: '31', M: '32', N: '33', O: '34', P: '35',
  Q: '41', R: '42', S: '43', T: '44', U: '45',
  V: '51', W: '52', X: '53', Y: '54', Z: '55',
};
const POLYBIUS_REVERSE: Record<string, string> = {
  '11': 'A', '12': 'B', '13': 'C', '14': 'D', '15': 'E',
  '21': 'F', '22': 'G', '23': 'H', '24': 'I', '25': 'K',
  '31': 'L', '32': 'M', '33': 'N', '34': 'O', '35': 'P',
  '41': 'Q', '42': 'R', '43': 'S', '44': 'T', '45': 'U',
  '51': 'V', '52': 'W', '53': 'X', '54': 'Y', '55': 'Z',
};

export function encodePolybius(input: string): string {
  return input
    .toUpperCase()
    .split('')
    .map((c) => POLYBIUS_SQUARE[c] || c)
    .join(' ');
}

export function decodePolybius(input: string): string {
  const digits = input.replace(/[^1-5]/g, '');
  let decoded = '';
  for (let i = 0; i < digits.length; i += 2) {
    const pair = digits.substring(i, i + 2);
    if (pair.length === 2) {
      decoded += POLYBIUS_REVERSE[pair] || '?';
    }
  }
  return decoded;
}

// ======================== MORSE CODE ========================
export const MORSE_MAP: Record<string, string> = {
  a: '.-', b: '-...', c: '-.-.', d: '-..', e: '.', f: '..-.', g: '--.', h: '....',
  i: '..', j: '.---', k: '-.-', l: '.-..', m: '--', n: '-.', o: '---', p: '.--.',
  q: '--.-', r: '.-.', s: '...', t: '-', u: '..-', v: '...-', w: '.--', x: '-..-',
  y: '-.--', z: '--..', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.', '0': '-----',
  ' ': '/', '.': '.-.-.-', ',': '--..--', '?': '..--..', '\'': '.----.', '!': '-.-.--',
  '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...', ';': '-.-.-.',
  '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.', '$': '...-..-',
  '@': '.--.-.',
};
export const REVERSE_MORSE: Record<string, string> = Object.fromEntries(
  Object.entries(MORSE_MAP).map(([k, v]) => [v, k.toUpperCase()])
);

export function encodeMorse(input: string, options?: ConversionOptions): string {
  const letterSep = options?.morseLetterSeparator || ' ';
  const wordSep = options?.morseWordSeparator || ' / ';

  const words = input.toLowerCase().split(/\s+/);
  return words
    .map((word) =>
      word
        .split('')
        .map((c) => MORSE_MAP[c] || '')
        .filter(Boolean)
        .join(letterSep)
    )
    .join(wordSep);
}

export function decodeMorse(input: string): string {
  // Normalize word separators
  const normalized = input.trim().replace(/\s*[/|]\s*/g, ' / ');
  const words = normalized.split(' / ');
  return words
    .map((word) =>
      word
        .split(/\s+/)
        .map((morseChar) => REVERSE_MORSE[morseChar] || '?')
        .join('')
    )
    .join(' ');
}

// ======================== BRAILLE TRANSLATION ========================
// Standard Grade 1 English Braille (Unicode Block 0x2800)
const BRAILLE_MAP: Record<string, string> = {
  a: '⠁', b: '⠃', c: '⠉', d: '⠙', e: '⠑', f: '⠋', g: '⠛', h: '⠓',
  i: '⠊', j: '⠚', k: '⠅', l: '⠇', m: '⠍', n: '⠝', o: '⠕', p: '⠏',
  q: '⠟', r: '⠗', s: '⠎', t: '⠞', u: '⠥', v: '⠧', w: '⠺', x: '⠭',
  y: '⠽', z: '⠵',
  '1': '⠼⠁', '2': '⠼⠃', '3': '⠼⠉', '4': '⠼⠙', '5': '⠼⠑',
  '6': '⠼⠋', '7': '⠼⠛', '8': '⠼⠓', '9': '⠼⠊', '0': '⠼⠚',
  ',': '⠂', ';': '⠆', ':': '⠒', '.': '⠲', '!': '⠖', '?': '⠦',
  '\'': '⠄', '-': '⠤', ' ': ' ',
};
const BRAILLE_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(BRAILLE_MAP).map(([k, v]) => [v, k])
);

export function encodeBraille(input: string): string {
  return input
    .toLowerCase()
    .split('')
    .map((c) => BRAILLE_MAP[c] || c)
    .join('');
}

export function decodeBraille(input: string): string {
  let output = '';
  let numberMode = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (char === '⠼') {
      numberMode = true;
      continue;
    }
    if (char === ' ') {
      numberMode = false;
      output += ' ';
      continue;
    }

    if (numberMode) {
      const numChar = BRAILLE_MAP[char];
      if (numChar) {
        output += numChar;
        continue;
      }
    }

    output += BRAILLE_REVERSE[char] || char;
  }
  return output;
}

// ======================== TAP CODE ========================
// Polybius tap code: row dots . column dots (e.g. C -> .. ...)
export function encodeTapCode(input: string): string {
  return input
    .toUpperCase()
    .split('')
    .map((c) => {
      const pos = POLYBIUS_SQUARE[c];
      if (!pos) return c;
      const row = parseInt(pos[0], 10);
      const col = parseInt(pos[1], 10);
      return '.'.repeat(row) + ' ' + '.'.repeat(col);
    })
    .join('   ');
}

export function decodeTapCode(input: string): string {
  const letters = input.trim().split(/\s{2,}|\//);
  return letters
    .map((letter) => {
      const parts = letter.trim().split(/\s+/);
      if (parts.length === 2 && /^\.+$/.test(parts[0]) && /^\.+$/.test(parts[1])) {
        const row = parts[0].length.toString();
        const col = parts[1].length.toString();
        return POLYBIUS_REVERSE[row + col] || '?';
      }
      return '';
    })
    .join('');
}

// ======================== REVERSE TEXT ========================
export function reverseText(input: string): string {
  return Array.from(input).reverse().join('');
}
