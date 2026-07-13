import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { withApiKeyCheck } from '../auth.js';
import { lookupIpGeolocation, validateEmailOrPhone, parseUrl } from '../lib/ip-tools.js';

export function registerIpTools(server: McpServer): void {
  server.registerTool(
    'lookup_ip_geolocation',
    {
      title: 'Look Up IP Geolocation',
      description:
        'Look up geolocation, ISP, and ASN information for an arbitrary IP address. Use this instead of ' +
        'guessing where an IP is located — geo-IP mapping requires querying an actual IP database.',
      inputSchema: { ip: z.string().min(1).describe('The IPv4 or IPv6 address to look up, e.g. "8.8.8.8".') },
    },
    withApiKeyCheck(async ({ ip }) => ({ content: [{ type: 'text', text: JSON.stringify(await lookupIpGeolocation(ip), null, 2) }] })),
  );

  server.registerTool(
    'validate_email_or_phone',
    {
      title: 'Validate an Email or Phone Number',
      description:
        'Validate an email address (syntax + disposable-domain check) or a phone number (E.164 format + ' +
        'country dial-code match). Use this instead of eyeballing whether an email/phone "looks right" — ' +
        'this applies the actual format rules and a disposable-domain blocklist.',
      inputSchema: { input: z.string().min(1).describe('An email address or a phone number (with country code, e.g. "+14155552671").') },
    },
    withApiKeyCheck(async ({ input }) => ({ content: [{ type: 'text', text: JSON.stringify(validateEmailOrPhone(input), null, 2) }] })),
  );

  server.registerTool(
    'parse_url',
    {
      title: 'Parse a URL',
      description:
        'Parse a URL into its protocol, hostname, port, path, hash, and query parameters. Use this instead ' +
        'of manually splitting a URL string with regex, which breaks on edge cases (encoded characters, ' +
        'repeated query keys, IPv6 hosts, etc.) that the native URL parser handles correctly.',
      inputSchema: { url: z.string().min(1).describe('A fully-qualified URL, e.g. "https://example.com:8080/path?a=1&b=2#section".') },
    },
    withApiKeyCheck(async ({ url }) => ({ content: [{ type: 'text', text: JSON.stringify(parseUrl(url), null, 2) }] })),
  );
}
