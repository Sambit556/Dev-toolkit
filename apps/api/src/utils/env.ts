import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const envFilePath = path.resolve(process.cwd(), '.env');
let envConfig: Record<string, string> = {};

if (fs.existsSync(envFilePath)) {
  try {
    const fileBuffer = fs.readFileSync(envFilePath);
    envConfig = dotenv.parse(fileBuffer);
  } catch (err) {
    process.stderr.write(`Failed to parse .env file: ${err instanceof Error ? err.message : String(err)}\n`);
  }
}

/**
 * Fetch a value from the host process environment (e.g. variables injected by a PaaS
 * like Render), falling back to the local .env file for local development.
 * Returns undefined if not defined in either.
 */
export function getEnv(key: string): string | undefined {
  const value = process.env[key];
  return value !== undefined ? value : envConfig[key];
}

/**
 * Fetch a value from the host process environment, falling back to the local .env file,
 * then to a default value if missing from both.
 */
export function getEnvWithDefault(key: string, defaultValue: string): string {
  const value = process.env[key] !== undefined ? process.env[key] : envConfig[key];
  return value !== undefined ? value : defaultValue;
}
