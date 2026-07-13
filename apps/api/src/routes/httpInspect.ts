import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { httpInspectRateLimit } from '../middleware/rateLimiter';
import { safeFetchHeaders } from '../utils/ssrf';

const router = Router();

const HttpInspectSchema = z.object({
  url: z.string().url().max(2048),
});

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
 *     responses:
 *       200:
 *         description: Response status/headers/timing
 */
router.post('/', httpInspectRateLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url } = HttpInspectSchema.parse(req.body);
    const result = await safeFetchHeaders(url);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
