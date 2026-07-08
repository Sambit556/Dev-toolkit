import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DevPulse Hub — Tech News, Markets & Live Dashboard',
  description:
    'Your real-time developer terminal: Hacker News top stories, Google News tech feed, live crypto prices (BTC/ETH/SOL), stock market data, and local weather — all in one offline-ready dashboard.',
  keywords: [
    'developer news',
    'hacker news',
    'google news tech',
    'crypto prices',
    'bitcoin price',
    'ethereum price',
    'stock market',
    'developer dashboard',
    'tech feed',
    'devpulse',
  ],
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'DevPulse Hub — Tech News, Crypto & Live Markets',
    description:
      'Real-time Hacker News, Google News, crypto & stock tickers, and local weather in one privacy-first developer dashboard.',
    url: '/blog',
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
