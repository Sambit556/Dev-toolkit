import swaggerJsdoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DevChrono JSONLab API',
      version: '1.0.0',
      description: 'Production-grade REST API for timestamp conversion and JSON utilities',
      license: {
        name: 'MIT',
      },
    },
    servers: [
      { url: 'http://localhost:3001', description: 'Development' },
      { url: 'https://api.devchrono.app', description: 'Production' },
    ],
    tags: [
      { name: 'System', description: 'System health and status' },
      { name: 'Time', description: 'Unix timestamp conversion endpoints' },
      { name: 'JSON', description: 'JSON validation and formatting endpoints' },
      { name: 'Auth', description: 'Authentication, session, and password management' },
      { name: 'Storage', description: 'Cloud Storage Vault — files, folders, notes, uploads, sharing' },
      { name: 'Admin', description: 'Superadmin-only user management' },
      { name: 'Profile', description: 'Authenticated user’s own profile and avatar' },
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
  apis: ['./src/routes/*.ts'],
});
