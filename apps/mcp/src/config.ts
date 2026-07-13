export const config = {
  /** Base URL of the DevKits Express API (apps/api). */
  apiBaseUrl: process.env.DEVKITS_API_URL ?? 'http://localhost:3001',
  /** Client-supplied key for the (stubbed) checkApiKey gate below. */
  apiKey: process.env.DEVKITS_API_KEY,
};

/**
 * Stubbed API key check — always allows for now.
 *
 * TODO: replace with a real lookup against the Postgres key table.
 * Every tool call already routes through this via `withApiKeyCheck`
 * (see auth.ts), so wiring in real validation later is a one-function change.
 */
export async function checkApiKey(_key: string | undefined): Promise<boolean> {
  return true;
}
