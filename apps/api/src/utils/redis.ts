import { Redis } from '@upstash/redis';
import { logger } from './logger';
import { getEnv } from './env';

const redisUrl = getEnv('UPSTASH_REDIS_REST_URL');
const redisToken = getEnv('UPSTASH_REDIS_REST_TOKEN');

export let redisClient: Redis | null = null;
export let isRedisHealthy = false;
export let redisStatusText = 'Disconnected';

if (redisUrl && redisToken) {
  try {
    redisClient = new Redis({
      url: redisUrl,
      token: redisToken,
    });
    redisStatusText = 'Initialized (Upstash)';
  } catch (err: any) {
    logger.error('Failed to instantiate Upstash Redis client', { error: err.message });
    redisStatusText = `Error: ${err.message}`;
  }
} else {
  redisStatusText = 'Fallback (Memory)';
  logger.warn('REDIS_URL / REDIS_TOKEN is not configured. Redis will run in-memory fallback mode.');
}

/**
 * Shared singleton instance of Upstash Redis client.
 * Import this anywhere in the API (e.g. `import { redis } from '../utils/redis'`)
 * without needing to create new client instances.
 */
export const redis = redisClient;

/**
 * Connect/ping check for the shared Redis client.
 */
export async function initRedis(): Promise<void> {
  if (!redisClient) {
    isRedisHealthy = false;
    return;
  }

  try {
    const pong = await redisClient.ping();
    if (pong === 'PONG' || pong) {
      isRedisHealthy = true;
      redisStatusText = 'Connected';
      logger.info('Upstash Redis connected and ready.');
    } else {
      isRedisHealthy = false;
      redisStatusText = 'Degraded (Unexpected ping response)';
    }
  } catch (err: any) {
    logger.error('Could not connect to Upstash Redis, running in memory-fallback state.', {
      error: err.message,
    });
    isRedisHealthy = false;
    redisStatusText = `Failed to connect: ${err.message}`;
  }
}

export async function closeRedis(): Promise<void> {
  logger.info('Upstash Redis connection closed.');
}
