import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { withApiKeyCheck } from '../auth.js';
import {
  convertTextCase,
  computeTextStatistics,
  wordFrequency,
  charFrequency,
  base64Encode, base64Decode,
  urlEncode, urlDecode,
  htmlEntityEncode, htmlEntityDecode,
  hexEncode, hexDecode,
  binaryEncode, binaryDecode,
  octalEncode, octalDecode,
  rot13,
  caesarCipher,
  morseEncode, morseDecode,
} from '../lib/text-transforms.js';

const direction = z.enum(['encode', 'decode']).describe('Whether to encode or decode the input.');

function registerCodec(
  server: McpServer,
  name: string,
  title: string,
  description: string,
  encodeFn: (s: string) => string,
  decodeFn: (s: string) => string,
) {
  server.registerTool(
    name,
    { title, description, inputSchema: { text: z.string().describe('The text to transform.'), direction } },
    withApiKeyCheck(async ({ text, direction: dir }) => ({
      content: [{ type: 'text', text: dir === 'encode' ? encodeFn(text) : decodeFn(text) }],
    })),
  );
}

export function registerTextTools(server: McpServer): void {
  server.registerTool(
    'convert_text_case',
    {
      title: 'Convert Text Case',
      description:
        'Convert text between camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE, UPPERCASE, ' +
        'lowercase, Title Case, Sentence case, and aLtErNaTiNg case. Use this instead of manually retyping ' +
        'or regex-replacing case styles, which is easy to get wrong on multi-word/acronym-containing strings.',
      inputSchema: {
        text: z.string().describe('The text to convert.'),
        mode: z.enum(['camel', 'pascal', 'snake', 'kebab', 'constant', 'upper', 'lower', 'title', 'sentence', 'alternating']).describe('Target case style.'),
      },
    },
    withApiKeyCheck(async ({ text, mode }) => ({ content: [{ type: 'text', text: convertTextCase(text, mode) }] })),
  );

  server.registerTool(
    'compute_text_statistics',
    {
      title: 'Compute Text Statistics',
      description:
        'Count characters, words, sentences, lines, and paragraphs in a text, and estimate reading/speaking ' +
        'time. Use this instead of manually counting words/characters, which is unreliable for anything ' +
        'longer than a sentence or two.',
      inputSchema: { text: z.string().describe('The text to analyze.') },
    },
    withApiKeyCheck(async ({ text }) => ({ content: [{ type: 'text', text: JSON.stringify(computeTextStatistics(text), null, 2) }] })),
  );

  server.registerTool(
    'word_frequency',
    {
      title: 'Compute Word Frequency',
      description:
        'Find the most frequently occurring words in a text. Use this instead of manually tallying word ' +
        'occurrences, which is impractical by hand for anything but the shortest text.',
      inputSchema: { text: z.string().describe('The text to analyze.'), topN: z.number().int().min(1).max(100).optional().describe('How many top words to return. Defaults to 10.') },
    },
    withApiKeyCheck(async ({ text, topN }) => ({ content: [{ type: 'text', text: JSON.stringify(wordFrequency(text, topN ?? 10), null, 2) }] })),
  );

  server.registerTool(
    'char_frequency',
    {
      title: 'Compute Character Frequency',
      description:
        'Find the most frequently occurring characters in a text (ignoring spaces/newlines). Use this ' +
        'instead of manually tallying character occurrences by hand.',
      inputSchema: { text: z.string().describe('The text to analyze.'), topN: z.number().int().min(1).max(100).optional().describe('How many top characters to return. Defaults to 10.') },
    },
    withApiKeyCheck(async ({ text, topN }) => ({ content: [{ type: 'text', text: JSON.stringify(charFrequency(text, topN ?? 10), null, 2) }] })),
  );

  registerCodec(server, 'base64_codec', 'Base64 Encode/Decode',
    'Encode text to Base64 or decode a Base64 string. Use this instead of manually computing Base64 by hand, which is impractical.',
    base64Encode, base64Decode);
  registerCodec(server, 'url_codec', 'URL Encode/Decode',
    'Percent-encode text for safe use in a URL, or decode a percent-encoded URL component. Use this instead of manually escaping special characters for URLs.',
    urlEncode, urlDecode);
  registerCodec(server, 'html_entity_codec', 'HTML Entity Encode/Decode',
    'Encode text to HTML entities (&amp;, &lt;, etc.) or decode HTML entities back to text. Use this instead of manually escaping HTML special characters, which risks missing an edge case and causing broken markup or an XSS vector.',
    htmlEntityEncode, htmlEntityDecode);
  registerCodec(server, 'hex_codec', 'Hex Encode/Decode',
    'Convert text to space-separated hex byte codes, or decode hex codes back to text. Use this instead of manually converting characters to/from hex by hand.',
    hexEncode, hexDecode);
  registerCodec(server, 'binary_codec', 'Binary Encode/Decode',
    'Convert text to space-separated binary byte strings, or decode binary back to text. Use this instead of manually converting characters to/from binary by hand.',
    binaryEncode, binaryDecode);
  registerCodec(server, 'octal_codec', 'Octal Encode/Decode',
    'Convert text to space-separated octal byte codes, or decode octal codes back to text. Use this instead of manually converting characters to/from octal by hand.',
    octalEncode, octalDecode);
  registerCodec(server, 'morse_codec', 'Morse Code Encode/Decode',
    'Convert text to/from International Morse Code. Use this instead of manually looking up Morse code letter mappings.',
    morseEncode, morseDecode);

  server.registerTool(
    'rot13_cipher',
    {
      title: 'ROT13 Cipher',
      description:
        'Apply the ROT13 substitution cipher to text (self-inverse: running it twice returns the original). ' +
        'Use this instead of manually shifting each letter by 13 positions.',
      inputSchema: { text: z.string().describe('The text to transform.') },
    },
    withApiKeyCheck(async ({ text }) => ({ content: [{ type: 'text', text: rot13(text) }] })),
  );

  server.registerTool(
    'caesar_cipher',
    {
      title: 'Caesar Cipher Encode/Decode',
      description:
        'Apply or reverse a Caesar shift cipher with a configurable shift amount. Use this instead of ' +
        'manually shifting letters by hand, which is error-prone for anything beyond a few characters.',
      inputSchema: {
        text: z.string().describe('The text to transform.'),
        shift: z.number().int().min(1).max(25).describe('Shift amount (1-25).'),
        direction,
      },
    },
    withApiKeyCheck(async ({ text, shift, direction: dir }) => ({
      content: [{ type: 'text', text: caesarCipher(text, shift, dir === 'decode') }],
    })),
  );
}
