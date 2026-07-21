import jwt, { Algorithm } from 'jsonwebtoken';
import crypto from 'crypto';
import { AppError } from '../middleware/errorHandler';
import { getEnv } from '../utils/env';
import { logger } from '../utils/logger';
import { ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL, PASSWORD_RESET_TOKEN_TTL, OAUTH_STATE_TTL_SECONDS } from '../config/constants';
import { HttpStatus } from '../utils/httpStatus';

// Algorithm is always pinned explicitly on both sign and verify — never trust the
// `alg` header alone (classic "alg confusion" / "alg:none" JWT attack surface).
const JWT_ALGORITHM: Algorithm = 'HS256';

const jwtSecret = getEnv('JWT_SECRET');
const jwtRefreshSecret = getEnv('JWT_REFRESH_SECRET');
const resetSecret = getEnv('JWT_RESET_SECRET') || jwtSecret;

if (!jwtSecret || !jwtRefreshSecret) {
  logger.error('CRITICAL: JWT security secrets (JWT_SECRET, JWT_REFRESH_SECRET) are not configured in environment variables!');
}

// --- Payload encryption -----------------------------------------------------
// A JWT's payload is base64url, not encrypted — anyone can decode a signed token
// and read every claim. We encrypt the claims (AES-256-GCM) into a single opaque
// field before signing, so the token stays a normal verifiable JWT but discloses
// nothing about its contents without the server-side key.
const ENC_ALGO = 'aes-256-gcm';
const rawEncryptionKey = getEnv('JWT_PAYLOAD_ENCRYPTION_KEY');

function getEncryptionKey(): Buffer {
  if (!rawEncryptionKey) {
    throw new AppError(HttpStatus.INTERNAL_SERVER_ERROR, 'JWT payload encryption key is not configured', 'JWT_CONFIG_ERROR');
  }
  // Accept a 64-char hex key directly, otherwise derive a 32-byte key from whatever was provided.
  if (/^[0-9a-fA-F]{64}$/.test(rawEncryptionKey)) {
    return Buffer.from(rawEncryptionKey, 'hex');
  }
  return crypto.createHash('sha256').update(rawEncryptionKey).digest();
}

