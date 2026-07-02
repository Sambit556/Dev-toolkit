'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TimezoneSelector } from './TimezoneSelector';
import { getStartEnd } from '@/lib/epoch';
import { copyToClipboard } from '@/lib/utils';
import { usePreferencesStore } from '@/store/preferences';

type Period = 'day' | 'month' | 'year';

interface PeriodResult {
  period: Period;
  label: string;
  start: number;
  end: number;
  startISO: string;
  endISO: string;
}

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className="h-6 w-6"
      onClick={async () => {
        await copyToClipboard(value);
        toast.success('Copied!');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
    </Button>
  );
}

export function StartEndCalculator() {
  const prefs = usePreferencesStore();
  const [dateInput, setDateInput] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [timezone, setTimezone] = useState(prefs.defaultTimezone);
  const [results, setResults] = useState<PeriodResult[]>([]);

  const calculate = () => {
    const date = new Date(dateInput + 'T00:00:00Z');
    if (isNaN(date.getTime())) return;

    const periods: Period[] = ['day', 'month', 'year'];
    const labels = { day: 'Day', month: 'Month', year: 'Year' };

    const newResults = periods.map((period) => {
      const { start, end } = getStartEnd(date, period, timezone);
      return {
        period,
        label: labels[period],
        start,
        end,
        startISO: new Date(start * 1000).toISOString(),
        endISO: new Date(end * 1000).toISOString(),
      };
    });

    setResults(newResults);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="calc-date">Reference Date</Label>
          <Input
            id="calc-date"
            type="date"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            className="font-mono"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <TimezoneSelector value={timezone} onChange={setTimezone} />
        </div>
      </div>

      <Button onClick={calculate} className="w-full sm:w-auto">
        Calculate Boundaries
      </Button>

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map(({ period, label, start, end, startISO, endISO }) => (
            <div key={period} className="rounded-lg border overflow-hidden">
              <div className="px-4 py-2 bg-muted/30 border-b">
                <span className="text-sm font-medium">Start / End of {label}</span>
              </div>
              <div className="divide-y text-sm">
                {[
                  { sub: 'Start', ts: start, iso: startISO },
                  { sub: 'End', ts: end, iso: endISO },
                ].map(({ sub, ts, iso }) => (
                  <div key={sub} className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                    <span className="text-xs text-muted-foreground w-14 shrink-0">{sub}</span>
                    <div className="flex items-center gap-2 flex-1">
                      <code className="font-mono font-medium">{ts}</code>
                      <CopyBtn value={ts.toString()} />
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <code className="font-mono text-xs">{iso}</code>
                      <CopyBtn value={iso} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
