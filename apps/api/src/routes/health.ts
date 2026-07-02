import { Router, Request, Response } from 'express';
import { version } from '../../package.json';

const router = Router();

const startTime = Date.now();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 version:
 *                   type: string
 *                 uptime:
 *                   type: number
 *                 timestamp:
 *                   type: string
 */
router.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    version,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
  });
});

export default router;
