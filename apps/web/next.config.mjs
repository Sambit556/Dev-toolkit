import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Optional LAN IP(s) (set via NEXT_PUBLIC_LAN_HOST in .env.local, machine-specific —
// not hardcoded here since this file is committed) for testing from other devices on
// the network, e.g. scanning the mobile-upload QR code from a phone. Comma-separated,
// since a laptop that moves between networks (home WiFi, office, a VPN adapter) picks
// up a different LAN IP each time — listing all of them avoids re-editing this on
// every switch. Stripped of any accidental scheme (e.g. someone pastes a full
// "https://host" here instead of a bare IP) — the CSP below always prepends its own
// "http://", so a leftover scheme would otherwise produce an invalid
// "http://https://host:3001" source that browsers silently drop.
const lanHosts = (process.env.NEXT_PUBLIC_LAN_HOST || '')
  .split(',')
  .map((h) => h.trim().replace(/^\w+:\/\//, ''))
  .filter(Boolean);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Enable standalone output for Docker
  output: process.env.DOCKER_BUILD === '1' ? 'standalone' : undefined,

  // Allows the Next.js dev server (HMR websocket, etc.) to accept requests when the
  // app is loaded via a LAN IP instead of localhost.
  ...(lanHosts.length ? { allowedDevOrigins: lanHosts } : {}),

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
              "img-src 'self' data: blob: https://images.unsplash.com https://*.amazonaws.com",
              "font-src 'self'",
              "connect-src 'self' " + (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') +
              lanHosts.map((h) => ` http://${h}:3001 http://${h}:4001`).join('') +
              " https://ipapi.co" +
              " https://ipwho.is" +
              " https://api.ipify.org" +
              " https://api.coingecko.com" +
              " https://speed.cloudflare.com" +
              " https://hacker-news.firebaseio.com" +
              " https://api.rss2json.com" +
              // S3 presigned upload/download URLs (Cloud Storage Vault multipart uploads)
              " https://*.amazonaws.com",
              "frame-src 'self' https://www.openstreetmap.org",
              "child-src 'self' https://www.openstreetmap.org",
              "worker-src 'self' blob:",
              // <video>/<audio> playing S3 presigned preview URLs — CSP does not fall
              // back from img-src to media-src, so without this it's silently blocked.
              "media-src 'self' blob: https://*.amazonaws.com",
              // Nothing in the app uses <object>/<embed>/<applet> — zero functional
              // impact, pure defense-in-depth hardening.
              "object-src 'none'",
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
