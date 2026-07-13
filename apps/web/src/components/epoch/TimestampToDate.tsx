'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Copy, RotateCcw, AlertCircle, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { TimezoneSelector } from './TimezoneSelector';
import { detectTimestampUnit, timestampToDate, formatRelativeTime, type DateTimeResult } from '@/lib/epoch';
import { copyToClipboard, cn } from '@/lib/utils';
import { usePreferencesStore } from '@/store/preferences';
import type { TimestampUnit } from '@devchrono/shared';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const UNITS: { value: TimestampUnit; label: string }[] = [
  { value: 'seconds', label: 'Seconds (s)' },
  { value: 'milliseconds', label: 'Milliseconds (ms)' },
  { value: 'nanoseconds', label: 'Nanoseconds (ns)' },
];

interface ResultRow {
  label: string;
  value: string;
  highlight?: boolean;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    await copyToClipboard(value);
    setCopied(true);
    toast.success(`Copied ${label}`);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="ghost" size="icon-sm" onClick={handle} className="h-6 w-6 shrink-0">
      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
    </Button>
  );
}

export function TimestampToDate() {
  const prefs = usePreferencesStore();
  const [input, setInput] = useState('');
  const [unit, setUnit] = useState<TimestampUnit>(prefs.defaultUnit);
  const [autoDetected, setAutoDetected] = useState<TimestampUnit | null>(null);
  const [timezone, setTimezone] = useState(prefs.defaultTimezone);
  const [result, setResult] = useState<DateTimeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-detect unit
  useEffect(() => {
    if (input && /^-?\d+$/.test(input.trim())) {
      const detected = detectTimestampUnit(input.trim().replace(/^-/, ''));
      setAutoDetected(detected);
    } else {
      setAutoDetected(null);
    }
  }, [input]);

  const convert = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;

    if (!/^-?\d+$/.test(trimmed)) {
      setError('Timestamp must contain only digits (optionally negative)');
      setResult(null);
      return;
    }

    try {
      const effectiveUnit = autoDetected ?? unit;
      const r = timestampToDate(trimmed, effectiveUnit, timezone, prefs.use24Hour);
      setResult(r);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Conversion failed');
      setResult(null);
    }
  }, [input, unit, autoDetected, timezone, prefs.use24Hour]);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') convert();
      if (e.key === 'c' && !e.ctrlKey && !e.metaKey && document.activeElement?.tagName !== 'INPUT') {
        setInput('');
        setResult(null);
        setError(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [convert]);

  const isKolkata = timezone === 'Asia/Kolkata' || timezone === 'Asia/Calcutta';

  const rows: ResultRow[] = result
    ? [
        { label: 'Relative', value: formatRelativeTime(result.unixMs), highlight: true },
        { label: `${timezone}`, value: result.local, highlight: isKolkata },
        { label: 'Unix (seconds)', value: result.unixSeconds.toString() },
        { label: 'Unix (milliseconds)', value: result.unixMs.toString() },
        { label: 'Unix (microseconds)', value: result.unixMicros },
        { label: 'Unix (nanoseconds)', value: result.unixNanos },
        { label: 'UTC / GMT', value: result.utc },
      ]
    : [];

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 rounded-md border border-primary/30 bg-primary/5 p-3">
            <Label htmlFor="ts-input" className="text-primary font-semibold">Unix Timestamp</Label>
            <Input
              id="ts-input"
              placeholder="e.g. 1700000000"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && convert()}
              className="font-mono"
              aria-describedby="ts-unit-hint"
            />
            {autoDetected && (
              <p id="ts-unit-hint" className="text-xs text-muted-foreground">
                Auto-detected: <span className="font-medium text-primary">{autoDetected}</span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="unit-select">Unit</Label>
            <Select value={unit} onValueChange={(v) => setUnit(v as TimestampUnit)}>
              <SelectTrigger id="unit-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNITS.map((u) => (
                  <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <TimezoneSelector value={timezone} onChange={setTimezone} />

        <div className="flex items-center gap-2">
          <Button onClick={convert} className="flex-1 sm:flex-none">
            Convert to Date
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
            <TooltipContent>Clear (C)</TooltipContent>
          </Tooltip>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const now = Math.floor(Date.now() / 1000).toString();
              setInput(now);
              setUnit('seconds');
            }}
          >
            Use Now
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Shortcuts: <kbd className="font-mono border rounded px-1 py-0.5 text-[10px]">Ctrl+Enter</kbd> convert,{' '}
          <kbd className="font-mono border rounded px-1 py-0.5 text-[10px]">C</kbd> clear
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="rounded-lg border overflow-hidden">
          {result.isNegative && (
            <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-b text-xs text-yellow-700 dark:text-yellow-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Negative timestamp — date is before Unix epoch (January 1, 1970)
            </div>
          )}
          <div className="divide-y">
            {rows.map(({ label, value, highlight }) => (
              <div
                key={label}
                className={cn(
                  'flex items-center justify-between px-4 py-2.5 group hover:bg-muted/20 gap-3',
                  highlight && 'border-l-2 border-primary bg-primary/5 hover:bg-primary/10',
                )}
              >
                <span className={cn('text-xs text-muted-foreground shrink-0 w-32', highlight && 'text-primary font-medium')}>
                  {label}
                </span>
                <code className="font-mono text-sm flex-1 break-all">{value}</code>
                <CopyButton value={value} label={label} />
              </div>
            ))}
          </div>
          <div className="px-4 py-2 bg-muted/20 border-t">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{result.formattedDate}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
