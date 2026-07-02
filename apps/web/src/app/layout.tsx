import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { FloatingSupport } from '@/components/layout/FloatingSupport';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: 'DevChrono JSONLab — Epoch Converter & JSON Viewer',
    template: '%s | DevChrono JSONLab',
  },
  description:
    'Fast, privacy-first developer tools. Convert Unix timestamps, format and validate JSON. Client-side processing, no data collection.',
  keywords: ['epoch converter', 'unix timestamp', 'json viewer', 'json formatter', 'json validator', 'developer tools'],
  authors: [{ name: 'DevChrono JSONLab' }],
  creator: 'DevChrono JSONLab',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'DevChrono JSONLab — Epoch Converter & JSON Viewer',
    description: 'Fast, privacy-first developer tools for timestamps and JSON.',
    siteName: 'DevChrono JSONLab',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DevChrono JSONLab',
    description: 'Fast, privacy-first developer tools for timestamps and JSON.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
    },
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'DevChrono JSONLab',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Any (runs in browser)',
  description:
    'Fast, privacy-first developer tools: Unix timestamp / epoch converter and JSON viewer & formatter. All processing happens client-side.',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <FloatingSupport />
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
