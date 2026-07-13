import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { FloatingSupport } from '@/components/layout/FloatingSupport';
import { Toaster } from '@/components/ui/sonner';
import { LocalizationProvider } from '@/context/LocalizationContext';
import { HexCanvasBg } from '@/components/layout/HexCanvasBg';
import { StickyNotes } from '@/components/layout/StickyNotes';
import { QuickAccess } from '@/components/layout/QuickAccess';
import { TooltipProvider } from '@/components/ui/tooltip';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.devkits.space';
const APP_NAME = 'DevKits';
const APP_DESCRIPTION =
  'Fast, privacy-first developer tools — all processing runs client-side in your browser. Convert Unix timestamps, format & validate JSON, decode JWT tokens, calculate EMIs, generate UUIDs & ULIDs, convert YAML, pick colors, test internet speed, and more.';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `${APP_NAME} — Premium Developer Utility Suite`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
  },
  keywords: [
    'developer tools',
    'utility suite',
    'epoch converter',
    'unix timestamp',
    'json viewer',
    'json formatter',
    'jwt decoder',
    'jwt encoder',
    'uuid generator',
    'ulid generator',
    'cron expression builder',
    'currency exchanger',
    'unit converter',
    'color picker',
    'wcag contrast',
    'image compressor',
    'base64 encoder',
    'yaml json converter',
    'emi calculator',
    'salary calculator',
    'internet speed test',
    'ip geolocation',
    'csv to json',
    'markdown to html',
    'offline developer tools',
    'privacy first dev tools',
    'client side tools',
    'pwa developer toolkit',
    'free developer utilities',
  ],
  authors: [{ name: APP_NAME, url: APP_URL }],
  creator: APP_NAME,
  publisher: APP_NAME,
  category: 'technology',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: APP_URL,
    siteName: APP_NAME,
    title: `${APP_NAME} — Premium Developer Utility Suite`,
    description: APP_DESCRIPTION,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'DevToolkit — 16 privacy-first developer utilities',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@devtoolkitapp',
    creator: '@devtoolkitapp',
    title: `${APP_NAME} — Developer Utility Suite`,
    description: APP_DESCRIPTION,
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_NAME,
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: APP_NAME,
  url: APP_URL,
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Any (runs in browser)',
  browserRequirements: 'Requires a modern browser with JavaScript enabled',
  description: APP_DESCRIPTION,
  inLanguage: 'en',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  featureList: [
    'Epoch & Unix Timestamp Converter',
    'JSON Viewer & Formatter',
    'JWT Decoder & Encoder',
    'UUID / ULID / NanoID Generator',
    'Cron Expression Builder',
    'Unit Converter (10 categories)',
    'Color Picker & WCAG Contrast Checker',
    'Encoder / Decoder (Base64, Hex, URL, Morse)',
    'EMI, Salary & Age Calculators',
    'YAML ↔ JSON Converter',
    'Image Compressor & Enhancer',
    'CSV / XML / Markdown / PDF Converters',
    'Currency Exchanger with Live Rates',
    'IP & Identity Intelligence',
    'Internet Speed Tester',
    'Client-Side File Converter',
  ],
  screenshot: `${APP_URL}/og-image.png`,
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  colorScheme: 'light dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <script
          type="application/ld+json"
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
          <LocalizationProvider>
            <TooltipProvider delayDuration={200}>
              <HexCanvasBg />
              <Header />
              <main className="flex-1 relative z-10 w-full overflow-x-hidden">{children}</main>
              <Footer />
              <FloatingSupport />
              <StickyNotes />
              <QuickAccess />
              <Toaster richColors position="bottom-right" />
            </TooltipProvider>
          </LocalizationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
