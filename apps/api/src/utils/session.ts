import { logger } from './logger';
import { redisClient, isRedisHealthy, redisStatusText, initRedis, closeRedis, redis } from './redis';

export { redisClient, isRedisHealthy, redisStatusText, initRedis, closeRedis, redis };

export interface SessionData {
  userId: string;
  email: string;
  tokenFamily: string;
  refreshToken: string;
  deviceInfo?: string;
  expiresAt: string; // ISO string
}

// In-Memory Fallback Store
const memorySessions = new Map<string, SessionData>();
const memoryUserSessions = new Map<string, Set<string>>(); // userId -> Set of accessTokenIds

// Session store operations
export async function setSession(
  accessTokenId: string,
  sessionData: SessionData,
  ttlSeconds: number
): Promise<void> {
  if (isRedisHealthy && redisClient) {
    try {
      const key = `session:${accessTokenId}`;
      const userKey = `user:sessions:${sessionData.userId}`;
      await redisClient.set(key, JSON.stringify(sessionData), { ex: ttlSeconds });
      await redisClient.sadd(userKey, accessTokenId);
      await redisClient.expire(userKey, ttlSeconds * 2);
      return;
    } catch (err: any) {
      logger.error('Redis setSession failed, using memory fallback', { error: err.message });
    }
  }

  // Memory fallback
  memorySessions.set(accessTokenId, sessionData);
  if (!memoryUserSessions.has(sessionData.userId)) {
    memoryUserSessions.set(sessionData.userId, new Set());
  }
  memoryUserSessions.get(sessionData.userId)!.add(accessTokenId);

  // Set timeout to clear memory session
  setTimeout(() => {
    memorySessions.delete(accessTokenId);
    const userSet = memoryUserSessions.get(sessionData.userId);
    if (userSet) {
      userSet.delete(accessTokenId);
      if (userSet.size === 0) memoryUserSessions.delete(sessionData.userId);
    }
  }, ttlSeconds * 1000);
}

export async function getSession(accessTokenId: string): Promise<SessionData | null> {
  if (isRedisHealthy && redisClient) {
    try {
      const key = `session:${accessTokenId}`;
      const data = await redisClient.get(key);
      if (data) {
        if (typeof data === 'string') {
          return JSON.parse(data) as SessionData;
        }
        return data as SessionData;
      }
      return null;
    } catch (err: any) {
      logger.error('Redis getSession failed, checking memory fallback', { error: err.message });
    }
  }

  return memorySessions.get(accessTokenId) || null;
}

export async function revokeSession(accessTokenId: string): Promise<void> {
  const session = await getSession(accessTokenId);

  if (isRedisHealthy && redisClient) {
    try {
      const key = `session:${accessTokenId}`;
      await redisClient.del(key);
      if (session) {
        const userKey = `user:sessions:${session.userId}`;
        await redisClient.srem(userKey, accessTokenId);
      }
      return;
    } catch (err: any) {
      logger.error('Redis revokeSession failed, trying memory fallback', { error: err.message });
    }
  }

  // Memory fallback
  memorySessions.delete(accessTokenId);
  if (session) {
    const userSet = memoryUserSessions.get(session.userId);
    if (userSet) {
      userSet.delete(accessTokenId);
      if (userSet.size === 0) memoryUserSessions.delete(session.userId);
    }
  }
}

export async function revokeUserSessions(userId: string): Promise<void> {
  if (isRedisHealthy && redisClient) {
    try {
      const userKey = `user:sessions:${userId}`;
      const sessionIds = await redisClient.smembers(userKey);
      if (Array.isArray(sessionIds) && sessionIds.length > 0) {
        const keys = sessionIds.map((id) => `session:${id}`);
        await redisClient.del(...keys);
      }
      await redisClient.del(userKey);
      return;
    } catch (err: any) {
      logger.error('Redis revokeUserSessions failed, trying memory fallback', { error: err.message });
    }
  }

  // Memory fallback
  const sessionIds = memoryUserSessions.get(userId);
  if (sessionIds) {
    for (const id of sessionIds) {
      memorySessions.delete(id);
    }
    memoryUserSessions.delete(userId);
  }
}

// --- One-time OAuth exchange codes -------------------------------------------
const memoryOAuthExchanges = new Map<string, { data: unknown; timeout: ReturnType<typeof setTimeout> }>();

