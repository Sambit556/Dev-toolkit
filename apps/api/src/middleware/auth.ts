import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import { getSession, revokeSession } from '../utils/session';
import { commonDao } from '../repositories/commonDao';
import { logger } from '../utils/logger';
import { Role } from '../constants/activityActions';
import { HttpStatus } from '../utils/httpStatus';
import {
  TokenPayload,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../services/token.service';

export type { TokenPayload };
export { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken };

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(HttpStatus.UNAUTHORIZED, 'Missing or malformed Authorization header', 'MISSING_JWT');
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    // Check active session in session store (Redis or in-memory fallback)
    const session = await getSession(decoded.accessTokenId);
    if (!session) {
      throw new AppError(HttpStatus.UNAUTHORIZED, 'Active session not found or has been revoked', 'SESSION_REVOKED');
    }

    // Role and active-status are always re-read from the database on every request,
    // never trusted from the JWT — even a valid, unexpired token for a user who was
    // demoted or deactivated a second ago loses access immediately.
    const user = await commonDao.getOneDataByCond<any>('users', { id: decoded.userId });

    if (!user) {
      await revokeSession(decoded.accessTokenId);
      throw new AppError(HttpStatus.UNAUTHORIZED, 'User account no longer exists', 'USER_NOT_FOUND');
    }

    if (user.is_active === false) {
      await revokeSession(decoded.accessTokenId);
      throw new AppError(HttpStatus.FORBIDDEN, 'This account has been deactivated', 'ACCOUNT_INACTIVE');
    }

    // Check password change invalidation
    const jwtIat = decoded.iat; // JWT iat is in seconds
    const passwordChangedAtSeconds = user.password_changed_at
      ? Math.floor(new Date(user.password_changed_at).getTime() / 1000)
      : 0;

    if (jwtIat && passwordChangedAtSeconds > jwtIat) {
      await revokeSession(decoded.accessTokenId);
      throw new AppError(HttpStatus.UNAUTHORIZED, 'Password was changed. Please log in again.', 'PASSWORD_CHANGED');
    }

    // Attach user information to request context including role
    (req as any).user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      accessTokenId: decoded.accessTokenId,
      tokenFamily: decoded.tokenFamily,
    };

    next();
  } catch (err: any) {
    if (err instanceof AppError) {
      next(err);
    } else {
      logger.error('Authentication middleware failure', { error: err.message, stack: err.stack });
      next(new AppError(HttpStatus.UNAUTHORIZED, 'Authentication failed', 'UNAUTHORIZED'));
    }
  }
}

/**
 * Role-gate a route. Must run after requireAuth. Reads the role attached by
 * requireAuth (itself always freshly fetched from the DB, never from the JWT),
 * so a client cannot escalate privilege by editing a token's payload — the
 * signature would break, and even a legitimately-signed old token is checked
 * against the user's *current* DB role on every single request.
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    if (!user || !allowedRoles.includes(user.role)) {
      logger.warn('Authorization denied: insufficient role', { userId: user?.id, role: user?.role, required: allowedRoles });
      next(new AppError(HttpStatus.FORBIDDEN, 'You do not have permission to perform this action', 'FORBIDDEN'));
      return;
    }
    next();
  };
}
