import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { withApiKeyCheck } from '../auth.js';
import { format, type SqlLanguage } from 'sql-formatter';
import { parse, print, buildSchema, validate, stripIgnoredCharacters } from 'graphql';

const sqlDialect = z.enum(['sql', 'mysql', 'mariadb', 'postgresql', 'sqlite', 'tsql', 'plsql', 'bigquery', 'redshift', 'spark']);

export function registerSqlGraphqlTools(server: McpServer): void {
  server.registerTool(
    'format_sql',
    {
      title: 'Format / Beautify SQL',
      description:
        'Beautify a SQL query with proper indentation for a given dialect (MySQL, PostgreSQL, SQLite, ' +
        'T-SQL, PL/SQL, BigQuery, etc.). Use this instead of manually re-indenting SQL, which is tedious ' +
        'and easy to get inconsistent for nested subqueries/joins.',
      inputSchema: {
        sql: z.string().min(1).describe('The SQL query to format.'),
        dialect: sqlDialect.optional().describe('SQL dialect. Defaults to "sql" (standard).'),
        keywordCase: z.enum(['upper', 'lower', 'preserve']).optional().describe('Case for SQL keywords. Defaults to "upper".'),
      },
    },
    withApiKeyCheck(async ({ sql, dialect, keywordCase }) => ({
      content: [{ type: 'text', text: format(sql, { language: (dialect ?? 'sql') as SqlLanguage, keywordCase: keywordCase ?? 'upper' }) }],
    })),
  );

  server.registerTool(
    'minify_sql',
    {
      title: 'Minify SQL',
      description:
        'Collapse a SQL query onto a single line with minimal whitespace. Use this instead of manually ' +
        'stripping newlines/indentation from a formatted query.',
      inputSchema: {
        sql: z.string().min(1).describe('The SQL query to minify.'),
        dialect: sqlDialect.optional().describe('SQL dialect. Defaults to "sql".'),
      },
    },
    withApiKeyCheck(async ({ sql, dialect }) => {
      const formatted = format(sql, { language: (dialect ?? 'sql') as SqlLanguage, linesBetweenQueries: 0 });
      return { content: [{ type: 'text', text: formatted.replace(/\s+/g, ' ').trim() }] };
    }),
  );

  server.registerTool(
    'format_graphql',
    {
      title: 'Format / Pretty-Print GraphQL',
      description:
        'Pretty-print a GraphQL query, mutation, or SDL schema document. Use this instead of manually ' +
        're-indenting GraphQL, and note it also validates syntax as a side effect (throws on malformed input).',
      inputSchema: { document: z.string().min(1).describe('The GraphQL query/mutation/schema text.') },
    },
    withApiKeyCheck(async ({ document }) => ({ content: [{ type: 'text', text: print(parse(document)) }] })),
  );

  server.registerTool(
    'minify_graphql',
    {
      title: 'Minify GraphQL',
      description:
        'Strip whitespace and comments from a GraphQL document down to a compact single-purpose form. Use ' +
        'this instead of manually removing whitespace/comments from a GraphQL query by hand.',
      inputSchema: { document: z.string().min(1).describe('The GraphQL query/mutation/schema text.') },
    },
    withApiKeyCheck(async ({ document }) => ({ content: [{ type: 'text', text: stripIgnoredCharacters(document) }] })),
  );

  server.registerTool(
    'validate_graphql_schema',
    {
      title: 'Validate a GraphQL Query Against a Schema',
      description:
        'Validate a GraphQL query/mutation against an SDL schema and report semantic errors (unknown ' +
        'fields, type mismatches, etc.). Use this instead of just checking syntax — a query can be ' +
        'syntactically valid GraphQL yet reference fields that do not exist on the schema.',
      inputSchema: {
        query: z.string().min(1).describe('The GraphQL query/mutation document to validate.'),
        schema: z.string().min(1).describe('The SDL schema text to validate against.'),
      },
    },
    withApiKeyCheck(async ({ query, schema }) => {
      const builtSchema = buildSchema(schema);
      const doc = parse(query);
      const errors = validate(builtSchema, doc);
      if (errors.length === 0) return { content: [{ type: 'text', text: 'Valid — no schema errors found.' }] };
      const messages = errors.map((e) => {
        const loc = e.locations?.[0];
        return loc ? `Line ${loc.line}, Column ${loc.column}: ${e.message}` : e.message;
      });
      return { content: [{ type: 'text', text: messages.join('\n') }], isError: true };
    }),
  );
}
