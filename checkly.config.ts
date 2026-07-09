import { defineConfig } from 'checkly';
import { Frequency } from 'checkly/constructs';

// Set in .env for local `checkly test` runs; set via `npx checkly env add`
// (or the Checkly dashboard) for the values used by deployed checks.
const WEB_URL = process.env.WEB_URL ?? 'https://dev-toolkit-web-sigma.vercel.app';

export default defineConfig({
  projectName: 'DevChrono JSONLab',
  logicalId: 'devchrono-jsonlab',
  checks: {
    checkMatch: '__checks__/**/*.check.ts',
    ignoreDirectoriesMatch: ['node_modules', '.next', 'dist', 'apps/*/node_modules'],
    frequency: Frequency.EVERY_10M,
    locations: ['us-east-1', 'eu-west-1'],
    tags: ['devchrono-jsonlab'],
    environmentVariables: [
      { key: 'WEB_URL', value: WEB_URL },
      ...(process.env.API_URL ? [{ key: 'API_URL', value: process.env.API_URL }] : []),
    ],
    browserChecks: {
      testMatch: '__checks__/browser/**/*.spec.ts',
    },
  },
  cli: {
    runLocation: 'us-east-1',
    reporters: ['list'],
  },
});
