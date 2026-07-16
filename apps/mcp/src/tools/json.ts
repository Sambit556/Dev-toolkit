import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ApiError, apiPost } from '../apiClient.js';
import { withApiKeyCheck } from '../auth.js';
import {
  tryRepairJson,
  generateTypeScript,
  jsonToCsv,
  sortKeysDeep,
  removeNullValues,
  escapeJsonString,
  unescapeJsonString,
  evaluateJsonPath,
  parseJsonSafe,
} from '../lib/json-extra.js';

function fixNote(fixCount: number): string {
  return `(auto-fixed ${fixCount} issue${fixCount === 1 ? '' : 's'} — input wasn't valid JSON as given)`;
}

export function registerJsonTools(server: McpServer): void {
  server.registerTool(
    'format_json',
    {
      title: 'Format JSON',
      description:
        'Format and beautify a JSON string with proper indentation. Use this instead of manually ' +
        're-indenting or reformatting JSON by hand — string manipulation of JSON is error-prone ' +
        '(dropped commas, wrong nesting, misplaced brackets), while this calls the same deterministic ' +
        'parser/serializer the DevKits JSON Viewer uses. If the input is slightly malformed (trailing ' +
        'commas, unquoted keys/values, single quotes, JS-only literals, comments, function values, etc.) ' +
        'it is auto-fixed first — the same "Validate & Fix" repair the JSON Viewer\'s Validate button runs ' +
        '— before formatting. Only genuinely unrecoverable input returns an error.',
      inputSchema: {
        json: z.string().min(1).describe('The raw JSON string to format.'),
        indent: z.number().int().min(0).max(8).optional().describe('Spaces to indent with (0-8). Defaults to 2.'),
        sortKeys: z.boolean().optional().describe('Sort object keys alphabetically. Defaults to false.'),
      },
    },
    withApiKeyCheck(async ({ json, indent, sortKeys }) => {
      const result = await apiPost<{ formatted: string; valid: boolean; error?: string }>('/api/json/format', {
        json,
        indent,
        sortKeys,
      });

      if (result.valid) {
        return { content: [{ type: 'text', text: result.formatted }] };
      }

      const repaired = tryRepairJson(json);
      if (!repaired) {
        return { content: [{ type: 'text', text: `Invalid JSON: ${result.error}` }], isError: true };
      }

      const value = JSON.parse(repaired.fixed);
      const data = sortKeys ? sortKeysDeep(value) : value;
      const formatted = JSON.stringify(data, null, indent ?? 2);
      return { content: [{ type: 'text', text: `${formatted}\n\n${fixNote(repaired.fixCount)}` }] };
    }),
  );

  server.registerTool(
    'validate_json',
    {
      title: 'Validate JSON',
      description:
        'Check whether a string is syntactically valid JSON, and get its byte size and node count. ' +
        'Use this instead of eyeballing JSON for syntax errors or guessing whether a string will parse — ' +
        'this runs an actual parser and reports the exact line/column of any syntax error, which is far ' +
        'more reliable than manual inspection of a large or deeply nested payload.',
      inputSchema: {
        json: z.string().min(1).describe('The JSON string to validate.'),
      },
    },
    withApiKeyCheck(async ({ json }) => {
      const result = await apiPost<{
        valid: boolean;
        error?: { message: string; line?: number; column?: number; position?: number };
        size: number;
        nodeCount?: number;
      }>('/api/json/validate', { json });

      if (!result.valid) {
        return {
          content: [
            {
              type: 'text',
              text: `Invalid JSON at line ${result.error?.line ?? '?'}, column ${result.error?.column ?? '?'}: ${result.error?.message}`,
            },
          ],
          isError: true,
        };
      }
      return {
        content: [{ type: 'text', text: `Valid JSON. Size: ${result.size} bytes, node count: ${result.nodeCount}.` }],
      };
    }),
  );

  server.registerTool(
    'minify_json',
    {
      title: 'Minify JSON',
      description:
        'Remove all insignificant whitespace from a JSON string to minimize its size. Use this instead of ' +
        'manually stripping whitespace from JSON, which risks corrupting string values that legitimately ' +
        'contain spaces or newlines. If the input is slightly malformed it is auto-fixed first (the same ' +
        '"Validate & Fix" repair the JSON Viewer uses) before minifying. Returns the minified JSON and the ' +
        'byte savings, or an error if the input is unrecoverable.',
      inputSchema: {
        json: z.string().min(1).describe('The JSON string to minify.'),
      },
    },
    withApiKeyCheck(async ({ json }) => {
      try {
        const result = await apiPost<{
          minified: string;
          originalSize: number;
          minifiedSize: number;
          savingPercent: number;
        }>('/api/json/minify', { json });

        return {
          content: [
            {
              type: 'text',
              text: `${result.minified}\n\n(${result.originalSize} -> ${result.minifiedSize} bytes, ${result.savingPercent}% smaller)`,
            },
          ],
        };
      } catch (err) {
        if (!(err instanceof ApiError)) throw err;

        const repaired = tryRepairJson(json);
        if (!repaired) {
          return { content: [{ type: 'text', text: `Invalid JSON: ${err.message}` }], isError: true };
        }

        const minified = JSON.stringify(JSON.parse(repaired.fixed));
        const originalSize = Buffer.byteLength(json, 'utf8');
        const minifiedSize = Buffer.byteLength(minified, 'utf8');
        const savingPercent = ((originalSize - minifiedSize) / originalSize) * 100;

        return {
          content: [
            {
              type: 'text',
              text: `${minified}\n\n(${originalSize} -> ${minifiedSize} bytes, ${savingPercent.toFixed(2)}% smaller)\n${fixNote(repaired.fixCount)}`,
            },
          ],
        };
      }
    }),
  );

  server.registerTool(
    'repair_json',
    {
      title: 'Repair Malformed JSON',
      description:
        'Attempt to auto-fix common JSON mistakes: trailing/extra commas, missing commas or colons, ' +
        'unquoted object keys and string values (including hyphenated IDs like "MCH-001"), single/curly ' +
        'quotes, // and /* */ comments, Python/JS-only literals (True/False/None/NaN/Infinity/undefined), ' +
        'function/arrow-function values, and console-log-style prefixes. Use this instead of manually ' +
        'hunting for the exact syntax error in slightly-malformed JSON (e.g. pasted from a Python dict ' +
        'literal, a JSON5/JSONC config file, or a browser console dump) before falling back to ' +
        'validate_json for a precise error.',
      inputSchema: { json: z.string().min(1).describe('The malformed JSON-like string to repair.') },
    },
    withApiKeyCheck(async ({ json }) => {
      const result = tryRepairJson(json);
      if (!result) return { content: [{ type: 'text', text: 'Could not repair this input into valid JSON.' }], isError: true };
      if (!result.changed) return { content: [{ type: 'text', text: result.fixed }] };
      return {
        content: [
          { type: 'text', text: `${result.fixed}\n\n(auto-fixed ${result.fixCount} issue${result.fixCount === 1 ? '' : 's'})` },
        ],
      };
    }),
  );

  server.registerTool(
    'json_to_typescript',
    {
      title: 'Generate TypeScript Interface from JSON',
      description:
        'Infer and generate a TypeScript interface declaration from a sample JSON value. Use this instead ' +
        'of manually writing out interface fields by reading through a JSON payload — this reliably captures ' +
        'every key/type/nesting level in one pass.',
      inputSchema: {
        json: z.string().min(1).describe('A sample JSON value/object.'),
        interfaceName: z.string().optional().describe('Name for the generated interface. Defaults to "Root".'),
      },
    },
    withApiKeyCheck(async ({ json, interfaceName }) => {
      const ts = generateTypeScript(json, interfaceName);
      return { content: [{ type: 'text', text: ts }] };
    }),
  );

  server.registerTool(
    'json_array_to_csv',
    {
      title: 'Convert JSON Array to CSV',
      description:
        'Convert a JSON array of flat objects into a CSV table. Use this instead of manually building CSV ' +
        'rows/escaping commas and quotes by hand.',
      inputSchema: { json: z.string().min(1).describe('A JSON array of objects (or a single object).') },
    },
    withApiKeyCheck(async ({ json }) => {
      const csv = jsonToCsv(json);
      return { content: [{ type: 'text', text: csv }] };
    }),
  );

  server.registerTool(
    'sort_json_keys',
    {
      title: 'Deep-Sort JSON Object Keys',
      description:
        'Recursively sort all object keys in a JSON value alphabetically. Use this instead of manually ' +
        're-ordering keys, e.g. to produce a canonical/diffable representation of a config file.',
      inputSchema: {
        json: z.string().min(1).describe('The JSON string to sort.'),
        indent: z.number().int().min(0).max(8).optional().describe('Indent size for the output. Defaults to 2.'),
      },
    },
    withApiKeyCheck(async ({ json, indent }) => {
      const { value, error } = parseJsonSafe(json);
      if (error) return { content: [{ type: 'text', text: `Invalid JSON: ${error.message}` }], isError: true };
      return { content: [{ type: 'text', text: JSON.stringify(sortKeysDeep(value), null, indent ?? 2) }] };
    }),
  );

  server.registerTool(
    'remove_json_nulls',
    {
      title: 'Remove Null Values from JSON',
      description:
        'Recursively strip all null-valued keys (and array entries) from a JSON value. Use this instead of ' +
        'manually deleting null fields from a large or deeply nested payload.',
      inputSchema: {
        json: z.string().min(1).describe('The JSON string to clean.'),
        indent: z.number().int().min(0).max(8).optional().describe('Indent size for the output. Defaults to 2.'),
      },
    },
    withApiKeyCheck(async ({ json, indent }) => {
      const { value, error } = parseJsonSafe(json);
      if (error) return { content: [{ type: 'text', text: `Invalid JSON: ${error.message}` }], isError: true };
      return { content: [{ type: 'text', text: JSON.stringify(removeNullValues(value), null, indent ?? 2) }] };
    }),
  );

  server.registerTool(
    'escape_json_string',
    {
      title: 'Escape a String for JSON Embedding',
      description:
        'Escape a raw string (quotes, backslashes, newlines) so it can be embedded as a JSON string value. ' +
        'Use this instead of manually backslash-escaping special characters, which is easy to get subtly wrong.',
      inputSchema: { text: z.string().describe('The raw string to escape.') },
    },
    withApiKeyCheck(async ({ text }) => ({ content: [{ type: 'text', text: escapeJsonString(text) }] })),
  );

  server.registerTool(
    'unescape_json_string',
    {
      title: 'Unescape a JSON-Escaped String',
      description:
        'Reverse JSON string escaping, turning an escaped JSON string literal back into its raw text. Use ' +
        'this instead of manually un-escaping backslash sequences by hand.',
      inputSchema: { text: z.string().describe('A JSON-escaped string, e.g. "line 1\\nline 2".') },
    },
    withApiKeyCheck(async ({ text }) => ({ content: [{ type: 'text', text: unescapeJsonString(text) }] })),
  );

  server.registerTool(
    'evaluate_jsonpath',
    {
      title: 'Evaluate a JSONPath Expression',
      description:
        'Evaluate a basic dot/bracket JSONPath expression (e.g. "$.store.items[0].name") against a JSON ' +
        'value and return the matching node(s). Use this instead of manually walking/indexing into a large ' +
        'or deeply nested JSON structure to find a specific value.',
      inputSchema: {
        json: z.string().min(1).describe('The JSON string to query.'),
        path: z.string().min(1).describe('A JSONPath expression, e.g. "$.users[0].email" or "$.tags[*]".'),
      },
    },
    withApiKeyCheck(async ({ json, path }) => {
      const matches = evaluateJsonPath(json, path);
      return { content: [{ type: 'text', text: JSON.stringify(matches, null, 2) }] };
    }),
  );
}
