import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { withApiKeyCheck } from '../auth.js';
import {
  generatePassword,
  passwordEntropy,
  generateSecureToken,
  generateUuidV4,
  generateUuidV1,
  generateUuidV5,
  generateUlid,
  generateNanoId,
  decodeUuidV1,
  computeHmac,
  bcryptHash,
  bcryptVerify,
} from '../lib/crypto-tools.js';

export function registerSecurityTools(server: McpServer): void {
  server.registerTool(
    'generate_password',
    {
      title: 'Generate a Secure Random Password',
      description:
        'Generate a cryptographically random password from a configurable charset. Use this instead of ' +
        'inventing a "random-looking" password yourself — an LLM\'s output is not a secure random source ' +
        'and is guessable; this uses the platform CSPRNG.',
      inputSchema: {
        length: z.number().int().min(4).max(128).describe('Password length.'),
        upper: z.boolean().optional().describe('Include A-Z. Defaults to true.'),
        lower: z.boolean().optional().describe('Include a-z. Defaults to true.'),
        numbers: z.boolean().optional().describe('Include 0-9. Defaults to true.'),
        symbols: z.boolean().optional().describe('Include symbols. Defaults to true.'),
        excludeSimilar: z.boolean().optional().describe('Exclude visually similar chars (i, l, o, 1, 0, O). Defaults to false.'),
      },
    },
    withApiKeyCheck(async ({ length, upper, lower, numbers, symbols, excludeSimilar }) => {
      const password = generatePassword({
        length,
        upper: upper ?? true,
        lower: lower ?? true,
        numbers: numbers ?? true,
        symbols: symbols ?? true,
        excludeSimilar: excludeSimilar ?? false,
      });
      const { entropyBits, rating } = passwordEntropy(password);
      return { content: [{ type: 'text', text: `${password}\n\n(entropy: ~${entropyBits} bits, ${rating})` }] };
    }),
  );

  server.registerTool(
    'generate_secure_token',
    {
      title: 'Generate Secure Random Tokens',
      description:
        'Generate one or more cryptographically random tokens (hex, base64, base64url, uuid, alphanumeric, ' +
        'or alphabetic). Use this instead of asking an LLM to "make up" a random-looking API key or session ' +
        'token — those are not cryptographically random and must never be used as real secrets.',
      inputSchema: {
        type: z.enum(['hex', 'base64', 'base64url', 'uuid', 'alphanumeric', 'alpha']).describe('Token format.'),
        length: z.number().int().min(4).max(1024).optional().describe('Token length (ignored for "uuid"). Defaults to 32.'),
        count: z.number().int().min(1).max(500).optional().describe('How many tokens to generate. Defaults to 1.'),
      },
    },
    withApiKeyCheck(async ({ type, length, count }) => {
      const tokens = generateSecureToken(type, length ?? 32, count ?? 1);
      return { content: [{ type: 'text', text: tokens.join('\n') }] };
    }),
  );

  server.registerTool(
    'generate_uuid',
    {
      title: 'Generate a UUID (v4, v1, or v5)',
      description:
        'Generate a UUID: v4 (random), v1 (timestamp + node based), or v5 (deterministic SHA-1 hash of a ' +
        'namespace + name). Use this instead of inventing an ID string yourself — collision-free uniqueness ' +
        'requires an actual UUID algorithm, not a plausible-looking string.',
      inputSchema: {
        version: z.enum(['v4', 'v1', 'v5']).describe('UUID version to generate.'),
        namespace: z.string().optional().describe('Required for v5: a namespace UUID (e.g. the DNS namespace "6ba7b810-9dad-11d1-80b4-00c04fd430c8").'),
        name: z.string().optional().describe('Required for v5: the name to hash within the namespace.'),
      },
    },
    withApiKeyCheck(async ({ version, namespace, name }) => {
      if (version === 'v4') return { content: [{ type: 'text', text: generateUuidV4() }] };
      if (version === 'v1') return { content: [{ type: 'text', text: generateUuidV1() }] };
      if (!namespace || !name) throw new Error('UUID v5 requires both "namespace" and "name"');
      const uuid = await generateUuidV5(namespace, name);
      return { content: [{ type: 'text', text: uuid }] };
    }),
  );

  server.registerTool(
    'generate_ulid',
    {
      title: 'Generate a ULID',
      description:
        'Generate a ULID (a lexicographically sortable, timestamp-prefixed unique identifier). Use this ' +
        'instead of a plain UUID when you need IDs that sort chronologically as strings, e.g. for database ' +
        'primary keys or event logs.',
      inputSchema: {},
    },
    withApiKeyCheck(async () => ({ content: [{ type: 'text', text: generateUlid() }] })),
  );

  server.registerTool(
    'generate_nanoid',
    {
      title: 'Generate a NanoID',
      description:
        'Generate a NanoID: a compact, URL-friendly unique ID with a configurable size and alphabet. Use ' +
        'this instead of a UUID when you want a shorter identifier for URLs or filenames.',
      inputSchema: {
        size: z.number().int().min(1).max(128).optional().describe('ID length. Defaults to 21.'),
        alphabet: z.string().optional().describe('Custom character alphabet to draw from.'),
      },
    },
    withApiKeyCheck(async ({ size, alphabet }) => ({ content: [{ type: 'text', text: generateNanoId(size, alphabet) }] })),
  );

  server.registerTool(
    'decode_uuid_v1',
    {
      title: 'Decode a UUID v1 (Extract Timestamp)',
      description:
        'Extract the embedded creation timestamp, node/MAC identifier, and clock sequence from a UUID v1. ' +
        'Use this instead of manually reverse-engineering the Gregorian-epoch bit layout of a v1 UUID by hand.',
      inputSchema: { uuid: z.string().min(1).describe('A UUID v1 string, e.g. "d68a3f80-0a8b-11ed-b57d-0800200c9a66".') },
    },
    withApiKeyCheck(async ({ uuid }) => {
      const details = decodeUuidV1(uuid);
      if (!details) return { content: [{ type: 'text', text: 'Not a valid UUID v1 (version nibble must be "1").' }], isError: true };
      return { content: [{ type: 'text', text: JSON.stringify(details, null, 2) }] };
    }),
  );

  server.registerTool(
    'compute_hmac',
    {
      title: 'Compute an HMAC Signature',
      description:
        'Compute an HMAC-SHA1/256/512 signature for a message with a given key, returned as both hex and ' +
        'base64. Use this instead of manually implementing HMAC or guessing a signature — webhook/API ' +
        'signature verification requires the exact correct algorithm and encoding.',
      inputSchema: {
        message: z.string().describe('The message to sign.'),
        key: z.string().describe('The secret key.'),
        algorithm: z.enum(['SHA-1', 'SHA-256', 'SHA-512']).describe('The HMAC hash algorithm.'),
      },
    },
    withApiKeyCheck(async ({ message, key, algorithm }) => {
      const { hex, base64 } = await computeHmac(message, key, algorithm);
      return { content: [{ type: 'text', text: `Hex: ${hex}\nBase64: ${base64}` }] };
    }),
  );

  server.registerTool(
    'bcrypt_hash',
    {
      title: 'Hash a Password with BCrypt',
      description:
        'Hash a plaintext password with BCrypt at a given cost factor. Use this instead of writing your own ' +
        'password hashing, or using a fast general-purpose hash (MD5/SHA) for passwords, which is insecure.',
      inputSchema: {
        password: z.string().min(1).describe('The plaintext password to hash.'),
        rounds: z.number().int().min(4).max(15).optional().describe('BCrypt cost factor. Defaults to 10.'),
      },
    },
    withApiKeyCheck(async ({ password, rounds }) => ({ content: [{ type: 'text', text: bcryptHash(password, rounds ?? 10) }] })),
  );

  server.registerTool(
    'bcrypt_verify',
    {
      title: 'Verify a Password Against a BCrypt Hash',
      description:
        'Check whether a plaintext password matches a BCrypt hash. Use this instead of trying to compare ' +
        'password strings directly — BCrypt hashes are salted, so verification requires the actual BCrypt ' +
        'comparison function, not a string equality check.',
      inputSchema: {
        password: z.string().min(1).describe('The plaintext password to check.'),
        hash: z.string().min(1).describe('The BCrypt hash to verify against (starts with "$2a$", "$2b$", etc.).'),
      },
    },
    withApiKeyCheck(async ({ password, hash }) => ({
      content: [{ type: 'text', text: bcryptVerify(password, hash) ? 'Passwords MATCH.' : 'Passwords DO NOT match.' }],
    })),
  );
}