function encryptPayload(payload: object): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ENC_ALGO, key, iv);
  const plaintext = Buffer.from(JSON.stringify(payload), 'utf8');
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('base64url')}.${authTag.toString('base64url')}.${ciphertext.toString('base64url')}`;
}

function decryptPayload<T>(enc: string): T {
  const key = getEncryptionKey();
  const [ivPart, tagPart, dataPart] = enc.split('.');
  if (!ivPart || !tagPart || !dataPart) {
    throw new Error('Malformed encrypted token payload');
  }
  const decipher = crypto.createDecipheriv(ENC_ALGO, key, Buffer.from(ivPart, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagPart, 'base64url'));
  const plaintext = Buffer.concat([decipher.update(Buffer.from(dataPart, 'base64url')), decipher.final()]);
  return JSON.parse(plaintext.toString('utf8')) as T;
}

export interface TokenPayload {
  userId: string;
  email: string;
  accessTokenId: string;
  tokenFamily: string;
}

function sign(payload: object, secret: string, expiresIn: string): string {
  const enc = encryptPayload(payload);
  return jwt.sign({ enc }, secret, { algorithm: JWT_ALGORITHM, expiresIn } as jwt.SignOptions);
}

function verify<T>(token: string, secret: string): T & { iat?: number; exp?: number } {
  const decoded = jwt.verify(token, secret, { algorithms: [JWT_ALGORITHM] }) as { enc: string; iat: number; exp: number };
  const payload = decryptPayload<T>(decoded.enc);
  return { ...payload, iat: decoded.iat, exp: decoded.exp };
}

export function generateAccessToken(payload: TokenPayload): string {
  if (!jwtSecret) throw new AppError(HttpStatus.INTERNAL_SERVER_ERROR, 'JWT Access Token configuration error', 'JWT_CONFIG_ERROR');
  return sign(payload, jwtSecret, ACCESS_TOKEN_TTL);
}

export function generateRefreshToken(payload: TokenPayload): string {
  if (!jwtRefreshSecret) throw new AppError(HttpStatus.INTERNAL_SERVER_ERROR, 'JWT Refresh Token configuration error', 'JWT_CONFIG_ERROR');
  return sign(payload, jwtRefreshSecret, REFRESH_TOKEN_TTL);
}

export function verifyAccessToken(token: string): TokenPayload & { iat?: number } {
  if (!jwtSecret) throw new AppError(HttpStatus.INTERNAL_SERVER_ERROR, 'JWT Access Token configuration error', 'JWT_CONFIG_ERROR');
  try {
    return verify<TokenPayload>(token, jwtSecret);
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') throw new AppError(HttpStatus.UNAUTHORIZED, 'Access token has expired', 'EXPIRED_JWT');
    throw new AppError(HttpStatus.UNAUTHORIZED, 'Invalid access token signature', 'INVALID_JWT');
  }
}

export function verifyRefreshToken(token: string): TokenPayload {
  if (!jwtRefreshSecret) throw new AppError(HttpStatus.INTERNAL_SERVER_ERROR, 'JWT Refresh Token configuration error', 'JWT_CONFIG_ERROR');
  try {
    return verify<TokenPayload>(token, jwtRefreshSecret);
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') throw new AppError(HttpStatus.UNAUTHORIZED, 'Refresh token has expired', 'EXPIRED_REFRESH_TOKEN');
    throw new AppError(HttpStatus.UNAUTHORIZED, 'Invalid refresh token signature', 'INVALID_REFRESH_TOKEN');
  }
}

// --- Password reset tokens ---------------------------------------------------
export interface ResetTokenPayload {
  userId: string;
  email: string;
  action: 'password_reset';
}

export function generatePasswordResetToken(payload: ResetTokenPayload): string {
  if (!resetSecret) throw new AppError(HttpStatus.INTERNAL_SERVER_ERROR, 'JWT Configuration is missing', 'JWT_CONFIG_ERROR');
  return sign(payload, resetSecret, PASSWORD_RESET_TOKEN_TTL);
}

export function verifyPasswordResetToken(token: string): ResetTokenPayload {
  if (!resetSecret) throw new AppError(HttpStatus.INTERNAL_SERVER_ERROR, 'JWT Configuration is missing', 'JWT_CONFIG_ERROR');
  try {
    return verify<ResetTokenPayload>(token, resetSecret);
  } catch (err) {
    throw new AppError(HttpStatus.UNAUTHORIZED, 'Invalid or expired password reset token', 'INVALID_RESET_TOKEN');
  }
}

// --- Google OAuth CSRF state token -------------------------------------------
// Self-verifying (signed + short-lived), so no server-side state store is needed
// between issuing the Google consent redirect and validating the callback.
interface OAuthStatePayload {
  purpose: 'google_oauth_state';
  nonce: string;
}

export function generateOAuthStateToken(): string {
  if (!jwtSecret) throw new AppError(HttpStatus.INTERNAL_SERVER_ERROR, 'JWT configuration error', 'JWT_CONFIG_ERROR');
  return sign({ purpose: 'google_oauth_state', nonce: crypto.randomUUID() }, jwtSecret, `${OAUTH_STATE_TTL_SECONDS}s`);
}

export function verifyOAuthStateToken(token: string): void {
  if (!jwtSecret) throw new AppError(HttpStatus.INTERNAL_SERVER_ERROR, 'JWT configuration error', 'JWT_CONFIG_ERROR');
  try {
    const decoded = verify<OAuthStatePayload>(token, jwtSecret);
    if (decoded.purpose !== 'google_oauth_state') throw new Error('Wrong token purpose');
  } catch (err) {
    throw new AppError(HttpStatus.UNAUTHORIZED, 'Invalid or expired OAuth state', 'INVALID_OAUTH_STATE');
  }
}
