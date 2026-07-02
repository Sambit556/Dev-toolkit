import { Router, Request, Response, NextFunction } from 'express';
import { ConvertTimestampSchema, ConvertDateSchema } from '@devchrono/shared';
import { getCurrentTime, convertTimestamp, convertDate } from '../services/timeService';

const router = Router();

/**
 * @openapi
 * /api/time/current:
 *   get:
 *     summary: Get current Unix timestamp in all units
 *     tags: [Time]
 *     responses:
 *       200:
 *         description: Current time in multiple units
 */
router.get('/current', (_req: Request, res: Response) => {
  res.json(getCurrentTime());
});

/**
 * @openapi
 * /api/time/convert:
 *   post:
 *     summary: Convert Unix timestamp to human-readable date
 *     tags: [Time]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [timestamp]
 *             properties:
 *               timestamp:
 *                 type: string
 *                 description: Numeric timestamp string
 *               unit:
 *                 type: string
 *                 enum: [seconds, milliseconds, nanoseconds]
 *               timezone:
 *                 type: string
 *                 description: IANA timezone name
 *     responses:
 *       200:
 *         description: Converted timestamp
 *       400:
 *         description: Invalid input
 */
router.post('/convert', (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = ConvertTimestampSchema.parse(req.body);
    const result = convertTimestamp(parsed.timestamp, parsed.unit, parsed.timezone);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/time/from-date:
 *   post:
 *     summary: Convert readable date string to Unix timestamp
 *     tags: [Time]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [dateString]
 *             properties:
 *               dateString:
 *                 type: string
 *               timezone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Timestamps in all units
 *       400:
 *         description: Invalid date string
 */
router.post('/from-date', (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = ConvertDateSchema.parse(req.body);
    const result = convertDate(parsed.dateString, parsed.timezone);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
