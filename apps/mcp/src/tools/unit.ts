import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { withApiKeyCheck } from '../auth.js';
import { convertUnit, UNIT_CATEGORIES } from '../lib/unit-tool.js';

const categoryIds = UNIT_CATEGORIES.map((c) => c.id) as [string, ...string[]];

export function registerUnitTools(server: McpServer): void {
  server.registerTool(
    'convert_unit',
    {
      title: 'Convert Between Units',
      description:
        'Convert a numeric value between units within a category (length, mass, area, volume, temperature, ' +
        'speed, time, digital storage, energy, pressure). Use this instead of manually recalling conversion ' +
        'factors — some (e.g. KiB vs KB, Fahrenheit\'s offset) are easy to misremember.',
      inputSchema: {
        value: z.number().describe('The numeric value to convert.'),
        fromUnit: z.string().describe('Source unit code, e.g. "km", "F", "GB". See list_unit_categories-style values in each category.'),
        toUnit: z.string().describe('Target unit code.'),
        category: z.enum(categoryIds).describe(`Unit category: ${categoryIds.join(', ')}.`),
      },
    },
    withApiKeyCheck(async ({ value, fromUnit, toUnit, category }) => {
      const result = convertUnit(value, fromUnit, toUnit, category);
      return { content: [{ type: 'text', text: String(result) }] };
    }),
  );
}
