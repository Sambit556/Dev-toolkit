import { createClient, RedisClientType } from 'redis';
import { logger } from './logger';

export interface SessionData {
  userId: string;
  email: string;
  tokenFamily: string;
  refreshToken: string;
  deviceInfo?: string;
  expiresAt: string; // ISO string
}

import { getEnv } from './env';

const redisUrl = getEnv('REDIS_URL');

export let redisClient: RedisClientType | null = null;
export let isRedisHealthy = false;
export let redisStatusText = 'Disconnected';

// In-Memory Fallback Store
const memorySessions = new Map<string, SessionData>();
const memoryUserSessions = new Map<string, Set<string>>(); // userId -> Set of accessTokenIds

if (redisUrl) {
  redisClient = createClient({
    url: redisUrl,
    socket: {
      connectTimeout: 3000,
      reconnectStrategy: (retries) => {
        if (retries > 5) {
          logger.error('Redis reconnection max retries reached. Switching to memory fallback.');
          isRedisHealthy = false;
          redisStatusText = 'Fallback (Redis offline)';
          return false; // Stop reconnecting
        }
        logger.warn(`Redis reconnecting... Attempt ${retries}`);
        return Math.min(retries * 500, 2000);
      },
    },
  }) as RedisClientType;

  redisClient.on('error', (err) => {
    logger.error('Redis Client Error', { error: err.message });
    isRedisHealthy = false;
    redisStatusText = `Error: ${err.message}`;
  });

  redisClient.on('connect', () => {
    logger.info('Redis Client connecting...');
  });

  redisClient.on('ready', () => {
    logger.info('Redis Client connected and ready.');
    isRedisHealthy = true;
    redisStatusText = 'Connected';
  });
} else {
  redisStatusText = 'Fallback (Memory)';
  logger.warn('REDIS_URL is not configured. Session manager will run in-memory mode.');
}

export async function initRedis(): Promise<void> {
  if (!redisClient) {
    isRedisHealthy = false;
    return;
  }

  try {
    await redisClient.connect();
  } catch (err: any) {
    logger.error('Could not connect to Redis, running in memory-fallback state.', {
      error: err.message,
    });
    isRedisHealthy = false;
    redisStatusText = `Failed to connect: ${err.message}`;
  }
}

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
      await redisClient.setEx(key, ttlSeconds, JSON.stringify(sessionData));
      await redisClient.sAdd(userKey, accessTokenId);
      // Set expiration on the user set as well
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
        return JSON.parse(data) as SessionData;
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
        await redisClient.sRem(userKey, accessTokenId);
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
      const sessionIds = await redisClient.sMembers(userKey);
      for (const id of sessionIds) {
        await redisClient.del(`session:${id}`);
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
// Bridges the server-side Google OAuth callback (which can only respond with a
// redirect, not JSON) to the frontend: the callback stashes the freshly-issued
// session tokens under a short-lived, single-use random code and redirects the
// browser with just that code in the URL — never the real JWTs — then the
// frontend immediately trades it for the tokens via POST. Same Redis-with-
// in-memory-fallback shape as setSession/getSession/revokeSession above.
const memoryOAuthExchanges = new Map<string, { data: unknown; timeout: ReturnType<typeof setTimeout> }>();

export async function stashOAuthExchange(code: string, data: unknown, ttlSeconds: number): Promise<void> {
  if (isRedisHealthy && redisClient) {
    try {
      await redisClient.setEx(`oauth:exchange:${code}`, ttlSeconds, JSON.stringify(data));
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
      const data = await redisClient.getDel(`oauth:exchange:${code}`);
      return data ? (JSON.parse(data) as T) : null;
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

export async function closeRedis(): Promise<void> {
  if (redisClient && isRedisHealthy) {
    logger.info('Disconnecting Redis client...');
    try {
      await redisClient.quit();
    } catch (err: any) {
      logger.error('Failed to cleanly disconnect Redis client', { error: err.message });
    }
  }
}
