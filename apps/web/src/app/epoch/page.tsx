import type { Metadata } from 'next';
import { Clock, Timer, Calendar, Code2, Settings } from 'lucide-react';
import { LiveClock } from '@/components/epoch/LiveClock';
import { TimestampToDate } from '@/components/epoch/TimestampToDate';
import { DateToTimestamp } from '@/components/epoch/DateToTimestamp';
import { StartEndCalculator } from '@/components/epoch/StartEndCalculator';
import { DurationConverter } from '@/components/epoch/DurationConverter';
import { CodeExamples } from '@/components/epoch/CodeExamples';
import { EpochPreferences } from '@/components/epoch/EpochPreferences';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'Epoch Converter',
  description:
    'Convert Unix timestamps to human-readable dates and vice versa. Live epoch clock, timezone support, duration calculator, and code examples.',
  alternates: { canonical: '/epoch' },
};

export default function EpochPage() {
  return (
    <div className="container py-6 md:py-8 max-w-5xl">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Epoch Converter</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Convert Unix timestamps, work with timezones, calculate durations, and get code snippets for any language.
          All conversions happen in your browser — no data is sent to our servers.
        </p>
      </div>

      {/* Live clock - always visible */}
      <section className="mb-6">
        <LiveClock />
      </section>

      <Separator className="mb-6" />

      {/* Main tools */}
      <Tabs defaultValue="ts-to-date" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="ts-to-date" className="gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Timestamp → Date
          </TabsTrigger>
          <TabsTrigger value="date-to-ts" className="gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Date → Timestamp
          </TabsTrigger>
          <TabsTrigger value="start-end" className="gap-1.5">
            <Timer className="h-3.5 w-3.5" />
            Start / End
          </TabsTrigger>
          <TabsTrigger value="duration" className="gap-1.5">
            <Timer className="h-3.5 w-3.5" />
            HH:MM:SS:ms
          </TabsTrigger>
          <TabsTrigger value="code" className="gap-1.5">
            <Code2 className="h-3.5 w-3.5" />
            Code Examples
          </TabsTrigger>
          <TabsTrigger value="prefs" className="gap-1.5">
            <Settings className="h-3.5 w-3.5" />
            Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ts-to-date">
          <div className="rounded-lg border bg-card p-4 md:p-6 shadow-sm animate-fade-in">
            <h2 className="text-base font-semibold mb-4">Convert Timestamp to Date</h2>
            <TimestampToDate />
          </div>
        </TabsContent>

        <TabsContent value="date-to-ts">
          <div className="rounded-lg border bg-card p-4 md:p-6 shadow-sm animate-fade-in">
            <h2 className="text-base font-semibold mb-4">Convert Date to Timestamp</h2>
            <DateToTimestamp />
          </div>
        </TabsContent>

        <TabsContent value="start-end">
          <div className="rounded-lg border bg-card p-4 md:p-6 shadow-sm animate-fade-in">
            <h2 className="text-base font-semibold mb-1">Start / End Boundaries</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Find the start and end timestamps for a day, month, or year.
            </p>
            <StartEndCalculator />
          </div>
        </TabsContent>

        <TabsContent value="duration">
          <div className="rounded-lg border bg-card p-4 md:p-6 shadow-sm animate-fade-in">
            <h2 className="text-base font-semibold mb-1">Duration — HH:MM:SS:mmm</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Convert durations to/from milliseconds, and add or subtract multiple durations at once.
            </p>
            <DurationConverter />
          </div>
        </TabsContent>

        <TabsContent value="code">
          <div className="rounded-lg border bg-card p-4 md:p-6 shadow-sm animate-fade-in">
            <h2 className="text-base font-semibold mb-1">Code Examples</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Ready-to-use code snippets for working with Unix timestamps in popular languages.
            </p>
            <CodeExamples />
          </div>
        </TabsContent>

        <TabsContent value="prefs">
          <div className="rounded-lg border bg-card p-4 md:p-6 shadow-sm animate-fade-in">
            <h2 className="text-base font-semibold mb-1">Preferences</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Customize default settings. Saved to your browser — no account required.
            </p>
            <EpochPreferences />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
