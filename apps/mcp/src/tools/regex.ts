import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { withApiKeyCheck } from '../auth.js';

export function registerRegexTools(server: McpServer): void {
  server.registerTool(
    'test_regex',
    {
      title: 'Test a Regular Expression',
      description:
        'Test a regex pattern against a string and return every match with its index and capture groups. ' +
        'Use this instead of mentally tracing regex matching, which is unreliable for anything beyond the ' +
        'simplest patterns — this runs the actual JS regex engine.',
      inputSchema: {
        pattern: z.string().min(1).describe('The regex pattern (without slashes), e.g. "[\\\\w.]+@[\\\\w.]+".'),
        flags: z.string().optional().describe('Regex flags, e.g. "gi". Defaults to "g".'),
        testString: z.string().describe('The string to test the pattern against.'),
      },
    },
    withApiKeyCheck(async ({ pattern, flags, testString }) => {
      const re = new RegExp(pattern, flags ?? 'g');
      const matches: { match: string; index: number; groups?: Record<string, string> }[] = [];
      if (re.global) {
        let m: RegExpExecArray | null;
        let guard = 0;
        while ((m = re.exec(testString)) !== null && guard < 5000) {
          matches.push({ match: m[0], index: m.index, groups: m.groups });
          if (m[0].length === 0) re.lastIndex++;
          guard++;
        }
      } else {
        const m = re.exec(testString);
        if (m) matches.push({ match: m[0], index: m.index, groups: m.groups });
      }
      return { content: [{ type: 'text', text: JSON.stringify({ matchCount: matches.length, matches }, null, 2) }] };
    }),
  );

  server.registerTool(
    'replace_regex',
    {
      title: 'Replace Regex Matches',
      description:
        'Replace all (or the first) regex match in a string with a replacement pattern (supports $1, $2, ' +
        'named groups). Use this instead of manually rewriting the string yourself, which is error-prone ' +
        'when the pattern matches multiple/overlapping/variable-length substrings.',
      inputSchema: {
        pattern: z.string().min(1).describe('The regex pattern (without slashes).'),
        flags: z.string().optional().describe('Regex flags, e.g. "gi". Defaults to "g".'),
        text: z.string().describe('The text to run the replacement on.'),
        replacement: z.string().describe('The replacement string, e.g. "$1-$2" or "[REDACTED]".'),
      },
    },
    withApiKeyCheck(async ({ pattern, flags, text, replacement }) => {
      const re = new RegExp(pattern, flags ?? 'g');
      return { content: [{ type: 'text', text: text.replace(re, replacement) }] };
    }),
  );
}
