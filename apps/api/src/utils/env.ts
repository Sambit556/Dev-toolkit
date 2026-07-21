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
 * Fetch a value strictly from the local .env file.
 * Returns undefined if not defined in the .env file, ignoring host system env variables.
 */
export function getEnv(key: string): string | undefined {
  const value = envConfig[key];
  return value !== undefined ? value : undefined;
}

/**
 * Fetch a value strictly from the local .env file, falling back to a default value if missing.
 */
export function getEnvWithDefault(key: string, defaultValue: string): string {
  const value = envConfig[key];
  return value !== undefined ? value : defaultValue;
}
