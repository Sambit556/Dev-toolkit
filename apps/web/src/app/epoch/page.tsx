import { BackToHomeLink } from '@/components/layout/BackToHomeLink';
import type { Metadata } from 'next';
import { Clock, Timer, Calendar, Calculator } from 'lucide-react';
import { LiveClock } from '@/components/epoch/LiveClock';
import { TimestampToDate } from '@/components/epoch/TimestampToDate';
import { DateToTimestamp } from '@/components/epoch/DateToTimestamp';
import { StartEndCalculator } from '@/components/epoch/StartEndCalculator';
import { DurationBuilder, DurationArithmetic } from '@/components/epoch/DurationConverter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'Epoch Converter',
  description:
    'Convert Unix timestamps to human-readable dates and vice versa. Live epoch clock, timezone support, and duration calculator.',
  alternates: { canonical: '/epoch' },
};

export default function EpochPage() {
  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-8 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <BackToHomeLink />
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Clock className="h-5 w-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Epoch Converter</h1>
            <span className="hidden sm:inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              Live & Browser-Based
            </span>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm max-w-3xl">
            Convert Unix timestamps to human-readable dates and vice versa in real time. Work with timezones, calculate durations, and inspect day/month boundaries.
          </p>
        </div>
      </div>

      {/* Live clock - always visible & compact half height */}
      <section>
        <LiveClock />
      </section>

      {/* Primary Dual Converters - Always open side by side */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Core Epoch Converters</h2>
            <p className="text-xs text-muted-foreground">Instant two-way conversion between Unix epoch timestamps and human dates</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
          {/* Timestamp to Date Card */}
          <div className="rounded-xl border bg-card p-4 sm:p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight">Timestamp → Date</h3>
                  <p className="text-xs text-muted-foreground">Convert Unix timestamp to human-readable date</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground border">
                Epoch → Date
              </span>
            </div>
            <TimestampToDate />
          </div>

          {/* Date to Timestamp Card */}
          <div className="rounded-xl border bg-card p-4 sm:p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight">Date → Timestamp</h3>
                  <p className="text-xs text-muted-foreground">Convert human date to Unix epoch timestamps</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground border">
                Date → Epoch
              </span>
            </div>
            <DateToTimestamp />
          </div>
        </div>
      </section>

      <Separator />

      {/* Additional Tools Section - Centered & Enlarged */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Time & Duration Calculators</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Perform duration arithmetic, format HH:MM:SS:mmm intervals, and calculate calendar boundaries
          </p>
        </div>

        <Tabs defaultValue="timer-calc" className="space-y-6">
          <div className="flex justify-center">
            <TabsList className="inline-flex h-auto p-1.5 bg-muted/80 backdrop-blur-sm rounded-xl gap-1.5 shadow-sm border">
              <TabsTrigger
                value="timer-calc"
                className="gap-2 px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all"
              >
                <Calculator className="h-4 w-4 text-primary" />
                <span>Timer Add / Subtract</span>
              </TabsTrigger>

              <TabsTrigger
                value="duration"
                className="gap-2 px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all"
              >
                <Clock className="h-4 w-4 text-primary" />
                <span>HH:MM:SS:ms Duration</span>
              </TabsTrigger>

              <TabsTrigger
                value="start-end"
                className="gap-2 px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all"
              >
                <Timer className="h-4 w-4 text-primary" />
                <span>Start / End Boundaries</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="timer-calc" className="mt-0">
            <div className="rounded-xl border bg-card p-5 sm:p-7 shadow-sm animate-fade-in space-y-4">
              <div>
                <h3 className="text-lg font-bold tracking-tight">Timer Add / Subtract</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Add multiple durations, dates, or timestamps together and subtract others from the total.
                </p>
              </div>
              <DurationArithmetic />
            </div>
          </TabsContent>

          <TabsContent value="duration" className="mt-0">
            <div className="rounded-xl border bg-card p-5 sm:p-7 shadow-sm animate-fade-in space-y-4">
              <div>
                <h3 className="text-lg font-bold tracking-tight">Duration Converter — HH:MM:SS:mmm</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Convert HH:MM:SS:mmm to/from milliseconds, seconds, minutes, hours, or days in real-time.
                </p>
              </div>
              <DurationBuilder />
            </div>
          </TabsContent>

          <TabsContent value="start-end" className="mt-0">
            <div className="rounded-xl border bg-card p-5 sm:p-7 shadow-sm animate-fade-in space-y-4">
              <div>
                <h3 className="text-lg font-bold tracking-tight">Start / End Boundaries</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Find the exact start and end epoch timestamps for a reference day, month, or year.
                </p>
              </div>
              <StartEndCalculator />
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
