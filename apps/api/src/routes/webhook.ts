import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { webhookRateLimit, httpInspectRateLimit } from '../middleware/rateLimiter';
import { AppError } from '../middleware/errorHandler';
import { safeFetch } from '../utils/ssrf';

const router = Router();

const MAX_REQUESTS_PER_BUCKET = 50;
const MAX_BODY_BYTES = 100 * 1024;
const BUCKET_TTL_MS = 60 * 60 * 1000;
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;

interface CapturedRequest {
  id: string;
  method: string;
  path: string;
  query: Record<string, unknown>;
  headers: Record<string, string>;
  body: string;
  bodyTruncated: boolean;
  receivedAt: string;
  ip: string;
}

interface MockResponseConfig {
  status: number;
  headers: Record<string, string>;
  body: string;
}

const DEFAULT_MOCK_RESPONSE: MockResponseConfig = {
  status: 200,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ok: true }),
};

interface WebhookBucket {
  requests: CapturedRequest[];
  createdAt: number;
  lastActivity: number;
  responseConfig: MockResponseConfig;
}

// No persistence layer exists elsewhere in this API — a module-level ring
// buffer is intentional and sufficient for a short-lived testing tool.
const store = new Map<string, WebhookBucket>();

setInterval(() => {
  const now = Date.now();
  for (const [id, bucket] of store) {
    if (now - bucket.lastActivity > BUCKET_TTL_MS) store.delete(id);
  }
}, SWEEP_INTERVAL_MS).unref();

function sanitizeHeaders(headers: Request['headers']): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined) continue;
    out[key] = Array.isArray(value) ? value.join(', ') : value;
  }
  return out;
}

function getBucketOrThrow(id: string): WebhookBucket {
  const bucket = store.get(id);
  if (!bucket) {
    throw new AppError(404, 'Unknown or expired webhook id', 'NOT_FOUND');
  }
  return bucket;
}

/**
 * @openapi
 * /api/webhook/create:
 *   post:
 *     summary: Create a new webhook capture bucket
 *     tags: [HTTP Toolkit]
 *     responses:
 *       201:
 *         description: New capture id
 */
router.post('/create', (_req: Request, res: Response) => {
  const id = uuidv4();
  store.set(id, {
    requests: [],
    createdAt: Date.now(),
    lastActivity: Date.now(),
    responseConfig: { ...DEFAULT_MOCK_RESPONSE, headers: { ...DEFAULT_MOCK_RESPONSE.headers } },
  });
  res.status(201).json({ id });
});

/**
 * @openapi
 * /api/webhook/{id}/requests:
 *   get:
 *     summary: List requests captured for a webhook id
 *     tags: [HTTP Toolkit]
 *     responses:
 *       200:
 *         description: Captured requests
 *       404:
 *         description: Unknown or expired id
 */
router.get('/:id/requests', (req: Request, res: Response, next: NextFunction) => {
  try {
    const bucket = getBucketOrThrow(req.params.id);
    res.json({ id: req.params.id, createdAt: bucket.createdAt, requests: bucket.requests });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/webhook/{id}:
 *   delete:
 *     summary: Clear captured requests for a webhook id
 *     tags: [HTTP Toolkit]
 *     responses:
 *       200:
 *         description: Cleared
 *       404:
 *         description: Unknown or expired id
 */
router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const bucket = getBucketOrThrow(req.params.id);
    bucket.requests = [];
    bucket.lastActivity = Date.now();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

const MockResponseSchema = z.object({
  status: z.number().int().min(100).max(599).optional().default(200),
  headers: z.record(z.string().max(256), z.string().max(4096)).optional().default({}),
  body: z.string().max(64 * 1024).optional().default(''),
});

const RESTRICTED_MOCK_HEADERS = new Set(['content-length', 'connection', 'transfer-encoding']);

/**
 * @openapi
 * /api/webhook/{id}/response:
 *   put:
 *     summary: Configure the mock status/headers/body returned to future requests against this webhook's capture URL
 *     tags: [HTTP Toolkit]
 *     responses:
 *       200:
 *         description: Updated
 *       404:
 *         description: Unknown or expired id
 */
router.put('/:id/response', (req: Request, res: Response, next: NextFunction) => {
  try {
    const bucket = getBucketOrThrow(req.params.id);
    const parsed = MockResponseSchema.parse(req.body);
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed.headers)) {
      if (RESTRICTED_MOCK_HEADERS.has(key.toLowerCase())) continue;
      headers[key] = value;
    }
    bucket.responseConfig = { status: parsed.status, headers, body: parsed.body };
    bucket.lastActivity = Date.now();
    res.json({ ok: true, responseConfig: bucket.responseConfig });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/webhook/{id}/requests/{reqId}/replay:
 *   post:
 *     summary: Re-send a previously captured request to a target URL
 *     tags: [HTTP Toolkit]
 *     responses:
 *       200:
 *         description: Response from the replay target
 *       404:
 *         description: Unknown webhook or captured request id
 */
const ReplaySchema = z.object({
  targetUrl: z.string().url().max(2048),
  allowPrivate: z.boolean().optional().default(false),
});

router.post('/:id/requests/:reqId/replay', httpInspectRateLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bucket = getBucketOrThrow(req.params.id);
    const captured = bucket.requests.find((r) => r.id === req.params.reqId);
    if (!captured) {
      throw new AppError(404, 'Unknown captured request id', 'NOT_FOUND');
    }
    const { targetUrl, allowPrivate } = ReplaySchema.parse(req.body);

    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(captured.headers)) {
      if (['host', 'content-length', 'connection'].includes(key.toLowerCase())) continue;
      headers[key] = value;
    }

    const result = await safeFetch(targetUrl, {
      method: captured.method,
      headers,
      body: captured.body || undefined,
      allowPrivate,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/webhook/capture/{id}:
 *   all:
 *     summary: Catch-all endpoint that records any incoming request for a webhook id
 *     tags: [HTTP Toolkit]
 *     responses:
 *       200:
 *         description: Acknowledged (or the configured mock response)
 *       404:
 *         description: Unknown or expired id
 */
router.all('/capture/:id', webhookRateLimit, (req: Request, res: Response) => {
  const bucket = store.get(req.params.id);
  if (!bucket) {
    res.status(404).json({ error: 'Not found', message: 'Unknown or expired webhook id' });
    return;
  }

  // Body is captured raw (see the express.raw() mount ahead of the JSON/urlencoded
  // parsers in app.ts) so every content type — including an empty JSON object,
  // which previously hung this handler — is read exactly once and never blocks.
  const raw: Buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
  const bodyTruncated = raw.length > MAX_BODY_BYTES;
  const bodyText = raw.subarray(0, MAX_BODY_BYTES).toString('utf8');

  const captured: CapturedRequest = {
    id: uuidv4(),
    method: req.method,
    path: req.path.replace(/^\/capture\/[^/]+/, '') || '/',
    query: req.query as Record<string, unknown>,
    headers: sanitizeHeaders(req.headers),
    body: bodyText,
    bodyTruncated,
    receivedAt: new Date().toISOString(),
    ip: req.ip || 'unknown',
  };

  bucket.requests.unshift(captured);
  if (bucket.requests.length > MAX_REQUESTS_PER_BUCKET) {
    bucket.requests.length = MAX_REQUESTS_PER_BUCKET;
  }
  bucket.lastActivity = Date.now();

  const { status, headers, body } = bucket.responseConfig;
  res.status(status);
  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }
  res.send(body);
});

export default router;
