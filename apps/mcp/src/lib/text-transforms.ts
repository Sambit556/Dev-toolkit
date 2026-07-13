const MORSE_MAP: Record<string, string> = {
  a: '.-', b: '-...', c: '-.-.', d: '-..', e: '.', f: '..-.', g: '--.', h: '....',
  i: '..', j: '.---', k: '-.-', l: '.-..', m: '--', n: '-.', o: '---', p: '.--.',
  q: '--.-', r: '.-.', s: '...', t: '-', u: '..-', v: '...-', w: '.--', x: '-..-',
  y: '-.--', z: '--..', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.', '0': '-----',
  ' ': '/', '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--',
  '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...', ';': '-.-.-.',
  '=': '-...-', '+': '.-.-.', '-': '-....-', _: '..--.-', '"': '.-..-.', $: '...-..-',
  '@': '.--.-.',
};
const REVERSE_MORSE: Record<string, string> = Object.fromEntries(
  Object.entries(MORSE_MAP).map(([k, v]) => [v, k]),
);

export function base64Encode(text: string): string {
  return Buffer.from(text, 'utf8').toString('base64');
}
export function base64Decode(text: string): string {
  return Buffer.from(text, 'base64').toString('utf8');
}
export function urlEncode(text: string): string {
  return encodeURIComponent(text);
}
export function urlDecode(text: string): string {
  return decodeURIComponent(text);
}
export function htmlEntityEncode(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
export function htmlEntityDecode(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}
export function hexEncode(text: string): string {
  return Array.from(text).map((c) => c.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase()).join(' ');
}
export function hexDecode(text: string): string {
  const hex = text.replace(/[^0-9A-Fa-f]/g, '');
  let decoded = '';
  for (let i = 0; i < hex.length; i += 2) {
    decoded += String.fromCharCode(parseInt(hex.substring(i, i + 2), 16));
  }
  return decoded;
}
export function binaryEncode(text: string): string {
  return Array.from(text).map((c) => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
}
export function binaryDecode(text: string): string {
  const bin = text.replace(/[^01]/g, '');
  let decoded = '';
  for (let i = 0; i < bin.length; i += 8) {
    const byte = bin.substring(i, i + 8);
    if (byte.length === 8) decoded += String.fromCharCode(parseInt(byte, 2));
  }
  return decoded;
}
export function octalEncode(text: string): string {
  return Array.from(text).map((c) => c.charCodeAt(0).toString(8).padStart(3, '0')).join(' ');
}
export function octalDecode(text: string): string {
  return text.trim().split(/\s+/).map((o) => String.fromCharCode(parseInt(o, 8))).join('');
}
export function rot13(text: string): string {
  return text.replace(/[a-zA-Z]/g, (c) => String.fromCharCode(c.charCodeAt(0) + (c.toLowerCase() < 'n' ? 13 : -13)));
}
export function caesarCipher(text: string, shift: number, decode: boolean): string {
  const s = decode ? (26 - (shift % 26)) % 26 : shift % 26;
  return text.replace(/[a-zA-Z]/g, (c) => {
    const code = c.charCodeAt(0);
    const base = code >= 97 ? 97 : 65;
    return String.fromCharCode(((code - base + s + 26) % 26) + base);
  });
}
export function morseEncode(text: string): string {
  return text.toLowerCase().split('').map((c) => MORSE_MAP[c] || '').filter((x) => x !== '').join(' ');
}
export function morseDecode(text: string): string {
  return text.trim().split(' / ').map((word) => word.split(' ').map((ch) => REVERSE_MORSE[ch] || '?').join('')).join(' ');
}

export const toCamelCase = (str: string) =>
  str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => (index === 0 ? word.toLowerCase() : word.toUpperCase()))
    .replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
export const toPascalCase = (str: string) =>
  str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase()).replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
export const toSnakeCase = (str: string) =>
  str.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)?.map((x) => x.toLowerCase()).join('_') ||
  str.toLowerCase().replace(/\s+/g, '_');
export const toKebabCase = (str: string) =>
  str.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)?.map((x) => x.toLowerCase()).join('-') ||
  str.toLowerCase().replace(/\s+/g, '-');
export const toConstantCase = (str: string) => toSnakeCase(str).toUpperCase();
export const toTitleCase = (str: string) =>
  str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
export const toSentenceCase = (str: string) =>
  str.toLowerCase().replace(/(^\s*|[.!?]\s+)([a-z])/g, (_m, g1, g2) => g1 + g2.toUpperCase());
export const toAlternatingCase = (str: string) =>
  str.split('').map((c, i) => (i % 2 === 0 ? c.toLowerCase() : c.toUpperCase())).join('');

export function convertTextCase(text: string, mode: string): string {
  switch (mode) {
    case 'camel': return toCamelCase(text);
    case 'pascal': return toPascalCase(text);
    case 'snake': return toSnakeCase(text);
    case 'kebab': return toKebabCase(text);
    case 'constant': return toConstantCase(text);
    case 'upper': return text.toUpperCase();
    case 'lower': return text.toLowerCase();
    case 'title': return toTitleCase(text);
    case 'sentence': return toSentenceCase(text);
    case 'alternating': return toAlternatingCase(text);
    default: throw new Error(`Unknown case mode: ${mode}`);
  }
}

export interface TextStats {
  chars: number;
  charsNoSpaces: number;
  words: number;
  sentences: number;
  lines: number;
  paragraphs: number;
  readingTimeMinutes: number;
  speakingTimeMinutes: number;
}

export function computeTextStatistics(text: string): TextStats {
  const chars = text.length;
  const charsNoSpaces = text.replace(/\s/g, '').length;
  const wordsArr = text.trim().split(/\s+/).filter((w) => w.length > 0);
  const words = wordsArr.length;
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
  const lines = text.split('\n').length;
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length;
  return {
    chars,
    charsNoSpaces,
    words,
    sentences,
    lines,
    paragraphs,
    readingTimeMinutes: Math.ceil(words / 200),
    speakingTimeMinutes: Math.ceil(words / 130),
  };
}

export function wordFrequency(text: string, topN = 10): { word: string; count: number }[] {
  const freqMap: Record<string, number> = {};
  text.trim().split(/\s+/).filter((w) => w.length > 0).forEach((w) => {
    const clean = w.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
    if (clean) freqMap[clean] = (freqMap[clean] || 0) + 1;
  });
  return Object.entries(freqMap).map(([word, count]) => ({ word, count })).sort((a, b) => b.count - a.count).slice(0, topN);
}

export function charFrequency(text: string, topN = 10): { char: string; count: number }[] {
  const charMap: Record<string, number> = {};
  Array.from(text.toLowerCase()).forEach((c) => {
    if (c !== ' ' && c !== '\n') charMap[c] = (charMap[c] || 0) + 1;
  });
  return Object.entries(charMap).map(([char, count]) => ({ char, count })).sort((a, b) => b.count - a.count).slice(0, topN);
}