export async function stashOAuthExchange(code: string, data: unknown, ttlSeconds: number): Promise<void> {
  if (isRedisHealthy && redisClient) {
    try {
      await redisClient.set(`oauth:exchange:${code}`, JSON.stringify(data), { ex: ttlSeconds });
      return;
    } catch (err: any) {
      logger.error('Redis stashOAuthExchange failed, using memory fallback', { error: err.message });
    }
  }

  const timeout = setTimeout(() => memoryOAuthExchanges.delete(code), ttlSeconds * 1000);
  memoryOAuthExchanges.set(code, { data, timeout });
}

export async function consumeOAuthExchange<T>(code: string): Promise<T | null> {
  if (isRedisHealthy && redisClient) {
    try {
      const key = `oauth:exchange:${code}`;
      const data = await redisClient.get(key);
      if (data) {
        await redisClient.del(key);
        return typeof data === 'string' ? (JSON.parse(data) as T) : (data as T);
      }
      return null;
    } catch (err: any) {
      logger.error('Redis consumeOAuthExchange failed, checking memory fallback', { error: err.message });
    }
  }

  const entry = memoryOAuthExchanges.get(code);
  if (!entry) return null;
  clearTimeout(entry.timeout);
  memoryOAuthExchanges.delete(code);
  return entry.data as T;
}

// --- Superadmin password-change OTP ------------------------------------------
export interface PasswordOtpRecord {
  otpHash: string;
  attempts: number;
  expiresAt: number; // epoch ms
}

const memoryPasswordOtps = new Map<string, { data: PasswordOtpRecord; timeout: ReturnType<typeof setTimeout> }>();

function passwordOtpKey(userId: string): string {
  return `otp:password-change:${userId}`;
}

export async function setPasswordChangeOtp(userId: string, otpHash: string, ttlSeconds: number): Promise<void> {
  const key = passwordOtpKey(userId);
  const record: PasswordOtpRecord = { otpHash, attempts: 0, expiresAt: Date.now() + ttlSeconds * 1000 };

  if (isRedisHealthy && redisClient) {
    try {
      await redisClient.set(key, JSON.stringify(record), { ex: ttlSeconds });
      return;
    } catch (err: any) {
      logger.error('Redis setPasswordChangeOtp failed, using memory fallback', { error: err.message });
    }
  }

  const existing = memoryPasswordOtps.get(key);
  if (existing) clearTimeout(existing.timeout);
  const timeout = setTimeout(() => memoryPasswordOtps.delete(key), ttlSeconds * 1000);
  memoryPasswordOtps.set(key, { data: record, timeout });
}

export async function getPasswordChangeOtp(userId: string): Promise<PasswordOtpRecord | null> {
  const key = passwordOtpKey(userId);
  let record: PasswordOtpRecord | null = null;

  if (isRedisHealthy && redisClient) {
    try {
      const data = await redisClient.get(key);
      if (data) {
        record = typeof data === 'string' ? (JSON.parse(data) as PasswordOtpRecord) : (data as PasswordOtpRecord);
      }
    } catch (err: any) {
      logger.error('Redis getPasswordChangeOtp failed, checking memory fallback', { error: err.message });
    }
  }
  if (!record) record = memoryPasswordOtps.get(key)?.data ?? null;

  if (record && record.expiresAt < Date.now()) return null;
  return record;
}

export async function recordFailedPasswordChangeOtpAttempt(userId: string): Promise<number> {
  const record = await getPasswordChangeOtp(userId);
  if (!record) return 0;

  record.attempts += 1;
  const key = passwordOtpKey(userId);
  const remainingSeconds = Math.max(1, Math.ceil((record.expiresAt - Date.now()) / 1000));

  if (isRedisHealthy && redisClient) {
    try {
      await redisClient.set(key, JSON.stringify(record), { ex: remainingSeconds });
      return record.attempts;
    } catch (err: any) {
      logger.error('Redis recordFailedPasswordChangeOtpAttempt failed, using memory fallback', { error: err.message });
    }
  }

  const existing = memoryPasswordOtps.get(key);
  if (existing) clearTimeout(existing.timeout);
  const timeout = setTimeout(() => memoryPasswordOtps.delete(key), remainingSeconds * 1000);
  memoryPasswordOtps.set(key, { data: record, timeout });
  return record.attempts;
}

export async function clearPasswordChangeOtp(userId: string): Promise<void> {
  const key = passwordOtpKey(userId);
  if (isRedisHealthy && redisClient) {
    try {
      await redisClient.del(key);
    } catch (err: any) {
      logger.error('Redis clearPasswordChangeOtp failed', { error: err.message });
    }
  }
  const existing = memoryPasswordOtps.get(key);
  if (existing) {
    clearTimeout(existing.timeout);
    memoryPasswordOtps.delete(key);
  }
}
