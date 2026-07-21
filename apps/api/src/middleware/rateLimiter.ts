import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { AppError } from './errorHandler';
import { HttpStatus } from '../utils/httpStatus';

import { getEnvWithDefault } from '../utils/env';

const windowMs = parseInt(getEnvWithDefault('RATE_LIMIT_WINDOW_MS', '60000'), 10);
const maxRequests = parseInt(getEnvWithDefault('RATE_LIMIT_MAX_REQUESTS', '100'), 10);
const jsonMax = parseInt(getEnvWithDefault('RATE_LIMIT_JSON_MAX', '30'), 10);
const httpInspectMax = parseInt(getEnvWithDefault('RATE_LIMIT_HTTP_INSPECT_MAX', '20'), 10);
const webhookCaptureMax = parseInt(getEnvWithDefault('RATE_LIMIT_WEBHOOK_MAX', '120'), 10);
const authWindowMs = parseInt(getEnvWithDefault('RATE_LIMIT_AUTH_WINDOW_MS', '900000'), 10); // 15 min
const authMax = parseInt(getEnvWithDefault('RATE_LIMIT_AUTH_MAX', '10'), 10);

const rateLimitHandler = (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(HttpStatus.TOO_MANY_REQUESTS, 'Rate limit exceeded. Please wait before making more requests.', 'RATE_LIMIT_EXCEEDED'));
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

// Tighter limit than default: each request triggers a server-side outbound
// fetch, so this is more expensive per-call than a plain JSON endpoint.
export const httpInspectRateLimit = rateLimit({
  windowMs,
  max: httpInspectMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => req.ip || req.headers['x-forwarded-for'] as string || 'unknown',
});

// Looser limit than default: external services may burst-post several
// requests in quick succession while a user is testing a webhook.
export const webhookRateLimit = rateLimit({
  windowMs,
  max: webhookCaptureMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => req.ip || req.headers['x-forwarded-for'] as string || 'unknown',
});

// Much tighter than the global default, and keyed on IP+email together — this
// slows down both a single IP hammering many accounts (credential stuffing)
// and many IPs hammering one account (targeted brute force), independently of
// the generic per-IP limiter above.
export const authRateLimit = rateLimit({
  windowMs: authWindowMs,
  max: authMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown';
    const email = typeof req.body?.email === 'string' ? req.body.email.toLowerCase().trim() : '';
    return email ? `${ip}:${email}` : ip;
  },
});
