import type { Metadata } from 'next';
import { CalendarRange, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Separator } from '@/components/ui/separator';

const CronTool = dynamic(
  () => import('@/components/cron/CronTool').then((m) => m.CronTool),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-12 bg-muted/20 border border-dashed rounded-xl">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

export const metadata: Metadata = {
  title: 'Cron Expression Generator & Parser',
  description:
    'Generate and parse cron expressions client-side. Translate standard cron schedules to human-readable sentences and estimate upcoming execution times.',
  alternates: { canonical: '/cron' },
};

export default function CronPage() {
  return (
    <div className="container py-6 md:py-8 max-w-5xl">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <CalendarRange className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Cron Expression Generator</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          A visual interface to build cron expression strings, translate them into descriptive English sentences, 
          and compute future execution schedules instantly.
        </p>
      </div>

      <Separator className="mb-6" />

      {/* Main tool container */}
      <CronTool />
    </div>
  );
}
