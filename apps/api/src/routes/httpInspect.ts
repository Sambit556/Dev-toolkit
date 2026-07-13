import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { httpInspectRateLimit } from '../middleware/rateLimiter';
import { safeFetch } from '../utils/ssrf';

const router = Router();

const HttpInspectSchema = z.object({
  url: z.string().url().max(2048),
  method: z.enum(['GET', 'HEAD', 'POST']).optional().default('GET'),
  headers: z.record(z.string().max(256), z.string().max(4096)).optional(),
  followRedirects: z.boolean().optional().default(true),
  allowPrivate: z.boolean().optional().default(false),
  body: z.string().max(64 * 1024).optional(),
});

const RESTRICTED_REQUEST_HEADERS = new Set(['host', 'content-length', 'connection', 'user-agent']);

/**
 * @openapi
 * /api/http-inspect:
 *   post:
 *     summary: Fetch a URL server-side and report its status, headers, and timing
 *     tags: [HTTP Toolkit]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [url]
 *             properties:
 *               url:
 *                 type: string
 *               method:
 *                 type: string
 *               headers:
 *                 type: object
 *               followRedirects:
 *                 type: boolean
 *               allowPrivate:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Response status/headers/timing
 */
router.post('/', httpInspectRateLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url, method, headers, followRedirects, allowPrivate, body } = HttpInspectSchema.parse(req.body);

    const outboundHeaders: Record<string, string> = {};
    if (headers) {
      for (const [key, value] of Object.entries(headers)) {
        if (RESTRICTED_REQUEST_HEADERS.has(key.toLowerCase())) continue;
        outboundHeaders[key] = value;
      }
    }

    const result = await safeFetch(url, {
      method,
      headers: outboundHeaders,
      body,
      followRedirects,
      allowPrivate,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
