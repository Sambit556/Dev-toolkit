import { getEnv } from '../utils/env';

function envInt(key: string, fallback: number): number {
  const raw = getEnv(key);
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

// --- Auth / sessions ---------------------------------------------------------
export const ACCESS_TOKEN_TTL = getEnv('ACCESS_TOKEN_TTL') || '15m';
export const ACCESS_TOKEN_TTL_SECONDS = envInt('ACCESS_TOKEN_TTL_SECONDS', 15 * 60);
export const REFRESH_TOKEN_TTL = getEnv('REFRESH_TOKEN_TTL') || '7d';
export const REFRESH_TOKEN_TTL_MS = envInt('REFRESH_TOKEN_TTL_DAYS', 7) * 24 * 60 * 60 * 1000;
export const PASSWORD_RESET_TOKEN_TTL = getEnv('PASSWORD_RESET_TOKEN_TTL') || '10m';
export const PASSWORD_RESET_TOKEN_TTL_MINUTES = parseInt(PASSWORD_RESET_TOKEN_TTL, 10) || 10;
export const OAUTH_STATE_TTL_SECONDS = envInt('OAUTH_STATE_TTL_SECONDS', 300); // 5 minutes
export const OAUTH_EXCHANGE_TTL_SECONDS = envInt('OAUTH_EXCHANGE_TTL_SECONDS', 60); // 1 minute, single-use

// The frontend's canonical origin, for building links that need to point back at it
// (password-reset emails, OAuth redirects) — reuses CORS_ORIGIN (already the source of
// truth for "which frontend origins this API trusts") rather than a separate env var.
// CORS_ORIGIN can list more than one origin (dev/LAN testing); the first is canonical.
export const WEB_APP_ORIGIN = (getEnv('CORS_ORIGIN') || 'http://localhost:4001').split(',')[0].trim();

// --- Storage ------------------------------------------------------------------
export const DEFAULT_STORAGE_QUOTA_BYTES = envInt('DEFAULT_STORAGE_QUOTA_BYTES', 1024 ** 4); // 1TB
export const SHARE_LINK_TTL_SECONDS = envInt('SHARE_LINK_TTL_SECONDS', 600); // 10 minutes
export const DOWNLOAD_LINK_TTL_SECONDS = envInt('DOWNLOAD_LINK_TTL_SECONDS', 900); // 15 minutes
export const EVENT_CLUSTER_GAP_MS = envInt('EVENT_CLUSTER_GAP_MINUTES', 4 * 60) * 60 * 1000; // 4 hours
export const UPLOAD_SECURITY_SCAN_BYTES = envInt('UPLOAD_SECURITY_SCAN_BYTES', 4096);

// --- Profile / avatars ---------------------------------------------------------
export const AVATAR_MAX_BYTES = envInt('AVATAR_MAX_BYTES', 5 * 1024 * 1024); // 5MB
export const AVATAR_URL_TTL_SECONDS = envInt('AVATAR_URL_TTL_SECONDS', 900); // 15 minutes

// --- In-app file preview --------------------------------------------------------
export const PREVIEW_TEXT_MAX_BYTES = envInt('PREVIEW_TEXT_MAX_BYTES', 2 * 1024 * 1024); // 2MB
export const PREVIEW_URL_TTL_SECONDS = envInt('PREVIEW_URL_TTL_SECONDS', 300); // 5 minutes — shorter-lived than downloads
