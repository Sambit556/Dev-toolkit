import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { withApiKeyCheck } from '../auth.js';
import {
  generateLoremIpsum,
  generateFakePersona,
  generateBulkFakePersonas,
  pickRandomItems,
  generateRandomTeams,
  pickWheelWinner,
} from '../lib/misc-generators.js';

const fakeCountry = z.enum(['US', 'UK', 'IN', 'CA']);
const fakeGender = z.enum(['random', 'male', 'female']);

export function registerMiscGeneratorTools(server: McpServer): void {
  server.registerTool(
    'generate_lorem_ipsum',
    {
      title: 'Generate Lorem Ipsum Placeholder Text',
      description:
        'Generate placeholder paragraphs, sentences, words, or a list. Use this instead of writing filler ' +
        'text yourself when you just need realistic-looking dummy content for a mockup/test fixture.',
      inputSchema: {
        quantity: z.number().int().min(1).max(250).describe('How many paragraphs/sentences/words/items to generate.'),
        type: z.enum(['paragraphs', 'sentences', 'words', 'list']).describe('Unit of generation.'),
        startWithLorem: z.boolean().optional().describe('Start with the classic "Lorem ipsum dolor sit amet". Defaults to true.'),
        wrapHtml: z.boolean().optional().describe('Wrap paragraphs in <p> or list items in <li>/<ul>. Defaults to false.'),
      },
    },
    withApiKeyCheck(async ({ quantity, type, startWithLorem, wrapHtml }) => ({
      content: [{ type: 'text', text: generateLoremIpsum(quantity, type, startWithLorem ?? true, wrapHtml ?? false) }],
    })),
  );

  server.registerTool(
    'generate_fake_persona',
    {
      title: 'Generate a Fake Test Persona',
      description:
        'Generate one realistic-looking (but entirely fake) test persona — name, address, email, phone, ' +
        'employment, and a mock credit card — for a given country/region. Use this instead of inventing test ' +
        'data by hand, and note the data is synthetic/non-real, safe for test fixtures.',
      inputSchema: {
        country: fakeCountry.describe('Region whose naming/address conventions to use.'),
        gender: fakeGender.optional().describe('Gender for name selection. Defaults to "random".'),
      },
    },
    withApiKeyCheck(async ({ country, gender }) => ({
      content: [{ type: 'text', text: JSON.stringify(generateFakePersona(country, gender ?? 'random'), null, 2) }],
    })),
  );

  server.registerTool(
    'generate_bulk_fake_personas',
    {
      title: 'Generate Multiple Fake Test Personas',
      description:
        'Generate a batch of realistic-looking (but entirely fake) test personas as a JSON array. Use this ' +
        'instead of generating personas one at a time, or hand-writing a test dataset.',
      inputSchema: {
        country: fakeCountry.describe('Region whose naming/address conventions to use.'),
        gender: fakeGender.optional().describe('Gender for name selection. Defaults to "random".'),
        count: z.number().int().min(1).max(100).describe('How many personas to generate (max 100).'),
      },
    },
    withApiKeyCheck(async ({ country, gender, count }) => ({
      content: [{ type: 'text', text: JSON.stringify(generateBulkFakePersonas(country, gender ?? 'random', count), null, 2) }],
    })),
  );

  server.registerTool(
    'pick_random_items',
    {
      title: 'Pick Random Item(s) from a List',
      description:
        'Randomly pick one or more items from a list, with or without replacement. Use this instead of ' +
        'having an LLM "pick one" itself — that is not a fair random draw and tends to favor certain ' +
        'positions/items; this uses real randomness.',
      inputSchema: {
        options: z.array(z.string()).min(1).describe('The list of options to pick from.'),
        count: z.number().int().min(1).optional().describe('How many to pick. Defaults to 1.'),
        allowDuplicates: z.boolean().optional().describe('Whether the same item can be picked more than once. Defaults to false.'),
      },
    },
    withApiKeyCheck(async ({ options, count, allowDuplicates }) => ({
      content: [{ type: 'text', text: pickRandomItems(options, count ?? 1, allowDuplicates ?? false).join('\n') }],
    })),
  );

  server.registerTool(
    'generate_random_teams',
    {
      title: 'Split Names into Random Teams',
      description:
        'Randomly shuffle a list of names/participants and split them into a given number of balanced ' +
        'teams. Use this instead of manually assigning people to teams, which risks unconscious bias or ' +
        'uneven grouping.',
      inputSchema: {
        names: z.array(z.string()).min(1).describe('List of participant names.'),
        teamCount: z.number().int().min(1).describe('Number of teams to split into.'),
      },
    },
    withApiKeyCheck(async ({ names, teamCount }) => ({
      content: [{ type: 'text', text: JSON.stringify(generateRandomTeams(names, teamCount), null, 2) }],
    })),
  );

  server.registerTool(
    'pick_wheel_winner',
    {
      title: 'Pick a Random Winner (Prize Wheel)',
      description:
        'Pick one random winner from a list of entries, each with equal probability. Use this instead of ' +
        'having an LLM "choose" a winner itself, which is not a fair random draw.',
      inputSchema: { entries: z.array(z.string()).min(1).describe('The list of wheel entries/names.') },
    },
    withApiKeyCheck(async ({ entries }) => ({ content: [{ type: 'text', text: pickWheelWinner(entries) }] })),
  );
}
