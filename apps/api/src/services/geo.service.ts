import { commonDao } from '../repositories/commonDao';
import { TABLES } from '../repositories/migrations';
import { logger } from '../utils/logger';

const GEO_LOOKUP_TIMEOUT_MS = 3000;

// Loopback/private/link-local ranges never resolve to a real location — skip the
// network call entirely for these (every request during local dev would otherwise
// be a guaranteed-failing lookup against a third party).
function isPrivateOrLoopbackIp(ip: string): boolean {
  const bare = ip.replace(/^::ffff:/, ''); // IPv4-mapped IPv6, e.g. from `trust proxy`
  if (bare === '::1' || bare === '127.0.0.1' || bare.startsWith('127.')) return true;
  if (bare.startsWith('10.') || bare.startsWith('192.168.')) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(bare)) return true;
  if (bare.startsWith('fc') || bare.startsWith('fd') || bare.startsWith('fe80:')) return true; // IPv6 unique-local/link-local
  return false;
}

/**
 * Best-effort country lookup for an IP via freeipapi.com (no API key, generous
 * free tier) — never throws; returns null on any failure, timeout, or private IP,
 * so callers never need special-case error handling around this.
 */
export async function lookupCountryByIp(ip: string | undefined | null): Promise<string | null> {
  if (!ip || isPrivateOrLoopbackIp(ip)) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEO_LOOKUP_TIMEOUT_MS);
  try {
    const response = await fetch(`https://freeipapi.com/api/json/${ip}`, { signal: controller.signal });
    if (!response.ok) return null;
    const data: any = await response.json();
    return data?.countryName || null;
  } catch (err: any) {
    logger.warn('IP geolocation lookup failed', { ip, error: err.message });
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Fire-and-forget — updates the user's last-known IP and (best-effort) country.
 * Never awaited by callers on the login/register critical path; a slow or failed
 * lookup must never delay or fail authentication.
 */
export function updateUserGeoAndIp(userId: string, ip: string | undefined): void {
  if (!ip) return;

  (async () => {
    const country = await lookupCountryByIp(ip);
    const updateFields: Record<string, string> = { last_ip: ip };
    if (country) updateFields.country = country;
    await commonDao.updateData(TABLES.USERS, updateFields, { id: userId });
  })().catch((err: any) => {
    logger.error('Failed to update user geo/IP', { userId, error: err.message });
  });
}
