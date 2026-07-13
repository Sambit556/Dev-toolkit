import dns from 'dns';
import net from 'net';
import { fetch, Agent, type Dispatcher } from 'undici';
import { AppError } from '../middleware/errorHandler';

const MAX_REDIRECTS = 5;
const FETCH_TIMEOUT_MS = 10_000;
const MAX_RESPONSE_BODY_BYTES = 256 * 1024;

// Never reachable, opt-in or not: link-local (includes cloud metadata at
// 169.254.169.254), "this network", multicast, and reserved ranges have no
// legitimate use as an inspection/replay target.
const alwaysBlockedV4 = new net.BlockList();
alwaysBlockedV4.addSubnet('0.0.0.0', 8);
alwaysBlockedV4.addSubnet('169.254.0.0', 16);
alwaysBlockedV4.addSubnet('192.0.0.0', 24);
alwaysBlockedV4.addSubnet('224.0.0.0', 4);
alwaysBlockedV4.addSubnet('240.0.0.0', 4);

const alwaysBlockedV6 = new net.BlockList();
alwaysBlockedV6.addSubnet('fe80::', 10, 'ipv6');
alwaysBlockedV6.addSubnet('::ffff:0:0', 96, 'ipv6');

// Private/internal ranges — blocked by default, reachable only when the
// caller explicitly opts in (e.g. "inspect my local API" in Header Inspector).
const privateV4 = new net.BlockList();
privateV4.addSubnet('10.0.0.0', 8);
privateV4.addSubnet('100.64.0.0', 10);
privateV4.addSubnet('127.0.0.0', 8);
privateV4.addSubnet('172.16.0.0', 12);
privateV4.addSubnet('192.168.0.0', 16);
privateV4.addSubnet('198.18.0.0', 15);

const privateV6 = new net.BlockList();
privateV6.addSubnet('::1', 128, 'ipv6');
privateV6.addSubnet('fc00::', 7, 'ipv6');

function isAlwaysBlockedIp(ip: string): boolean {
  const family = net.isIP(ip);
  if (family === 4) return alwaysBlockedV4.check(ip, 'ipv4');
  if (family === 6) return alwaysBlockedV6.check(ip, 'ipv6');
  return true;
}

function isPrivateIp(ip: string): boolean {
  const family = net.isIP(ip);
  if (family === 4) return privateV4.check(ip, 'ipv4');
  if (family === 6) return privateV6.check(ip, 'ipv6');
  return false;
}

interface ResolvedAddress {
  address: string;
  family: 4 | 6;
}

/** Resolves hostname and rejects if it (or any of its A/AAAA records) points at a blocked address. */
async function resolveAllowedIps(hostname: string, allowPrivate: boolean): Promise<ResolvedAddress[]> {
  const literalFamily = net.isIP(hostname);
  const check = (ip: string) => {
    if (isAlwaysBlockedIp(ip)) {
      throw new AppError(400, 'Target host resolves to a reserved or non-routable address', 'SSRF_BLOCKED');
    }
    if (!allowPrivate && isPrivateIp(ip)) {
      throw new AppError(400, 'Target host resolves to a private address. Enable "allow private targets" to inspect internal APIs.', 'SSRF_BLOCKED_PRIVATE');
    }
  };

  if (literalFamily) {
    check(hostname);
    return [{ address: hostname, family: literalFamily as 4 | 6 }];
  }

  const records = await dns.promises.lookup(hostname, { all: true });
  if (records.length === 0) {
    throw new AppError(400, 'Could not resolve host', 'DNS_ERROR');
  }
  for (const r of records) check(r.address);
  return records.map((r) => ({ address: r.address, family: r.family as 4 | 6 }));
}

export interface SafeFetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  allowPrivate?: boolean;
  followRedirects?: boolean;
}

export interface SafeFetchResult {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  finalUrl: string;
  redirected: boolean;
  body?: string;
  bodyTruncated?: boolean;
  timingMs: number;
  dnsMs: number;
  connectAndWaitMs: number;
}

