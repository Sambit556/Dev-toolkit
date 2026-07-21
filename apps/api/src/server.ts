import app from './app';
import { logger } from './utils/logger';
import { initDb, closeDb } from './utils/db';
import { initS3 } from './utils/s3';
import { initRedis, closeRedis } from './utils/session';
import { getEnv, getEnvWithDefault } from './utils/env';

const PORT = parseInt(getEnvWithDefault('PORT', '3001'), 10);
const HOST = getEnvWithDefault('HOST', '0.0.0.0');

async function bootstrap() {
  logger.info('System starting in deferred-initialization mode...');

  const server = app.listen(PORT, HOST, () => {
     logger.info(`DevChrono JSONLab API running`, {
       url: `http://${HOST}:${PORT}`,
       docs: `http://${HOST}:${PORT}/docs`,
       health: `http://${HOST}:${PORT}/health`,
       env: getEnvWithDefault('NODE_ENV', 'development'),
     });
   });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received - shutting down gracefully`);
    
    server.close(async () => {
      logger.info('HTTP server closed. Cleaning up resources...');
      try {
        await closeDb();
      } catch (err: any) {
        logger.error('Failed to close DB pool cleanly', { error: err.message });
      }
      try {
        await closeRedis();
      } catch (err: any) {
        logger.error('Failed to close Redis connection cleanly', { error: err.message });
      }
      logger.info('Graceful shutdown completed successfully.');
      process.exit(0);
    });

    // Forced shutdown fallback
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason });
  process.exit(1);
});

bootstrap();

