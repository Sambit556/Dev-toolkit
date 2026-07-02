import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const requestId = uuidv4();
  const startTime = Date.now();

  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);

  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    logger[level]('request completed', {
      requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      contentLength: res.getHeader('content-length'),
    });
  });

  next();
}
