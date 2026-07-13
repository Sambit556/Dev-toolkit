import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerJsonTools } from './tools/json.js';
import { registerTimeTools } from './tools/time.js';
import { registerEpochExtraTools } from './tools/epoch-extra.js';
import { registerJwtTools } from './tools/jwt.js';
import { registerSecurityTools } from './tools/security.js';
import { registerTextTools } from './tools/text.js';
import { registerRegexTools } from './tools/regex.js';
import { registerSqlGraphqlTools } from './tools/sql-graphql.js';
import { registerConverterTools } from './tools/converters.js';
import { registerCalculatorTools } from './tools/calculators.js';
import { registerColorTools } from './tools/color.js';
import { registerUnitTools } from './tools/unit.js';
import { registerCronTools } from './tools/cron.js';
import { registerCurrencyTools } from './tools/currency.js';
import { registerMiscGeneratorTools } from './tools/misc-generators.js';
import { registerPdfTools } from './tools/pdf.js';
import { registerQrTools } from './tools/qr.js';
import { registerIpTools } from './tools/ip.js';
import { registerDiffTools } from './tools/diff.js';
import { registerHttpToolkitTools } from './tools/http-toolkit.js';

/**
 * Builds and configures the DevKits MCP server, independent of transport.
 * `index.ts` attaches a StdioServerTransport today; swapping to
 * StreamableHTTPServerTransport later only means constructing a different
 * transport and calling `server.connect(transport)` — nothing here changes.
 */
export function createMcpServer(): McpServer {
  const server = new McpServer(
    {
      name: 'devkits-mcp',
      version: '1.0.0',
    },
    {
      capabilities: { tools: {} },
    },
  );

  registerJsonTools(server);
  registerTimeTools(server);
  registerEpochExtraTools(server);
  registerJwtTools(server);
  registerSecurityTools(server);
  registerTextTools(server);
  registerRegexTools(server);
  registerSqlGraphqlTools(server);
  registerConverterTools(server);
  registerCalculatorTools(server);
  registerColorTools(server);
  registerUnitTools(server);
  registerCronTools(server);
  registerCurrencyTools(server);
  registerMiscGeneratorTools(server);
  registerPdfTools(server);
  registerQrTools(server);
  registerIpTools(server);
  registerDiffTools(server);
  registerHttpToolkitTools(server);

  return server;
}
