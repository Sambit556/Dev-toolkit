import { Router, Request, Response } from 'express';
import { version } from '../../package.json';
import { renderHealthPage } from './healthPage';
import { isDbHealthy, dbErrorDetails, initDb } from '../utils/db';
import { isS3Healthy, s3ErrorDetails, initS3 } from '../utils/s3';
import { isRedisHealthy, redisStatusText, initRedis } from '../utils/session';

const router = Router();

const startTime = Date.now();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Startup health check endpoint
 *     description: Returns JSON checking status of Database, S3, Session, JWT and environment variables.
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Health check results
 */
import { getEnv } from '../utils/env';

router.get('/', (req: Request, res: Response) => {
  const jwtConfigured = !!(getEnv('JWT_SECRET') && getEnv('JWT_REFRESH_SECRET'));
  const hasDbConfig = !!getEnv('DATABASE_URL') || !!(getEnv('DB_HOST') && getEnv('DB_USER') && getEnv('DB_NAME'));
  const hasS3Config = !!(getEnv('S3_BUCKET') || getEnv('AWS_S3_BUCKET'));
  const envVarsValid = hasDbConfig && hasS3Config;

  const status = isDbHealthy && isS3Healthy && jwtConfigured ? 'ok' : 'degraded';

  const snapshot = {
    status,
    database: isDbHealthy ? 'healthy' : 'unhealthy',
    storage: isS3Healthy ? 'healthy' : 'unhealthy',
    authentication: jwtConfigured ? 'healthy' : 'unhealthy',
    redis: isRedisHealthy ? 'connected' : 'memory_fallback',
    env: envVarsValid ? 'valid' : 'invalid',
    version,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
    details: {
      dbError: dbErrorDetails || undefined,
      s3Error: s3ErrorDetails || undefined,
      redisStatus: redisStatusText,
    },
  };

  if (req.accepts(['json', 'html']) === 'html') {
    res.type('html').send(renderHealthPage(snapshot));
    return;
  }

  // Exact format required by user prompt:
  res.json({
    database: snapshot.database,
    storage: snapshot.storage,
    authentication: snapshot.authentication,
    version: snapshot.version,
  });
});

let isBackendInitialized = false;

/**
 * @openapi
 * /health/api:
 *   post:
 *     summary: Initializes backend connections manually
 *     description: Connects to DB, S3, and Redis. Safe to call multiple times.
 *     tags: [System]
 */
router.post('/api', async (req: Request, res: Response) => {
  if (isBackendInitialized) {
    res.json({ success: true, message: 'Backend already initialized' });
    return;
  }
  
  try {
    await initDb();
    await initS3();
    await initRedis();
    isBackendInitialized = true;
    res.json({ success: true, message: 'Initialized successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
