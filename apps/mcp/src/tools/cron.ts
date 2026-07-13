import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { withApiKeyCheck } from '../auth.js';
import { cronToHumanReadable, cronNextExecutions, buildCronExpression } from '../lib/cron-tools.js';

const cronFieldSpec = z.union([
  z.object({ type: z.literal('every') }),
  z.object({ type: z.literal('interval'), start: z.number().int(), interval: z.number().int() }),
  z.object({ type: z.literal('specific'), values: z.array(z.number().int()) }),
]);
const simpleFieldSpec = z.union([
  z.object({ type: z.literal('every') }),
  z.object({ type: z.literal('specific'), values: z.array(z.number().int()) }),
]);

export function registerCronTools(server: McpServer): void {
  server.registerTool(
    'cron_to_human_readable',
    {
      title: 'Explain a Cron Expression',
      description:
        'Translate a 5-field cron expression into a plain-English sentence. Use this instead of manually ' +
        'parsing cron syntax field-by-field, which is easy to misread (e.g. day-of-month vs day-of-week order).',
      inputSchema: { expression: z.string().min(1).describe('A cron expression, e.g. "*/5 * * * *".') },
    },
    withApiKeyCheck(async ({ expression }) => ({ content: [{ type: 'text', text: cronToHumanReadable(expression) }] })),
  );

  server.registerTool(
    'cron_next_executions',
    {
      title: 'Get Next Cron Execution Times',
      description:
        'Compute the next N execution timestamps for a cron expression. Use this instead of manually ' +
        'projecting forward through a cron schedule, which is impractical to do reliably by hand.',
      inputSchema: {
        expression: z.string().min(1).describe('A cron expression, e.g. "0 9 * * 1-5".'),
        count: z.number().int().min(1).max(50).optional().describe('How many upcoming executions to return. Defaults to 5.'),
      },
    },
    withApiKeyCheck(async ({ expression, count }) => ({ content: [{ type: 'text', text: cronNextExecutions(expression, count ?? 5).join('\n') }] })),
  );

  server.registerTool(
    'build_cron_expression',
    {
      title: 'Build a Cron Expression from Field Specs',
      description:
        'Compile structured minute/hour/day/month/weekday specifications into a valid cron expression ' +
        'string. Use this instead of hand-assembling cron syntax (comma lists, step values, wildcards), ' +
        'which has several easy-to-mix-up conventions.',
      inputSchema: {
        minute: cronFieldSpec.optional().describe('Minute field spec. Defaults to "every".'),
        hour: cronFieldSpec.optional().describe('Hour field spec. Defaults to "every".'),
        dayOfMonth: simpleFieldSpec.optional().describe('Day-of-month field spec. Defaults to "every".'),
        month: simpleFieldSpec.optional().describe('Month field spec (1-12). Defaults to "every".'),
        dayOfWeek: simpleFieldSpec.optional().describe('Day-of-week field spec (0=Sun-6=Sat). Defaults to "every".'),
      },
    },
    withApiKeyCheck(async (spec) => ({ content: [{ type: 'text', text: buildCronExpression(spec) }] })),
  );
}
