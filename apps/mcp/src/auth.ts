import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { checkApiKey, config } from './config.js';

type AnyToolCallback = (args: any, extra: any) => Promise<CallToolResult> | CallToolResult;

/**
 * Wraps a tool callback so every call passes through the API key gate first,
 * and any error thrown while calling the DevKits API is turned into a clean
 * `isError` result instead of crashing the MCP server process.
 */
export function withApiKeyCheck(handler: AnyToolCallback): AnyToolCallback {
  return async (args, extra) => {
    const allowed = await checkApiKey(config.apiKey);
    if (!allowed) {
      return {
        content: [{ type: 'text', text: 'API key check failed — this tool call was rejected.' }],
        isError: true,
      };
    }

    try {
      return await handler(args, extra);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        content: [{ type: 'text', text: `Request to DevKits API failed: ${message}` }],
        isError: true,
      };
    }
  };
}
