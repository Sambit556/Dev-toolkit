import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { withApiKeyCheck } from '../auth.js';
import { computeTextDiff } from '../lib/diff-tool.js';

export function registerDiffTools(server: McpServer): void {
  server.registerTool(
    'compute_text_diff',
    {
      title: 'Compute a Text Diff',
      description:
        'Compute a structural diff between two texts (line, word, or character granularity), marking added ' +
        'and removed segments. Use this instead of manually eyeballing two texts for differences, which is ' +
        'unreliable beyond a few lines and easy to miss whitespace-only or subtle changes.',
      inputSchema: {
        original: z.string().describe('The original/left-hand text.'),
        modified: z.string().describe('The modified/right-hand text.'),
        granularity: z.enum(['line', 'word', 'char']).optional().describe('Diff granularity. Defaults to "line".'),
      },
    },
    withApiKeyCheck(async ({ original, modified, granularity }) => {
      const parts = computeTextDiff(original, modified, granularity ?? 'line');
      const rendered = parts.map((p) => {
        const prefix = p.added ? '+ ' : p.removed ? '- ' : '  ';
        return p.value.split('\n').filter((_, i, arr) => i < arr.length - 1 || arr.length === 1).map((line) => `${prefix}${line}`).join('\n');
      }).join('\n');
      return { content: [{ type: 'text', text: rendered }] };
    }),
  );
}