/**
 * Fetches a user-supplied URL while guarding against SSRF: blocks non-http(s)
 * protocols, resolves + validates the hostname isn't in a blocked range, and
 * pins the connection to the validated IP (via a custom dispatcher lookup)
 * so a second DNS lookup at connect-time can't be rebound to a different,
 * unvalidated address. Each hop of a redirect chain is re-validated the same way.
 * `allowPrivate` lifts the block on RFC1918/loopback/CGNAT ranges only —
 * link-local (cloud metadata), multicast, and reserved ranges stay blocked
 * unconditionally.
 */
export async function safeFetch(targetUrl: string, options: SafeFetchOptions = {}): Promise<SafeFetchResult> {
  const { method = 'GET', headers = {}, body, allowPrivate = false, followRedirects = true } = options;

  let currentUrl = targetUrl;
  let redirected = false;
  const start = Date.now();
  let dnsMs = 0;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const parsed = new URL(currentUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new AppError(400, 'Only http and https URLs are supported', 'INVALID_PROTOCOL');
    }

    const dnsStart = Date.now();
    const candidates = await resolveAllowedIps(parsed.hostname, allowPrivate);
    if (hop === 0) dnsMs = Date.now() - dnsStart;

    // A hostname (e.g. "localhost") can resolve to multiple addresses where
    // only some are actually reachable (dual-stack host with a v4-only
    // listener, IPv6 route unavailable, etc). Try each validated candidate
    // in DNS order and fall through to the next on a connection-level
    // failure, rather than pinning to records[0] and failing outright.
    const connectStart = Date.now();
    let res: Awaited<ReturnType<typeof fetch>> | undefined;
    let lastConnectError: unknown;
    for (const candidate of candidates) {
      const dispatcher: Dispatcher = new Agent({
        connect: {
          lookup: (_hostname, _options, callback) => {
            callback(null, [{ address: candidate.address, family: candidate.family }]);
          },
        },
      });

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      try {
        res = await fetch(currentUrl, {
          method: hop === 0 ? method : 'GET',
          redirect: 'manual',
          signal: controller.signal,
          dispatcher,
          headers: { 'User-Agent': 'DevChrono-HttpToolkit/1.0', ...headers },
          body: hop === 0 && body && method !== 'GET' && method !== 'HEAD' ? body : undefined,
        });
        break;
      } catch (err) {
        lastConnectError = err;
      } finally {
        clearTimeout(timeout);
      }
    }
    if (!res) {
      const detail = lastConnectError instanceof Error ? lastConnectError.message : 'connection failed';
      throw new AppError(502, `Could not connect to target host (${detail})`, 'CONNECT_FAILED');
    }
    const connectAndWaitMs = Date.now() - connectStart;

    if (followRedirects && res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      res.body?.cancel().catch(() => {});
      redirected = true;
      currentUrl = new URL(res.headers.get('location') as string, currentUrl).toString();
      continue;
    }

    const resHeaders: Record<string, string> = {};
    res.headers.forEach((value, key) => {
      resHeaders[key] = value;
    });

    let responseBody: string | undefined;
    let bodyTruncated = false;
    if (method !== 'HEAD') {
      const buf = Buffer.from(await res.arrayBuffer());
      bodyTruncated = buf.length > MAX_RESPONSE_BODY_BYTES;
      responseBody = buf.subarray(0, MAX_RESPONSE_BODY_BYTES).toString('utf8');
    } else {
      res.body?.cancel().catch(() => {});
    }

    return {
      status: res.status,
      statusText: res.statusText,
      headers: resHeaders,
      finalUrl: currentUrl,
      redirected,
      body: responseBody,
      bodyTruncated,
      timingMs: Date.now() - start,
      dnsMs,
      connectAndWaitMs,
    };
  }

  throw new AppError(400, 'Too many redirects', 'TOO_MANY_REDIRECTS');
}
