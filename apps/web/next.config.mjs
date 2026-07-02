import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Enable standalone output for Docker
  output: process.env.DOCKER_BUILD === '1' ? 'standalone' : undefined,

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob:",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self'",
              "connect-src 'self' " + (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'),
              "worker-src 'self' blob:",
            ].join('; '),
          },
        ],
      },
    ];
  },

  // Webpack customizations for Monaco Editor and workspace packages
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@devchrono/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    };
    return config;
  },

  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
