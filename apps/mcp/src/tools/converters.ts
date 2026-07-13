import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { withApiKeyCheck } from '../auth.js';
import { csvToJson, xmlToJson, jsonToXml, markdownToHtml, yamlToJson, jsonToYaml, jsonToIni, iniToJson } from '../lib/converters-extra.js';

export function registerConverterTools(server: McpServer): void {
  server.registerTool(
    'csv_to_json',
    {
      title: 'Convert CSV to JSON',
      description:
        'Parse a CSV/TSV table into a JSON array of objects (auto-detects comma/tab/semicolon delimiter). ' +
        'Use this instead of manually splitting rows/columns by hand, which breaks on quoted fields.',
      inputSchema: { csv: z.string().min(1).describe('The CSV text, first row as header.') },
    },
    withApiKeyCheck(async ({ csv }) => ({ content: [{ type: 'text', text: csvToJson(csv) }] })),
  );

  server.registerTool(
    'xml_to_json',
    {
      title: 'Convert XML to JSON',
      description:
        'Parse an XML document into an equivalent JSON structure (attributes prefixed "@_"). Use this ' +
        'instead of manually walking XML tags to extract structure, which is impractical for nested documents.',
      inputSchema: { xml: z.string().min(1).describe('The XML document text.') },
    },
    withApiKeyCheck(async ({ xml }) => ({ content: [{ type: 'text', text: xmlToJson(xml) }] })),
  );

  server.registerTool(
    'json_to_xml',
    {
      title: 'Convert JSON to XML',
      description:
        'Convert a JSON object into an XML document. Use this instead of manually building XML tags by ' +
        'string concatenation, which is error-prone for nested/attribute-bearing structures.',
      inputSchema: {
        json: z.string().min(1).describe('The JSON string to convert.'),
        rootName: z.string().optional().describe('Root element name to use if the JSON has more than one top-level key. Defaults to "root".'),
      },
    },
    withApiKeyCheck(async ({ json, rootName }) => ({ content: [{ type: 'text', text: jsonToXml(json, rootName) }] })),
  );

  server.registerTool(
    'markdown_to_html',
    {
      title: 'Convert Markdown to HTML',
      description:
        'Render Markdown to HTML using a standard CommonMark-compatible parser. Use this instead of ' +
        'hand-writing the equivalent HTML, especially for lists, code blocks, tables, and links, which are ' +
        'easy to get subtly wrong by hand.',
      inputSchema: { markdown: z.string().describe('The Markdown text to render.') },
    },
    withApiKeyCheck(async ({ markdown }) => ({ content: [{ type: 'text', text: markdownToHtml(markdown) }] })),
  );

  server.registerTool(
    'yaml_to_json',
    {
      title: 'Convert YAML to JSON',
      description:
        'Parse a YAML document into JSON. Use this instead of manually translating YAML indentation/anchors ' +
        'into JSON by hand, which is easy to get wrong for nested structures or multi-line strings.',
      inputSchema: {
        yaml: z.string().min(1).describe('The YAML text to convert.'),
        indent: z.number().int().min(0).max(8).optional().describe('Indent size for the JSON output. Defaults to 2.'),
      },
    },
    withApiKeyCheck(async ({ yaml, indent }) => ({ content: [{ type: 'text', text: yamlToJson(yaml, indent ?? 2) }] })),
  );

  server.registerTool(
    'json_to_yaml',
    {
      title: 'Convert JSON to YAML',
      description:
        'Convert a JSON value into YAML. Use this instead of manually reformatting JSON into YAML syntax ' +
        'by hand, which is easy to get wrong around quoting and indentation rules.',
      inputSchema: {
        json: z.string().min(1).describe('The JSON string to convert.'),
        indent: z.number().int().min(1).max(8).optional().describe('YAML indent size. Defaults to 2.'),
        sortKeys: z.boolean().optional().describe('Sort object keys alphabetically. Defaults to false.'),
      },
    },
    withApiKeyCheck(async ({ json, indent, sortKeys }) => ({ content: [{ type: 'text', text: jsonToYaml(json, indent ?? 2, sortKeys ?? false) }] })),
  );

  server.registerTool(
    'json_to_ini',
    {
      title: 'Convert JSON to INI',
      description:
        'Convert a flat/one-level-nested JSON object into INI config format (nested objects become ' +
        '[section] blocks). Use this instead of manually formatting key=value pairs and section headers by hand.',
      inputSchema: { json: z.string().min(1).describe('The JSON object to convert.') },
    },
    withApiKeyCheck(async ({ json }) => ({ content: [{ type: 'text', text: jsonToIni(json) }] })),
  );

  server.registerTool(
    'ini_to_json',
    {
      title: 'Convert INI to JSON',
      description:
        'Parse an INI config file into a JSON object ([section] blocks become nested objects). Use this ' +
        'instead of manually parsing key=value lines and section headers by hand.',
      inputSchema: { ini: z.string().min(1).describe('The INI text to convert.') },
    },
    withApiKeyCheck(async ({ ini }) => ({ content: [{ type: 'text', text: iniToJson(ini) }] })),
  );
}
