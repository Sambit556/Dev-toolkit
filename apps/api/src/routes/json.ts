import { Router, Request, Response, NextFunction } from 'express';
import { JsonValidateSchema, JsonFormatSchema, JsonMinifySchema } from '@devchrono/shared';
import { validateJson, formatJson, minifyJson } from '../services/jsonService';
import { jsonRateLimit } from '../middleware/rateLimiter';

const router = Router();

/**
 * @openapi
 * /api/json/validate:
 *   post:
 *     summary: Validate a JSON string
 *     tags: [JSON]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [json]
 *             properties:
 *               json:
 *                 type: string
 *     responses:
 *       200:
 *         description: Validation result
 */
router.post('/validate', jsonRateLimit, (req: Request, res: Response, next: NextFunction) => {
  try {
    const { json } = JsonValidateSchema.parse(req.body);
    res.json(validateJson(json));
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/json/format:
 *   post:
 *     summary: Format and beautify JSON
 *     tags: [JSON]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [json]
 *             properties:
 *               json:
 *                 type: string
 *               indent:
 *                 type: number
 *                 default: 2
 *               sortKeys:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Formatted JSON
 */
router.post('/format', jsonRateLimit, (req: Request, res: Response, next: NextFunction) => {
  try {
    const { json, indent, sortKeys } = JsonFormatSchema.parse(req.body);
    res.json(formatJson(json, indent, sortKeys));
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/json/minify:
 *   post:
 *     summary: Minify JSON
 *     tags: [JSON]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [json]
 *             properties:
 *               json:
 *                 type: string
 *     responses:
 *       200:
 *         description: Minified JSON with stats
 */
router.post('/minify', jsonRateLimit, (req: Request, res: Response, next: NextFunction) => {
  try {
    const { json } = JsonMinifySchema.parse(req.body);
    res.json(minifyJson(json));
  } catch (err) {
    next(err);
  }
});

export default router;
