import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { webhookRateLimit } from '../middleware/rateLimiter';

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

interface WebhookBucket {
  requests: CapturedRequest[];
  createdAt: number;
  lastActivity: number;
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

function readRawBody(req: Request, maxBytes: number): Promise<{ text: string; truncated: boolean }> {
  return new Promise((resolve, reject) => {
    let total = 0;
    let truncated = false;
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      total += chunk.length;
      if (chunks.reduce((n, c) => n + c.length, 0) < maxBytes) {
        const remaining = maxBytes - chunks.reduce((n, c) => n + c.length, 0);
        chunks.push(chunk.length > remaining ? chunk.subarray(0, remaining) : chunk);
      } else {
        truncated = true;
      }
      if (total > maxBytes) truncated = true;
    });
    req.on('end', () => resolve({ text: Buffer.concat(chunks).toString('utf8'), truncated }));
    req.on('error', reject);
  });
}

function sanitizeHeaders(headers: Request['headers']): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined) continue;
    out[key] = Array.isArray(value) ? value.join(', ') : value;
  }
  return out;
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
  store.set(id, { requests: [], createdAt: Date.now(), lastActivity: Date.now() });
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
router.get('/:id/requests', (req: Request, res: Response) => {
  const bucket = store.get(req.params.id);
  if (!bucket) {
    res.status(404).json({ error: 'Not found', message: 'Unknown or expired webhook id' });
    return;
  }
  res.json({ id: req.params.id, createdAt: bucket.createdAt, requests: bucket.requests });
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
router.delete('/:id', (req: Request, res: Response) => {
  const bucket = store.get(req.params.id);
  if (!bucket) {
    res.status(404).json({ error: 'Not found', message: 'Unknown or expired webhook id' });
    return;
  }
  bucket.requests = [];
  bucket.lastActivity = Date.now();
  res.json({ ok: true });
});

/**
 * @openapi
 * /api/webhook/capture/{id}:
 *   post:
 *     summary: Catch-all endpoint that records any incoming request for a webhook id
 *     tags: [HTTP Toolkit]
 *     responses:
 *       200:
 *         description: Acknowledged
 *       404:
 *         description: Unknown or expired id
 */
router.all('/capture/:id', webhookRateLimit, async (req: Request, res: Response) => {
  const bucket = store.get(req.params.id);
  if (!bucket) {
    res.status(404).json({ error: 'Not found', message: 'Unknown or expired webhook id' });
    return;
  }

  let bodyText = '';
  let bodyTruncated = false;

  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
    bodyText = JSON.stringify(req.body);
  } else if (typeof req.body === 'string' && req.body.length > 0) {
    bodyText = req.body;
  } else {
    const raw = await readRawBody(req, MAX_BODY_BYTES);
    bodyText = raw.text;
    bodyTruncated = raw.truncated;
  }

  if (bodyText.length > MAX_BODY_BYTES) {
    bodyText = bodyText.slice(0, MAX_BODY_BYTES);
    bodyTruncated = true;
  }

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

  res.status(200).json({ ok: true, received: captured.receivedAt });
});

export default router;
