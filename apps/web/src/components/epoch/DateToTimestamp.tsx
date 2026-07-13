'use client';

import React, { useState, useCallback } from 'react';
import { Copy, RotateCcw, AlertCircle, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { TimezoneSelector } from './TimezoneSelector';
import { parseDateString } from '@/lib/epoch';
import { copyToClipboard } from '@/lib/utils';
import { usePreferencesStore } from '@/store/preferences';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface ConversionResult {
  unixSeconds: number;
  unixMs: number;
  unixNanos: string;
  utc: string;
  iso8601: string;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={async () => {
        await copyToClipboard(value);
        toast.success('Copied!');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="h-6 w-6 shrink-0"
    >
      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
    </Button>
  );
}

const FORMAT_EXAMPLES = [
  { label: 'ISO 8601', value: '2023-11-14T22:13:20Z' },
  { label: 'Date + Time', value: '2023-11-14 22:13:20' },
  { label: 'Date only', value: '2023-11-14' },
  { label: 'MM/DD/YYYY', value: '11/14/2023' },
  { label: 'DD-MM-YYYY', value: '14-11-2023' },
];

export function DateToTimestamp() {
  const prefs = usePreferencesStore();
  const [input, setInput] = useState('');
  const [timezone, setTimezone] = useState(prefs.defaultTimezone);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const convert = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const date = parseDateString(trimmed, timezone);
    if (!date || isNaN(date.getTime())) {
      setError(`Cannot parse "${trimmed}" as a date. Try formats like: 2023-11-14, 2023-11-14T22:13:20Z`);
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
  }, [input, timezone]);

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
              placeholder="e.g. 2023-11-14T22:13:20Z"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && convert()}
              className="font-mono"
            />
            <Button variant="outline" size="sm" onClick={useNow} className="shrink-0">
              Now
            </Button>
          </div>
          {/* Format examples */}
          <div className="flex flex-wrap gap-1.5 mt-1">
            {FORMAT_EXAMPLES.map(({ label, value }) => (
              <button
                key={label}
                onClick={() => setInput(value)}
                className="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] hover:bg-accent transition-colors"
              >
                <span className="text-muted-foreground">{label}:</span>
                <code className="font-mono">{value}</code>
              </button>
            ))}
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
            ].map(({ label, value, badge }) => (
              <div key={label} className="flex items-center justify-between px-4 py-2.5 group hover:bg-muted/20 gap-3">
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground w-28">{label}</span>
                  {badge && (
                    <Badge variant="outline" className="text-[10px] py-0 hidden sm:inline-flex">
                      {badge}
                    </Badge>
                  )}
                </div>
                <code className="font-mono text-sm flex-1 break-all text-right">{value}</code>
                <CopyButton value={value} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
