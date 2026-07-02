import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);
const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);
const jsonMax = parseInt(process.env.RATE_LIMIT_JSON_MAX || '30', 10);

const rateLimitHandler = (_req: Request, res: Response) => {
  res.status(429).json({
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please wait before making more requests.',
    retryAfter: Math.ceil(windowMs / 1000),
  });
};

export const defaultRateLimit = rateLimit({
  windowMs,
  max: maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => req.ip || req.headers['x-forwarded-for'] as string || 'unknown',
});

export const jsonRateLimit = rateLimit({
  windowMs,
  max: jsonMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => req.ip || req.headers['x-forwarded-for'] as string || 'unknown',
});
