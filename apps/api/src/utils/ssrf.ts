import dns from 'dns';
import net from 'net';
import { fetch, Agent, type Dispatcher } from 'undici';
import { AppError } from '../middleware/errorHandler';

const MAX_REDIRECTS = 5;
const FETCH_TIMEOUT_MS = 10_000;

const blockedV4 = new net.BlockList();
blockedV4.addSubnet('0.0.0.0', 8);
blockedV4.addSubnet('10.0.0.0', 8);
blockedV4.addSubnet('100.64.0.0', 10);
blockedV4.addSubnet('127.0.0.0', 8);
blockedV4.addSubnet('169.254.0.0', 16);
blockedV4.addSubnet('172.16.0.0', 12);
blockedV4.addSubnet('192.0.0.0', 24);
blockedV4.addSubnet('192.168.0.0', 16);
blockedV4.addSubnet('198.18.0.0', 15);
blockedV4.addSubnet('224.0.0.0', 4);
blockedV4.addSubnet('240.0.0.0', 4);

const blockedV6 = new net.BlockList();
blockedV6.addSubnet('::1', 128, 'ipv6');
blockedV6.addSubnet('fc00::', 7, 'ipv6');
blockedV6.addSubnet('fe80::', 10, 'ipv6');
blockedV6.addSubnet('::ffff:0:0', 96, 'ipv6');

function isBlockedIp(ip: string): boolean {
  const family = net.isIP(ip);
  if (family === 4) return blockedV4.check(ip, 'ipv4');
  if (family === 6) return blockedV6.check(ip, 'ipv6');
  return true;
}

/** Resolves hostname and rejects if it (or any of its A/AAAA records) points at a private/reserved address. */
async function resolvePublicIp(hostname: string): Promise<string> {
  const literalFamily = net.isIP(hostname);
  if (literalFamily) {
    if (isBlockedIp(hostname)) {
      throw new AppError(400, 'Target host resolves to a private or reserved address', 'SSRF_BLOCKED');
    }
    return hostname;
  }

  const records = await dns.promises.lookup(hostname, { all: true });
  if (records.length === 0) {
    throw new AppError(400, 'Could not resolve host', 'DNS_ERROR');
  }
  for (const r of records) {
    if (isBlockedIp(r.address)) {
      throw new AppError(400, 'Target host resolves to a private or reserved address', 'SSRF_BLOCKED');
    }
  }
  return records[0].address;
}

export interface SafeFetchResult {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  finalUrl: string;
  redirected: boolean;
  timingMs: number;
}

/**
 * Fetches a user-supplied URL while guarding against SSRF: blocks non-http(s)
 * protocols, resolves + validates the hostname isn't private/reserved, and
 * pins the connection to the validated IP (via a custom dispatcher lookup)
 * so a second DNS lookup at connect-time can't be rebound to a different,
 * unvalidated address. Each hop of a redirect chain is re-validated the same way.
 */
export async function safeFetchHeaders(targetUrl: string): Promise<SafeFetchResult> {
  let currentUrl = targetUrl;
  let redirected = false;
  const start = Date.now();

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const parsed = new URL(currentUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new AppError(400, 'Only http and https URLs are supported', 'INVALID_PROTOCOL');
    }

    const pinnedIp = await resolvePublicIp(parsed.hostname);
    const family = net.isIP(pinnedIp) === 6 ? 6 : 4;

    const dispatcher: Dispatcher = new Agent({
      connect: {
        lookup: (_hostname, _options, callback) => {
          callback(null, [{ address: pinnedIp, family }]);
        },
      },
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let res;
    try {
      res = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        dispatcher,
        headers: { 'User-Agent': 'DevChrono-HttpToolkit/1.0' },
      });
    } finally {
      clearTimeout(timeout);
    }

    // Drain without buffering the full body — we only need headers/status.
    res.body?.cancel().catch(() => {});

    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      redirected = true;
      currentUrl = new URL(res.headers.get('location') as string, currentUrl).toString();
      continue;
    }

    const headers: Record<string, string> = {};
    res.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return {
      status: res.status,
      statusText: res.statusText,
      headers,
      finalUrl: currentUrl,
      redirected,
      timingMs: Date.now() - start,
    };
  }

  throw new AppError(400, 'Too many redirects', 'TOO_MANY_REDIRECTS');
}
