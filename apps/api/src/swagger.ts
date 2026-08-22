import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DevKits Platform API',
      version: '2.0.0',
      description:
        'Production-grade developer utility platform: Code Studio & Sandbox, Gemini AI Code Assistant, Cloud Storage Vault, Temp Mail, Webhooks, Timestamp conversions, and JSON processing.',
      license: {
        name: 'MIT',
      },
    },
    servers: [
      { url: 'https://devchrono-api.onrender.com', description: 'Production API (Render)' },
      { url: 'https://api.devkits.space', description: 'Production API (Custom Domain)' },
      { url: 'http://localhost:3001', description: 'Development Localhost Server' },
    ],
    tags: [
      { name: 'System', description: 'System health, metrics, and runtime status' },
      { name: 'Sandbox', description: 'Code Studio — Multi-language isolated execution, Gemini AI, and Code Converter' },
      { name: 'Storage', description: 'Cloud Storage Vault — S3-compatible encrypted files, folders, notes & shares' },
      { name: 'Auth', description: 'Authentication, session JWTs, and secure user management' },
      { name: 'Time', description: 'Unix timestamp conversion & duration math endpoints' },
      { name: 'JSON', description: 'JSON validation, formatting, and minification endpoints' },
      { name: 'Email', description: 'Temporary disposable email inboxes & real-time webhook listeners' },
      { name: 'Webhook', description: 'Custom HTTP payload tester and endpoint inspector' },
      { name: 'Profile', description: 'User profile, settings, and avatars' },
      { name: 'Admin', description: 'Superadmin management operations' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Access token from POST /api/auth/login or /api/auth/register. Claims are encrypted — the token is opaque even though it is a standard verifiable JWT.',
        },
      },
    },
  },
  apis: [
    path.join(__dirname, 'routes/*.ts'),
    path.join(__dirname, 'routes/*.js'),
    './src/routes/*.ts',
    './dist/routes/*.js',
    './routes/*.js',
  ],
});

