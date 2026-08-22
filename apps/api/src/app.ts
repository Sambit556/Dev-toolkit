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
import authRouter from './routes/auth';
import storageRouter from './routes/storage';
import adminRouter from './routes/admin';
import profileRouter from './routes/profile';
import timeRouter from './routes/time';
import jsonRouter from './routes/json';
import httpInspectRouter from './routes/httpInspect';
import webhookRouter from './routes/webhook';
import emailRouter from './routes/email';
import tempmailRouter from './routes/tempmail';
import sandboxRouter from './routes/sandbox';
import { swaggerSpec } from './swagger';
import { logger } from './utils/logger';
import { getEnvWithDefault } from './utils/env';

const app = express();

// Trust proxy (for accurate IP behind load balancer)
app.set('trust proxy', 1);

// Security headers (permissive for Swagger UI docs and developer tools)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://cdnjs.cloudflare.com', 'https://cdn.jsdelivr.net'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com', 'https://cdn.jsdelivr.net', 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", '*'],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

// CORS
const allowedOrigins = getEnvWithDefault('CORS_ORIGIN', 'http://localhost:4001')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow any origin for public docs/spec or when '*' is allowed or matched
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  }),
);

// Compression
app.use(compression());

// Body parsing
const defaultLimit = getEnvWithDefault('BODY_LIMIT_DEFAULT', '1mb');
const jsonLimit = getEnvWithDefault('BODY_LIMIT_JSON', '10mb');

app.use('/api/json', express.json({ limit: jsonLimit }));
// Webhook capture must read the exact bytes sent, for any content type —
// mounted ahead of the JSON/urlencoded parsers below so they never touch
// (and drain) this route's request stream first.
app.use('/api/webhook/capture', express.raw({ type: () => true, limit: '1mb' }));
app.use(express.json({ limit: defaultLimit }));
app.use(express.urlencoded({ extended: false, limit: defaultLimit }));

// Request logging
app.use(requestLogger);

// Global rate limiting
app.use(defaultRateLimit);

// Public API Documentation (Freely accessible in development and production with zero restrictions)
app.use(
  '/docs',
  (_req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    next();
  },
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss:
      '.swagger-ui .topbar { display: none } .swagger-ui .info { margin: 20px 0 } .swagger-ui .scheme-container { margin: 15px 0 }',
    customSiteTitle: 'DevKits Platform - Public API Docs',
    customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.min.js',
    ],
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
      url: '/openapi.json',
    },
  }),
);

// Routes
app.use('/health', healthRouter);
// Same handler, second path — kept for the browser-side status widget. Some
// privacy/ad-block extensions pattern-match "health" in a URL and silently
// drop the request (ERR_BLOCKED_BY_CLIENT) even though the API and CORS are
// both fine; /api/status sidesteps that without touching Render's own
// healthCheckPath, which must stay pointed at /health.
app.use('/api/status', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/storage', storageRouter);
app.use('/api/backoffice', adminRouter);
app.use('/api/emails', emailRouter);
app.use('/api/profile', profileRouter);
app.use('/api/time', timeRouter);
app.use('/api/json', jsonRouter);
app.use('/api/http-inspect', httpInspectRouter);
app.use('/api/webhook', webhookRouter);
app.use('/api/tempmail', tempmailRouter);
app.use('/api/sandbox', sandboxRouter);

// Public OpenAPI JSON spec
app.get('/openapi.json', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.get('host') || 'localhost:3001';
  const dynamicServerUrl = `${protocol}://${host}`;
  const isProd = process.env.NODE_ENV === 'production' || !host.includes('localhost');

  const dynamicSpec = {
    ...swaggerSpec,
    servers: [
      {
        url: dynamicServerUrl,
        description: isProd ? 'Production API Server' : 'Local Development Server',
      },
    ],
  };

  res.json(dynamicSpec);
});

// Root — Render's uptime pings and other health probes hit this by default
app.get('/', (_req, res) => {
  res.json({
    name: 'DevKits Platform API',
    version: '2.0.0',
    docs: '/docs',
    openapi: '/openapi.json',
    health: '/health',
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

logger.info('Express app configured');

export default app;
