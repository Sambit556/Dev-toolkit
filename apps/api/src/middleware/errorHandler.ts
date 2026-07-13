import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
    requestId: req.headers['x-request-id'],
  });
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = req.headers['x-request-id'];

  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation error',
      message: 'Invalid request data',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
      requestId,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.code || 'error',
      message: err.message,
      requestId,
    });
    return;
  }

  // The `cors` package rejects disallowed origins by calling its callback
  // with a plain Error, which lands here — before it ever gets a chance to
  // set Access-Control-Allow-Origin. Left as a generic 500, that reads to
  // the browser as an opaque CORS failure with no indication of the real
  // cause. Surface it as a 403 with the actual reason instead.
  if (err.message.startsWith('CORS:')) {
    logger.warn('CORS rejection', { error: err.message, requestId, method: req.method, path: req.path });
    res.status(403).json({
      error: 'CORS_BLOCKED',
      message: err.message,
      requestId,
    });
    return;
  }

  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    requestId,
    method: req.method,
    path: req.path,
  });

  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred',
    requestId,
  });
}
