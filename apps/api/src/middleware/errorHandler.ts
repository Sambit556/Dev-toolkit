import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';
import { getTransactionId } from '../utils/context';
import { HttpStatus } from '../utils/httpStatus';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details: any = {}
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  const err = new AppError(
    HttpStatus.NOT_FOUND,
    `Route ${req.method} ${req.path} not found`,
    'ROUTE_NOT_FOUND'
  );
  next(err);
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const transactionId = getTransactionId() || (req as any).transactionId || '00000000-0000-0000-0000-000000000000';
  const timestamp = new Date().toISOString();

  let statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';
  let details: any = {};

  // 1. Zod validation errors
  if (err instanceof ZodError) {
    statusCode = HttpStatus.BAD_REQUEST;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = err.errors.reduce((acc: any, e) => {
      const field = e.path.join('.');
      acc[field] = e.message;
      return acc;
    }, {});
  }
  // 2. Custom AppErrors
  else if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code || 'ERROR';
    message = err.message;
    details = err.details || {};
  }
  // 3. CORS errors
  else if (err.message && err.message.startsWith('CORS:')) {
    statusCode = HttpStatus.FORBIDDEN;
    code = 'CORS_BLOCKED';
    message = err.message;
  }
  // 4. PostgreSQL Errors
  else if (err.code && typeof err.code === 'string' && /^[0-9A-Z]{5}$/.test(err.code)) {
    statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    message = 'A database error occurred';
    
    // Map PG codes
    switch (err.code) {
      case '23505': // Unique key violation
        statusCode = HttpStatus.CONFLICT;
        code = 'DUPLICATE_KEY';
        message = err.detail || 'A resource with this key already exists.';
        break;
      case '23503': // Foreign key violation
        statusCode = HttpStatus.BAD_REQUEST;
        code = 'FOREIGN_KEY_VIOLATION';
        message = err.detail || 'Foreign key constraint violated.';
        break;
      case '42P01': // Undefined table
        code = 'DATABASE_TABLE_MISSING';
        message = 'Required database table is missing.';
        break;
      case '3F000': // Invalid schema
      case '42P06':
        code = 'DATABASE_SCHEMA_MISSING';
        message = 'Required database schema is missing.';
        break;
      case '40001': // Serialization failure
      case '40P01': // Deadlock
        code = 'DATABASE_DEADLOCK';
        message = 'A database deadlock occurred. Please retry.';
        break;
      case '57014': // Query timeout
        statusCode = HttpStatus.GATEWAY_TIMEOUT;
        code = 'DATABASE_TIMEOUT';
        message = 'Database query timed out.';
        break;
      default:
        code = 'DATABASE_ERROR';
        break;
    }
  }
  // 5. AWS S3 Client Errors
  else if (err.$metadata) {
    statusCode = err.$metadata.httpStatusCode || HttpStatus.INTERNAL_SERVER_ERROR;
    message = err.message || 'An error occurred during S3 storage operation';

    switch (err.name) {
      case 'NoSuchBucket':
        code = 'S3_BUCKET_NOT_FOUND';
        message = 'The configured storage bucket does not exist.';
        break;
      case 'AccessDenied':
        code = 'S3_ACCESS_DENIED';
        message = 'Access denied to storage services.';
        break;
      case 'InvalidAccessKeyId':
      case 'SignatureDoesNotMatch':
      case 'UnrecognizedClientException':
        code = 'S3_CREDENTIALS_INVALID';
        message = 'Invalid storage credentials.';
        break;
      case 'NoSuchKey':
        statusCode = HttpStatus.NOT_FOUND;
        code = 'S3_OBJECT_NOT_FOUND';
        message = 'The requested file or note does not exist in storage.';
        break;
      case 'ExpiredToken':
        code = 'S3_URL_EXPIRED';
        message = 'Presigned URL has expired.';
        break;
      default:
        code = 'S3_ERROR';
        break;
    }
  }

  // Log errors
  if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
    logger.error('Server execution error', {
      error: err.message,
      stack: err.stack,
      code,
      transactionId,
      path: req.path,
      method: req.method,
    });
  } else {
    logger.warn('Client request warning', {
      error: err.message,
      code,
      statusCode,
      transactionId,
      path: req.path,
      method: req.method,
    });
  }

  // Centralized standard response format
  res.status(statusCode).json({
    success: false,
    transactionId,
    code,
    message,
    details,
    timestamp,
  });
}

