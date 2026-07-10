import type { MetadataRoute } from 'next';

const TOOL_ROUTES = [
  '/epoch',
  '/json',
  '/jwt',
  '/cron',
  '/unit-converter',
  '/color-picker',
  '/encoder-decoder',
  '/calculator',
  '/image-tool',
  '/converters',
  '/currency',
  '/ip-intel',
  '/speed-test',
  '/file-converter',
  '/text-utils',
  '/diff-checker',
  '/countdown',
  '/lorem-ipsum',
  '/security-tools',
  '/qr-barcode',
  '/pdf-tools',
  '/html-preview',
  '/fake-address',
  '/fun-tools',
  '/blog',
  '/support',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://www.devkits.space';

  const home = {
    url: base,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 1.0,
  };

  const toolPages = TOOL_ROUTES.map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '/blog' || route === '/support' ? 0.6 : 0.85,
  }));

  return [home, ...toolPages];
}
