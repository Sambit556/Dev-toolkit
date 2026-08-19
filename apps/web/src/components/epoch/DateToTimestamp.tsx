'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { RotateCcw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CopyButton } from '@/components/ui/copy-button';
import { TimezoneSelector } from './TimezoneSelector';
import { parseDateString } from '@/lib/epoch';
import { usePreferencesStore } from '@/store/preferences';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface ConversionResult {
  unixSeconds: number;
  unixMs: number;
  unixNanos: string;
  utc: string;
  iso8601: string;
}

function getFormatExamples(date: Date = new Date()) {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const YYYY = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const DD = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());

  const iso = date.toISOString().replace(/\.\d{3}Z$/, 'Z');
  const dateTime = `${YYYY}-${MM}-${DD} ${hh}:${mm}:${ss}`;
  const dateOnly = `${YYYY}-${MM}-${DD}`;
  const mmddyyyy = `${MM}/${DD}/${YYYY}`;
  const ddmmyyyy = `${DD}-${MM}-${YYYY}`;

  return [
    { label: 'ISO 8601', value: iso },
    { label: 'Date + Time', value: dateTime },
    { label: 'Date only', value: dateOnly },
    { label: 'MM/DD/YYYY', value: mmddyyyy },
    { label: 'DD-MM-YYYY', value: ddmmyyyy },
  ];
}

export function DateToTimestamp() {
  const prefs = usePreferencesStore();
  const [input, setInput] = useState('');
  const [timezone, setTimezone] = useState(prefs.defaultTimezone);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [examples, setExamples] = useState<{ label: string; value: string }[]>([]);

  // Update suggestions in sync with current clock
  useEffect(() => {
    setExamples(getFormatExamples());
    const interval = setInterval(() => {
      setExamples(getFormatExamples());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const convert = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const date = parseDateString(trimmed, timezone);
    if (!date || isNaN(date.getTime())) {
      setError(`Cannot parse "${trimmed}" as a date. Try formats like: ${examples[0]?.value || '2026-08-19T18:15:30Z'}`);
      setResult(null);
      return;
    }

    const ms = date.getTime();
    const unixS = Math.floor(ms / 1000);
    const nanos = BigInt(ms) * BigInt(1_000_000);

    setResult({
      unixSeconds: unixS,
      unixMs: ms,
      unixNanos: nanos.toString(),
      utc: date.toUTCString(),
      iso8601: date.toISOString(),
    });
    setError(null);
  }, [input, timezone, examples]);

  const useNow = () => {
    const now = new Date();
    setInput(now.toISOString());
    setError(null);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="date-input">Date / DateTime String</Label>
          <div className="flex gap-2">
            <Input
              id="date-input"
              placeholder={examples[0] ? `e.g. ${examples[0].value}` : 'e.g. 2026-08-19T18:15:30Z'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && convert()}
              className="font-mono"
            />
            <Button variant="outline" size="sm" onClick={useNow} className="shrink-0">
              Now
            </Button>
          </div>
          {/* Real-time format examples */}
          <div className="space-y-1 mt-2">
            <span className="text-[11px] text-muted-foreground block font-medium">Click a live format to populate:</span>
            <div className="flex flex-wrap gap-1.5">
              {examples.map(({ label, value }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setInput(value);
                    setError(null);
                  }}
                  className="inline-flex items-center gap-1.5 rounded border bg-muted/40 hover:bg-accent hover:border-primary/40 px-2 py-1 text-[11px] transition-colors cursor-pointer text-left"
                  title={`Insert current ${label}: ${value}`}
                >
                  <span className="text-muted-foreground font-medium">{label}:</span>
                  <code className="font-mono text-primary font-semibold">{value}</code>
                </button>
              ))}
            </div>
          </div>
        </div>

        <TimezoneSelector value={timezone} onChange={setTimezone} />

        <div className="flex items-center gap-2">
          <Button onClick={convert} className="flex-1 sm:flex-none">
            Convert to Timestamp
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => { setInput(''); setResult(null); setError(null); }}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="rounded-lg border overflow-hidden">
          <div className="px-4 py-2 bg-muted/30 border-b">
            <p className="text-xs text-muted-foreground">
              Parsed as: <span className="font-mono font-medium text-foreground">{result.utc}</span>
            </p>
          </div>
          <div className="divide-y">
            {[
              { label: 'Seconds', value: result.unixSeconds.toString(), badge: '10 digits' },
              { label: 'Milliseconds', value: result.unixMs.toString(), badge: '13 digits' },
              { label: 'Nanoseconds', value: result.unixNanos, badge: '19 digits' },
              { label: 'ISO 8601', value: result.iso8601 },
            ].map(({ label, value, badge }) => {
              const isMs = label === 'Milliseconds';
              return (
                <div
                  key={label}
                  className={`flex items-center justify-between px-4 py-2.5 group hover:bg-muted/20 gap-3 ${
                    isMs ? 'bg-primary/5 border-l-2 border-primary' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs w-28 ${isMs ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                      {label}
                    </span>
                    {badge && (
                      <Badge
                        variant={isMs ? 'default' : 'outline'}
                        className="text-[10px] py-0 hidden sm:inline-flex"
                      >
                        {badge}
                      </Badge>
                    )}
                  </div>
                  <code
                    className={`font-mono text-sm flex-1 break-all text-right ${
                      isMs ? 'font-bold text-primary' : ''
                    }`}
                  >
                    {value}
                  </code>
                  <CopyButton value={value} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
