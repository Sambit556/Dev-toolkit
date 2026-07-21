import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getEnv } from '../utils/env';
import { logger } from '../utils/logger';

// Salt rounds control bcrypt's own per-hash random salt cost factor.
const SALT_ROUNDS = parseInt(getEnv('BCRYPT_SALT_ROUNDS') || '12', 10);

// The pepper is a second, server-only secret (never stored in the DB) mixed in
// before hashing. Even a full database dump can't be bcrypt-cracked offline
// without also having this value, which only lives in the environment.
const PEPPER = getEnv('PASSWORD_PEPPER');

if (!PEPPER) {
  logger.warn('PASSWORD_PEPPER is not configured — passwords will be hashed without a server-side pepper. Set PASSWORD_PEPPER in .env for defense in depth.');
}

function withPepper(password: string): string {
  if (!PEPPER) return password;
  // HMAC (not plain concatenation) so pepper length/content can't leak via hash timing/structure.
  return crypto.createHmac('sha256', PEPPER).update(password).digest('hex');
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(withPepper(password), SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(withPepper(password), hash);
}
