import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { withApiKeyCheck } from '../auth.js';
import { convertCurrency, getExchangeRates } from '../lib/currency-tools.js';

export function registerCurrencyTools(server: McpServer): void {
  server.registerTool(
    'convert_currency',
    {
      title: 'Convert Currency',
      description:
        'Convert an amount from one currency to another using live exchange rates (falls back to static ' +
        'offline rates if the live rate API is unreachable). Use this instead of guessing exchange rates, ' +
        'which fluctuate daily and are impossible to know precisely from training data.',
      inputSchema: {
        amount: z.number().describe('The amount to convert.'),
        fromCurrency: z.string().length(3).describe('3-letter source currency code, e.g. "USD".'),
        toCurrency: z.string().length(3).describe('3-letter target currency code, e.g. "EUR".'),
      },
    },
    withApiKeyCheck(async ({ amount, fromCurrency, toCurrency }) => {
      const result = await convertCurrency(amount, fromCurrency, toCurrency);
      return {
        content: [{
          type: 'text',
          text: `${result.amount} ${result.fromCurrency} = ${result.convertedAmount.toFixed(4)} ${result.toCurrency} (rate: ${result.rate}, source: ${result.source})`,
        }],
      };
    }),
  );

  server.registerTool(
    'get_exchange_rates',
    {
      title: 'Get Exchange Rates for a Base Currency',
      description:
        'Fetch current exchange rates for a base currency against ~30 other currencies (falls back to ' +
        'static offline rates if the live API is unreachable). Use this instead of guessing rates, or when ' +
        'you need the full rate table rather than a single conversion.',
      inputSchema: { baseCurrency: z.string().length(3).describe('3-letter base currency code, e.g. "USD".') },
    },
    withApiKeyCheck(async ({ baseCurrency }) => {
      const { rates, source } = await getExchangeRates(baseCurrency);
      return { content: [{ type: 'text', text: `Source: ${source}\n${JSON.stringify(rates, null, 2)}` }] };
    }),
  );
}
