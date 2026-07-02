import app from './app';
import { logger } from './utils/logger';

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  logger.info(`DevChrono JSONLab API running`, {
    url: `http://${HOST}:${PORT}`,
    docs: `http://${HOST}:${PORT}/docs`,
    health: `http://${HOST}:${PORT}/health`,
    env: process.env.NODE_ENV,
  });
});

// Graceful shutdown
const shutdown = (signal: string) => {
  logger.info(`${signal} received - shutting down gracefully`);
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason });
  process.exit(1);
});

export default server;
