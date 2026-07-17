import { BackToHomeLink } from '@/components/layout/BackToHomeLink';
import type { Metadata } from 'next';
import { Timer } from 'lucide-react';
import { CountdownTool } from '@/components/countdown/CountdownTool';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'Countdown Timer & Stopwatch — Online Developer Clock',
  description:
    'Use our client-side countdown timer, visual progress indicator, presets, custom alarms, and high-precision stopwatch with lap logging.',
  alternates: { canonical: '/countdown' },
};

export default function CountdownPage() {
  return (
    <div className="container py-6 md:py-8 max-w-5xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <BackToHomeLink />
          <Timer className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Countdown & Stopwatch</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Set custom timers, use quick presets with alarm sounds, or track laps with a high-precision stopwatch directly in your browser.
        </p>
      </div>

      <Separator className="mb-6" />

      <CountdownTool />
    </div>
  );
}
