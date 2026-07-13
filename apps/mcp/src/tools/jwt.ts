import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { withApiKeyCheck } from '../auth.js';
import { decodeJwt, verifyJwtSignature, signJwt } from '../lib/jwt.js';

export function registerJwtTools(server: McpServer): void {
  server.registerTool(
    'decode_jwt',
    {
      title: 'Decode a JWT',
      description:
        'Decode a JSON Web Token\'s header and payload (without verifying the signature). Use this instead ' +
        'of manually base64url-decoding the two dot-separated segments by hand.',
      inputSchema: { token: z.string().min(1).describe('The JWT string, e.g. "eyJhbGc...".') },
    },
    withApiKeyCheck(async ({ token }) => {
      const decoded = decodeJwt(token);
      if (!decoded) return { content: [{ type: 'text', text: 'Not a valid JWT (expected 3 dot-separated base64url segments).' }], isError: true };
      return { content: [{ type: 'text', text: JSON.stringify({ header: decoded.header, payload: decoded.payload }, null, 2) }] };
    }),
  );

  server.registerTool(
    'verify_jwt',
    {
      title: 'Verify a JWT Signature',
      description:
        'Cryptographically verify a JWT\'s signature (HS256/384/512 with a shared secret, or RS256 with a ' +
        'PEM public key). Use this instead of assuming a token is valid just because it decodes — decoding ' +
        'never checks the signature, so this is the only way to know a token was actually issued by the holder of the key.',
      inputSchema: {
        token: z.string().min(1).describe('The JWT string to verify.'),
        secretOrPublicKey: z.string().min(1).describe('The HMAC shared secret, or an RSA public key in "-----BEGIN PUBLIC KEY-----" PEM format.'),
        algorithm: z.enum(['HS256', 'HS384', 'HS512', 'RS256']).describe('The signing algorithm to verify against.'),
      },
    },
    withApiKeyCheck(async ({ token, secretOrPublicKey, algorithm }) => {
      const valid = await verifyJwtSignature(token, secretOrPublicKey, algorithm);
      return { content: [{ type: 'text', text: valid ? 'Signature is VALID.' : 'Signature is INVALID.' }] };
    }),
  );

  server.registerTool(
    'sign_jwt',
    {
      title: 'Sign / Encode a JWT',
      description:
        'Create a signed JWT from a header and payload object (HS256/384/512 with a shared secret, or ' +
        'RS256 with a PKCS8 private key). Use this instead of hand-assembling base64url segments and ' +
        'computing the signature yourself, which is error-prone and a common source of "invalid signature" bugs.',
      inputSchema: {
        header: z.record(z.unknown()).describe('The JWT header object, e.g. { "alg": "HS256", "typ": "JWT" }.'),
        payload: z.record(z.unknown()).describe('The JWT payload/claims object.'),
        secretOrPrivateKey: z.string().min(1).describe('The HMAC shared secret, or an RSA private key in "-----BEGIN PRIVATE KEY-----" PKCS8 PEM format.'),
      },
    },
    withApiKeyCheck(async ({ header, payload, secretOrPrivateKey }) => {
      const token = await signJwt(header, payload, secretOrPrivateKey);
      return { content: [{ type: 'text', text: token }] };
    }),
  );
}
