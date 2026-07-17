import { BackToHomeLink } from '@/components/layout/BackToHomeLink';
import type { Metadata } from 'next';
import { Clock, Timer, Calendar, Code2, Settings, Calculator } from 'lucide-react';
import { LiveClock } from '@/components/epoch/LiveClock';
import { TimestampToDate } from '@/components/epoch/TimestampToDate';
import { DateToTimestamp } from '@/components/epoch/DateToTimestamp';
import { StartEndCalculator } from '@/components/epoch/StartEndCalculator';
import { DurationBuilder, DurationArithmetic } from '@/components/epoch/DurationConverter';
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
          <BackToHomeLink />
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
      <Tabs defaultValue="ts-to-date" className="flex flex-col md:grid md:grid-cols-4 gap-6 space-y-0">
        <TabsList className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible overflow-y-hidden md:overflow-y-auto h-auto w-full justify-start items-stretch bg-muted p-1 gap-1 md:h-fit shrink-0 scrollbar-none flex-nowrap whitespace-nowrap md:p-1.5 md:rounded-xl">
          <TabsTrigger value="ts-to-date" className="gap-1.5 justify-start px-3 py-2 md:py-2.5">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Timestamp → Date</span>
          </TabsTrigger>
          <TabsTrigger value="date-to-ts" className="gap-1.5 justify-start px-3 py-2 md:py-2.5">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Date → Timestamp</span>
          </TabsTrigger>
          <TabsTrigger value="duration" className="gap-1.5 justify-start px-3 py-2 md:py-2.5">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">HH:MM:SS:ms</span>
          </TabsTrigger>
          <TabsTrigger value="timer-calc" className="gap-1.5 justify-start px-3 py-2 md:py-2.5">
            <Calculator className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Timer Add / Subtract</span>
          </TabsTrigger>
          <TabsTrigger value="start-end" className="gap-1.5 justify-start px-3 py-2 md:py-2.5">
            <Timer className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Start / End</span>
          </TabsTrigger>
          <TabsTrigger value="code" className="gap-1.5 justify-start px-3 py-2 md:py-2.5">
            <Code2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Code Examples</span>
          </TabsTrigger>
          <TabsTrigger value="prefs" className="gap-1.5 justify-start px-3 py-2 md:py-2.5">
            <Settings className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Preferences</span>
          </TabsTrigger>
        </TabsList>

        <div className="md:col-span-3">
          <TabsContent value="ts-to-date" className="mt-0">
            <div className="rounded-lg border bg-card p-4 md:p-6 shadow-sm animate-fade-in">
              <h2 className="text-base font-semibold mb-4">Convert Timestamp to Date</h2>
              <TimestampToDate />
            </div>
          </TabsContent>

          <TabsContent value="date-to-ts" className="mt-0">
            <div className="rounded-lg border bg-card p-4 md:p-6 shadow-sm animate-fade-in">
              <h2 className="text-base font-semibold mb-4">Convert Date to Timestamp</h2>
              <DateToTimestamp />
            </div>
          </TabsContent>

          <TabsContent value="duration" className="mt-0">
            <div className="rounded-lg border bg-card p-4 md:p-6 shadow-sm animate-fade-in">
              <h2 className="text-base font-semibold mb-1">Duration — HH:MM:SS:mmm</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Convert HH:MM:SS:mmm to/from milliseconds, seconds, minutes, hours, or days.
              </p>
              <DurationBuilder />
            </div>
          </TabsContent>

          <TabsContent value="timer-calc" className="mt-0">
            <div className="rounded-lg border bg-card p-4 md:p-6 shadow-sm animate-fade-in">
              <h2 className="text-base font-semibold mb-1">Timer Add / Subtract</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Add multiple HH:MM:SS:mmm durations, then subtract others from the total.
              </p>
              <DurationArithmetic />
            </div>
          </TabsContent>

          <TabsContent value="start-end" className="mt-0">
            <div className="rounded-lg border bg-card p-4 md:p-6 shadow-sm animate-fade-in">
              <h2 className="text-base font-semibold mb-1">Start / End Boundaries</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Find the start and end timestamps for a day, month, or year.
              </p>
              <StartEndCalculator />
            </div>
          </TabsContent>

          <TabsContent value="code" className="mt-0">
            <div className="rounded-lg border bg-card p-4 md:p-6 shadow-sm animate-fade-in">
              <h2 className="text-base font-semibold mb-1">Code Examples</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Ready-to-use code snippets for working with Unix timestamps in popular languages.
              </p>
              <CodeExamples />
            </div>
          </TabsContent>

          <TabsContent value="prefs" className="mt-0">
            <div className="rounded-lg border bg-card p-4 md:p-6 shadow-sm animate-fade-in">
              <h2 className="text-base font-semibold mb-1">Preferences</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Customize default settings. Saved to your browser — no account required.
              </p>
              <EpochPreferences />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
