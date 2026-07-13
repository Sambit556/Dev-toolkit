#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpServer } from './server.js';

async function main() {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // stdout is the JSON-RPC channel for the stdio transport — log to stderr only.
  console.error('DevKits MCP server running on stdio');
}

main().catch((err) => {
  console.error('Fatal error starting DevKits MCP server:', err);
  process.exit(1);
});
