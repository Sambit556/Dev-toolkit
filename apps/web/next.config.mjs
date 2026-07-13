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
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob:",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://images.unsplash.com",
              "font-src 'self'",
              "connect-src 'self' " + (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') +
              " https://ipapi.co" +
              " https://ipwho.is" +
              " https://api.ipify.org" +
              " https://api.coingecko.com" +
              " https://speed.cloudflare.com" +
              " https://hacker-news.firebaseio.com" +
              " https://api.rss2json.com",
              "frame-src 'self' https://www.openstreetmap.org",
              "child-src 'self' https://www.openstreetmap.org",
              "worker-src 'self' blob:",
            ].join('; '),
          },
        ],
      },
    ];
  },

  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
