import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock, Braces, Zap, Shield, Globe, ChevronRight, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RecentHistory } from '@/components/home/RecentHistory';

export const metadata: Metadata = {
  title: 'DevChrono JSONLab — Developer Time & JSON Toolkit',
};

const TOOLS = [
  {
    href: '/epoch',
    icon: Clock,
    title: 'Epoch Converter',
    description:
      'Convert Unix timestamps to readable dates and back. Live clock, timezone support, duration calculator, and code examples for 7 languages.',
    features: ['Live Unix clock', 'Auto-detect unit', 'IANA timezone support', '7 code examples'],
    color: 'blue',
    badge: 'Timestamp',
  },
  {
    href: '/json',
    icon: Braces,
    title: 'JSON Viewer',
    description:
      'Format, validate, and explore JSON with syntax highlighting and interactive tree view. Convert to TypeScript, CSV, and more.',
    features: ['Interactive tree view', 'Format & minify', 'TypeScript generator', 'Large file support'],
    color: 'green',
    badge: 'JSON',
  },
];

const FEATURES = [
  {
    icon: Zap,
    title: 'Blazing Fast',
    description: 'All operations run client-side in your browser with no network latency.',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'Your data never leaves your browser. No logging, no tracking, no ads.',
  },
  {
    icon: Globe,
    title: 'Offline Ready',
    description: 'Works without internet. Fully installable as a Progressive Web App.',
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-background to-muted/20">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-gradient-to-tr from-blue-500/20 via-purple-500/10 to-transparent blur-3xl"
        />
        <div className="container py-16 md:py-24 text-center max-w-3xl mx-auto relative animate-fade-in">
          <Badge variant="secondary" className="mb-4 text-xs">
            Developer Toolkit
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
            Developer{' '}
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-500 bg-clip-text text-transparent">
              Time & JSON
            </span>{' '}
            Toolkit
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-xl mx-auto">
            Fast, private, accurate. Convert timestamps and explore JSON without compromising your data.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/epoch">
                <Clock className="h-4 w-4 mr-2" />
                Epoch Converter
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/json">
                <Braces className="h-4 w-4 mr-2" />
                JSON Viewer
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Tools */}
      <section className="container py-12 md:py-16">
        <h2 className="text-2xl font-bold text-center mb-8">Choose Your Tool</h2>
        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          {TOOLS.map(({ href, icon: Icon, title, description, features, color, badge }) => (
            <Link key={href} href={href} className="group">
              <Card className="h-full transition-all duration-200 hover:shadow-lg hover:border-primary/50 group-hover:-translate-y-0.5">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                        color === 'blue'
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className="text-xs">{badge}</Badge>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-1">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                  </div>

                  <ul className="space-y-1">
                    {features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center text-sm font-medium text-primary group-hover:gap-2 gap-1 transition-all">
                    Open {title}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/20">
        <div className="container py-10 md:py-14">
          <div className="grid gap-6 sm:grid-cols-3 max-w-3xl mx-auto">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex flex-col items-center text-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-sm">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent History */}
      <section className="container py-10">
        <RecentHistory />
      </section>
    </div>
  );
}
