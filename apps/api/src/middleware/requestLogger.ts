import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { contextStorage } from '../utils/context';
import { logger } from '../utils/logger';
import { HttpStatus } from '../utils/httpStatus';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const transactionId = (req.headers['x-transaction-id'] as string) || (req.headers['x-request-id'] as string) || uuidv4();

  // Backwards compatibility with X-Request-ID and standard X-Transaction-Id
  req.headers['x-request-id'] = transactionId;
  req.headers['x-transaction-id'] = transactionId;
  res.setHeader('X-Request-ID', transactionId);
  res.setHeader('X-Transaction-Id', transactionId);
  (req as any).transactionId = transactionId;

  contextStorage.run({ transactionId, ip: req.ip, userAgent: req.headers['user-agent'] }, () => {
    const startTime = Date.now();

    res.on('finish', () => {
      const durationMs = Date.now() - startTime;
      const level = res.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR ? 'error' : res.statusCode >= HttpStatus.BAD_REQUEST ? 'warn' : 'info';

      logger[level]('request completed', {
        transactionId,
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
  });
}
