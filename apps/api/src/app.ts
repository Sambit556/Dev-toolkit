import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';

import { requestLogger } from './middleware/requestLogger';
import { defaultRateLimit } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import healthRouter from './routes/health';
import timeRouter from './routes/time';
import jsonRouter from './routes/json';
import httpInspectRouter from './routes/httpInspect';
import webhookRouter from './routes/webhook';
import { swaggerSpec } from './swagger';
import { logger } from './utils/logger';

const app = express();

// Trust proxy (for accurate IP behind load balancer)
app.set('trust proxy', 1);

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

// CORS
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:4001')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  }),
);

// Compression
app.use(compression());

// Body parsing
const defaultLimit = process.env.BODY_LIMIT_DEFAULT || '1mb';
const jsonLimit = process.env.BODY_LIMIT_JSON || '10mb';

app.use('/api/json', express.json({ limit: jsonLimit }));
app.use(express.json({ limit: defaultLimit }));
app.use(express.urlencoded({ extended: false, limit: defaultLimit }));

// Request logging
app.use(requestLogger);

// Global rate limiting
app.use(defaultRateLimit);

// API Documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'DevChrono JSONLab - API Docs',
}));

// Routes
app.use('/health', healthRouter);
app.use('/api/time', timeRouter);
app.use('/api/json', jsonRouter);
app.use('/api/http-inspect', httpInspectRouter);
app.use('/api/webhook', webhookRouter);

// OpenAPI JSON spec
app.get('/openapi.json', (_req, res) => res.json(swaggerSpec));

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

logger.info('Express app configured');

export default app;
