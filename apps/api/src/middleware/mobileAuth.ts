
import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import { verifyMobileToken } from '../services/storage.service';
import { HttpStatus } from '../utils/httpStatus';

export async function requireMobileAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(HttpStatus.UNAUTHORIZED, 'Missing or malformed Authorization header', 'MISSING_TOKEN');
    }

    const token = authHeader.substring(7);
    const decoded = await verifyMobileToken(token);

    (req as any).mobileSession = decoded;
    // Also inject user so standard getUser(req) works for the storage endpoints
    (req as any).user = { id: decoded.userId };
    
    next();
  } catch (err) {
    next(err);
  }
}

