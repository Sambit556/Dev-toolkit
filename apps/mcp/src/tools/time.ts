import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiGet, apiPost } from '../apiClient.js';
import { withApiKeyCheck } from '../auth.js';

export function registerTimeTools(server: McpServer): void {
  server.registerTool(
    'convert_epoch',
    {
      title: 'Convert Epoch Timestamp',
      description:
        'Convert a Unix timestamp (in seconds, milliseconds, or nanoseconds) into UTC and a given IANA ' +
        'timezone, in multiple formats (ISO 8601, RFC 2822, localized string). Use this instead of computing ' +
        'epoch/date conversions by hand or mentally — timezone offsets and unit mixups (seconds vs. ' +
        'milliseconds vs. nanoseconds) are easy to get wrong, and this calls the exact same conversion logic ' +
        'as the DevKits Epoch Converter.',
      inputSchema: {
        timestamp: z
          .string()
          .regex(/^-?\d+$/, 'Must be a numeric string')
          .describe('The Unix timestamp as a numeric string, e.g. "1700000000".'),
        unit: z
          .enum(['seconds', 'milliseconds', 'nanoseconds'])
          .optional()
          .describe('Unit of the timestamp. Auto-detected from magnitude if omitted.'),
        timezone: z.string().optional().describe('IANA timezone name, e.g. "America/New_York". Defaults to UTC.'),
      },
    },
    withApiKeyCheck(async ({ timestamp, unit, timezone }) => {
      const result = await apiPost<{
        utc: string;
        local: string;
        iso8601: string;
        rfc2822: string;
        timezone: string;
        unixSeconds: number;
        unixMs: number;
        isNegative: boolean;
      }>('/api/time/convert', { timestamp, unit, timezone });

      return {
        content: [
          {
            type: 'text',
            text:
              `UTC: ${result.utc}\n` +
              `Local (${result.timezone}): ${result.local}\n` +
              `ISO 8601: ${result.iso8601}\n` +
              `RFC 2822: ${result.rfc2822}\n` +
              `Unix seconds: ${result.unixSeconds}\n` +
              `Unix ms: ${result.unixMs}`,
          },
        ],
      };
    }),
  );

  server.registerTool(
    'current_time',
    {
      title: 'Get Current Time',
      description:
        'Get the current real-world Unix timestamp (seconds, milliseconds, and nanoseconds) plus ' +
        'UTC/ISO 8601/RFC 2822 formatted strings. Use this instead of assuming, estimating, or guessing ' +
        "the current date/time — a language model has no reliable internal clock and can be off by however " +
        'long it has been since its training or context cutoff; this returns the actual wall-clock time ' +
        'from the server.',
      inputSchema: {},
    },
    withApiKeyCheck(async () => {
      const result = await apiGet<{
        unixSeconds: number;
        unixMs: number;
        unixNanos: string;
        utc: string;
        iso8601: string;
        rfc2822: string;
      }>('/api/time/current');

      return {
        content: [
          {
            type: 'text',
            text:
              `Unix seconds: ${result.unixSeconds}\n` +
              `Unix ms: ${result.unixMs}\n` +
              `Unix nanos: ${result.unixNanos}\n` +
              `UTC: ${result.utc}\n` +
              `ISO 8601: ${result.iso8601}\n` +
              `RFC 2822: ${result.rfc2822}`,
          },
        ],
      };
    }),
  );
}
