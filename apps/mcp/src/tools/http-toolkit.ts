import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiGet, apiPost, apiDelete } from '../apiClient.js';
import { withApiKeyCheck } from '../auth.js';
import { lookupHttpStatusCode, searchHttpStatusCodes, HTTP_STATUS_CODES } from '../lib/http-status-codes.js';

export function registerHttpToolkitTools(server: McpServer): void {
  server.registerTool(
    'lookup_http_status_code',
    {
      title: 'Look Up an HTTP Status Code',
      description:
        'Look up the meaning of an HTTP status code, or search by keyword (e.g. "redirect", "not found"). ' +
        'Use this instead of recalling status code meanings from memory, which is easy to mix up for the ' +
        'less common codes (e.g. 422 vs 400, 307 vs 302).',
      inputSchema: {
        code: z.number().int().optional().describe('An exact status code, e.g. 404.'),
        search: z.string().optional().describe('A keyword to search for instead of an exact code.'),
      },
    },
    withApiKeyCheck(async ({ code, search }) => {
      if (code !== undefined) {
        const result = lookupHttpStatusCode(code);
        if (!result) return { content: [{ type: 'text', text: `${code} is not a standard HTTP status code.` }], isError: true };
        return { content: [{ type: 'text', text: `${result.code} ${result.phrase} (${result.category}): ${result.description}` }] };
      }
      const results = search ? searchHttpStatusCodes(search) : HTTP_STATUS_CODES;
      return { content: [{ type: 'text', text: results.map((r) => `${r.code} ${r.phrase}: ${r.description}`).join('\n') }] };
    }),
  );

  server.registerTool(
    'inspect_http_headers',
    {
      title: 'Inspect a URL\'s HTTP Response Headers',
      description:
        'Fetch a URL server-side and return its status code, response headers, and timing. Use this instead ' +
        'of guessing what headers a server returns, or trying to fetch it yourself (which would be blocked ' +
        'by CORS in a browser context) — this proxies the request through the DevKits API, which also ' +
        'blocks requests to private/internal addresses for safety.',
      inputSchema: { url: z.string().url().describe('The URL to inspect, e.g. "https://example.com".') },
    },
    withApiKeyCheck(async ({ url }) => {
      const result = await apiPost<{ status: number; statusText: string; headers: Record<string, string>; finalUrl: string; redirected: boolean; timingMs: number }>('/api/http-inspect', { url });
      const headerLines = Object.entries(result.headers).map(([k, v]) => `${k}: ${v}`).join('\n');
      return {
        content: [{
          type: 'text',
          text: `${result.status} ${result.statusText} (${result.timingMs}ms)${result.redirected ? `\nRedirected to: ${result.finalUrl}` : ''}\n\n${headerLines}`,
        }],
      };
    }),
  );

  server.registerTool(
    'create_webhook',
    {
      title: 'Create a Webhook Capture URL',
      description:
        'Create a real, live URL that can receive HTTP requests from any external service (e.g. a webhook ' +
        'provider), which can then be inspected with list_webhook_requests. Use this instead of guessing ' +
        'what a webhook payload will look like — this lets you actually capture and inspect a real one.',
      inputSchema: {},
    },
    withApiKeyCheck(async () => {
      const { id } = await apiPost<{ id: string }>('/api/webhook/create', {});
      return { content: [{ type: 'text', text: id }] };
    }),
  );

  server.registerTool(
    'list_webhook_requests',
    {
      title: 'List Captured Webhook Requests',
      description:
        'List the HTTP requests captured so far for a webhook id created with create_webhook. Use this to ' +
        'check whether an external service has actually sent the webhook request you were expecting, and to ' +
        'inspect its exact headers/body.',
      inputSchema: { webhookId: z.string().min(1).describe('The id returned by create_webhook.') },
    },
    withApiKeyCheck(async ({ webhookId }) => {
      const result = await apiGet<{ requests: unknown[] }>(`/api/webhook/${encodeURIComponent(webhookId)}/requests`);
      return { content: [{ type: 'text', text: JSON.stringify(result.requests, null, 2) }] };
    }),
  );

  server.registerTool(
    'clear_webhook_requests',
    {
      title: 'Clear Captured Webhook Requests',
      description:
        'Clear all captured requests for a webhook id (the capture URL keeps working, only the log is cleared). ' +
        'Use this to reset before triggering a new test webhook delivery.',
      inputSchema: { webhookId: z.string().min(1).describe('The id returned by create_webhook.') },
    },
    withApiKeyCheck(async ({ webhookId }) => {
      await apiDelete(`/api/webhook/${encodeURIComponent(webhookId)}`);
      return { content: [{ type: 'text', text: 'Cleared.' }] };
    }),
  );
}
