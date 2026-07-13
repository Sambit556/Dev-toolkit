import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { withApiKeyCheck } from '../auth.js';
import { convertColorFormat, getColorHarmonies, checkContrastRatio, generateRandomPalette } from '../lib/color-tools.js';

export function registerColorTools(server: McpServer): void {
  server.registerTool(
    'convert_color_format',
    {
      title: 'Convert Color Between Formats',
      description:
        'Convert a hex color into RGB, HSL, HSV, and CMYK representations. Use this instead of manually ' +
        'computing color-space math, which involves non-obvious formulas (e.g. HSL/HSV hue derivation).',
      inputSchema: { hex: z.string().min(3).describe('A hex color, e.g. "#3B82F6" or "3B82F6".') },
    },
    withApiKeyCheck(async ({ hex }) => ({ content: [{ type: 'text', text: JSON.stringify(convertColorFormat(hex), null, 2) }] })),
  );

  server.registerTool(
    'generate_color_harmony',
    {
      title: 'Generate Color Harmonies',
      description:
        'Generate complementary, analogous, triadic, split-complementary, and monochromatic color sets from ' +
        'a base hex color. Use this instead of guessing "nice-looking" colors — real harmonies require hue ' +
        'rotation math on the HSL color wheel.',
      inputSchema: { hex: z.string().min(3).describe('The base hex color, e.g. "#3B82F6".') },
    },
    withApiKeyCheck(async ({ hex }) => ({ content: [{ type: 'text', text: JSON.stringify(getColorHarmonies(hex), null, 2) }] })),
  );

  server.registerTool(
    'check_contrast_ratio',
    {
      title: 'Check WCAG Color Contrast Ratio',
      description:
        'Compute the WCAG contrast ratio between a foreground and background color, and whether it passes ' +
        'AA/AAA thresholds. Use this instead of eyeballing whether two colors are "readable enough" — WCAG ' +
        'compliance requires the precise relative-luminance formula, not visual judgment.',
      inputSchema: {
        foreground: z.string().min(3).describe('Foreground (text) hex color.'),
        background: z.string().min(3).describe('Background hex color.'),
      },
    },
    withApiKeyCheck(async ({ foreground, background }) => ({ content: [{ type: 'text', text: JSON.stringify(checkContrastRatio(foreground, background), null, 2) }] })),
  );

  server.registerTool(
    'generate_random_palette',
    {
      title: 'Generate a Random Color Palette',
      description:
        'Generate N cryptographically random hex colors. Use this instead of making up hex codes, which ' +
        'tend to cluster in predictable ranges rather than being truly random.',
      inputSchema: { count: z.number().int().min(1).max(20).optional().describe('Number of colors to generate. Defaults to 5.') },
    },
    withApiKeyCheck(async ({ count }) => ({ content: [{ type: 'text', text: generateRandomPalette(count ?? 5).join('\n') }] })),
  );
}
