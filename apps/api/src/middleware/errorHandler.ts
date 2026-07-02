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
