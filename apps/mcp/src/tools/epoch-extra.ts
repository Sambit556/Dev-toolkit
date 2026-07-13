import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { withApiKeyCheck } from '../auth.js';
import {
  getPeriodBoundaries,
  convertDuration,
  addSubtractDurations,
  parseDurationString,
  listTimezones,
  getEpochCodeExample,
} from '../lib/epoch-extra.js';

const durationUnitEnum = z.enum(['hhmmss', 'ms', 'sec', 'min', 'hour', 'day']);

export function registerEpochExtraTools(server: McpServer): void {
  server.registerTool(
    'calculate_period_boundaries',
    {
      title: 'Get Start/End of Day, Month, or Year',
      description:
        'Compute the exact Unix-second and ISO boundaries (start and end) of a day/month/year for a given ' +
        'date and IANA timezone. Use this instead of manually working out month-length, leap-year, or ' +
        'timezone-offset edge cases by hand — those are easy to get wrong for calendar boundary math.',
      inputSchema: {
        date: z.string().describe('Any parseable date string, e.g. "2024-03-15".'),
        period: z.enum(['day', 'month', 'year']).describe('Which period boundary to compute.'),
        timezone: z.string().optional().describe('IANA timezone name. Defaults to UTC.'),
      },
    },
    withApiKeyCheck(async ({ date, period, timezone }) => {
      const result = getPeriodBoundaries(date, period, timezone ?? 'UTC');
      return {
        content: [
          {
            type: 'text',
            text: `Start: ${result.startIso} (unix ${result.startUnixSeconds})\nEnd: ${result.endIso} (unix ${result.endUnixSeconds})`,
          },
        ],
      };
    }),
  );

  server.registerTool(
    'convert_duration',
    {
      title: 'Convert Duration Between Units',
      description:
        'Convert a duration between an "HH:MM:SS:mmm" string and a single unit (ms/sec/min/hour/day), in ' +
        'either direction. Use this instead of manually multiplying/dividing by 60/3600/86400 and handling ' +
        'carries by hand.',
      inputSchema: {
        value: z.string().describe('The duration value: either "HH:MM:SS[:mmm]" (if fromUnit is "hhmmss") or a plain number string.'),
        fromUnit: durationUnitEnum.describe('Unit of the input value.'),
        toUnit: durationUnitEnum.describe('Unit to convert to.'),
      },
    },
    withApiKeyCheck(async ({ value, fromUnit, toUnit }) => {
      const result = convertDuration(value, fromUnit, toUnit);
      return { content: [{ type: 'text', text: result }] };
    }),
  );

  server.registerTool(
    'add_subtract_durations',
    {
      title: 'Add or Subtract Durations',
      description:
        'Combine multiple "HH:MM:SS:mmm" durations with add/subtract operations into one result duration. ' +
        'Use this instead of manually converting each duration to seconds, summing, and converting back — ' +
        'easy to make an off-by-one-unit mistake doing that by hand.',
      inputSchema: {
        durations: z.array(z.string()).min(1).describe('Durations as "HH:MM:SS" or "HH:MM:SS:mmm" strings, e.g. ["01:30:00", "00:45:00"].'),
        operations: z.array(z.enum(['add', 'sub'])).describe('Operation applied between each consecutive pair (length = durations.length - 1).'),
      },
    },
    withApiKeyCheck(async ({ durations, operations }: { durations: string[]; operations: ('add' | 'sub')[] }) => {
      const ms = durations.map((d: string) => {
        const parsed = parseDurationString(d);
        if (parsed === null) throw new Error(`Invalid duration string: "${d}"`);
        return parsed;
      });
      const result = addSubtractDurations(ms, operations);
      return { content: [{ type: 'text', text: result }] };
    }),
  );

  server.registerTool(
    'list_timezones',
    {
      title: 'List IANA Timezones',
      description:
        'List (optionally filtered by substring) all valid IANA timezone names, e.g. "America/New_York". ' +
        'Use this instead of guessing whether a timezone string is spelled/formatted correctly before ' +
        'passing it to convert_epoch or calculate_period_boundaries.',
      inputSchema: { search: z.string().optional().describe('Optional substring filter, e.g. "London" or "America".') },
    },
    withApiKeyCheck(async ({ search }) => {
      const zones = listTimezones(search);
      return { content: [{ type: 'text', text: zones.length > 0 ? zones.join('\n') : 'No matching timezones found.' }] };
    }),
  );

  server.registerTool(
    'get_epoch_code_example',
    {
      title: 'Get Epoch Conversion Code Snippet',
      description:
        'Generate a ready-to-use code snippet (JavaScript, Python, Java, Go, PostgreSQL, MySQL, or shell) ' +
        'that converts a given Unix timestamp to a date in that language. Use this instead of writing the ' +
        'timestamp-parsing boilerplate from memory, which varies subtly by language/library.',
      inputSchema: {
        language: z.enum(['javascript', 'python', 'java', 'go', 'postgresql', 'mysql', 'linux']).describe('Target language/environment.'),
        unixSeconds: z.number().int().describe('The Unix timestamp in seconds to embed in the snippet.'),
      },
    },
    withApiKeyCheck(async ({ language, unixSeconds }) => ({ content: [{ type: 'text', text: getEpochCodeExample(language, unixSeconds) }] })),
  );
}
