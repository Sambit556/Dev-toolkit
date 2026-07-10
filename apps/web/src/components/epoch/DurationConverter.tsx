'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Minus, Trash2, Equal, ArrowLeftRight, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  parseDurationString, formatMsToDuration, autoFormatDurationDigits,
  DURATION_UNIT_MS, trimDecimal, type DurationUnitKey,
} from '@/lib/duration';

const UNIT_FIELDS: { key: DurationUnitKey; label: string; placeholder: string }[] = [
  { key: 'ms', label: 'Milliseconds', placeholder: 'e.g. 8130500' },
  { key: 'sec', label: 'Seconds', placeholder: 'e.g. 8130.5' },
  { key: 'min', label: 'Minutes', placeholder: 'e.g. 135.5' },
  { key: 'hour', label: 'Hours', placeholder: 'e.g. 2.26' },
  { key: 'day', label: 'Days', placeholder: 'e.g. 0.094' },
];

type BuilderValues = { duration: string } & Record<DurationUnitKey, string>;
const EMPTY_VALUES: BuilderValues = { duration: '', ms: '', sec: '', min: '', hour: '', day: '' };

export function DurationBuilder() {
  // Empty by default (with a placeholder example) rather than pre-filled with
  // "00:00:00:000"/"0" — pre-filled values force users to select-all and
  // delete before they can type their own, which is poor input UX.
  const [values, setValues] = useState<BuilderValues>(EMPTY_VALUES);
  const [error, setError] = useState<string | null>(null);

  // Recomputes every field from a known total-ms, keeping the field the user
  // is actively typing in exactly as they typed it (so it isn't reformatted
  // out from under their cursor) — that's "vice versa": edit any field, all
  // the others follow.
  const applyFromTotalMs = (totalMs: number, sourceKey: keyof BuilderValues, sourceText: string) => {
    setValues({
      duration: sourceKey === 'duration' ? sourceText : formatMsToDuration(totalMs),
      ms: sourceKey === 'ms' ? sourceText : trimDecimal(totalMs / DURATION_UNIT_MS.ms),
      sec: sourceKey === 'sec' ? sourceText : trimDecimal(totalMs / DURATION_UNIT_MS.sec),
      min: sourceKey === 'min' ? sourceText : trimDecimal(totalMs / DURATION_UNIT_MS.min),
      hour: sourceKey === 'hour' ? sourceText : trimDecimal(totalMs / DURATION_UNIT_MS.hour),
      day: sourceKey === 'day' ? sourceText : trimDecimal(totalMs / DURATION_UNIT_MS.day),
    });
  };

  const handleDurationChange = (raw: string) => {
    const v = autoFormatDurationDigits(raw);
    if (!v.trim()) {
      setError(null);
      setValues(EMPTY_VALUES);
      return;
    }
    const ms = parseDurationString(v);
    if (ms === null) {
      setValues((prev) => ({ ...prev, duration: v }));
      setError('Invalid format — use HH:MM:SS:mmm');
      return;
    }
    setError(null);
    applyFromTotalMs(ms, 'duration', v);
  };

  const handleUnitChange = (unit: DurationUnitKey, raw: string) => {
    if (!raw.trim()) {
      setError(null);
      setValues(EMPTY_VALUES);
      return;
    }
    const allowedPattern = unit === 'ms' ? /^-?\d+$/ : /^-?\d+(\.\d+)?$/;
    if (!allowedPattern.test(raw.trim())) {
      setValues((prev) => ({ ...prev, [unit]: raw }));
      setError(`${UNIT_FIELDS.find((u) => u.key === unit)?.label} must be a number`);
      return;
    }
    setError(null);
    applyFromTotalMs(Number(raw) * DURATION_UNIT_MS[unit], unit, raw);
  };

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/30 border-b">
        <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold">Convert</span>
      </div>
      <div className="p-4 space-y-3">
        <p className="text-sm text-muted-foreground">
          Convert HH:MM:SS:mmm to/from milliseconds, seconds, minutes, hours, or days — edit any field
        </p>
        <div className="space-y-1">
          <Label className="text-xs">Duration (HH:MM:SS:mmm)</Label>
          <Input
            value={values.duration}
            onChange={(e) => handleDurationChange(e.target.value)}
            placeholder="e.g. 02:15:30:500"
            className="font-mono text-sm"
          />
        </div>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
          {UNIT_FIELDS.map(({ key, label, placeholder }) => (
            <div key={key} className="space-y-1">
              <Label className="text-xs">{label}</Label>
              <Input
                value={values[key]}
                onChange={(e) => handleUnitChange(key, e.target.value)}
                placeholder={placeholder}
                className="font-mono text-sm"
              />
            </div>
          ))}
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  );
}

// Date parsing and formatting helpers for DD:MM:YYYY and DD:MM:YYYY HH:MM:SS:mmm
function parseDateString(str: string): Date | null {
  const clean = str.trim();
  if (!clean) return null;

  const parts = clean.split(/\s+/);
  const datePart = parts[0];
  const timePart = parts[1] || '';

  const dateMatches = datePart.split(/[-/:]/);
  if (dateMatches.length !== 3) return null;
  const day = parseInt(dateMatches[0], 10);
  const month = parseInt(dateMatches[1], 10) - 1; // 0-indexed
  const year = parseInt(dateMatches[2], 10);

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

  let hours = 0, minutes = 0, seconds = 0, ms = 0;

  if (timePart) {
    const timeMatches = timePart.split(':');
    if (timeMatches.length >= 1) hours = parseInt(timeMatches[0], 10) || 0;
    if (timeMatches.length >= 2) minutes = parseInt(timeMatches[1], 10) || 0;
    if (timeMatches.length >= 3) seconds = parseInt(timeMatches[2], 10) || 0;
    if (timeMatches.length >= 4) ms = parseInt(timeMatches[3], 10) || 0;
  }

  const date = new Date(year, month, day, hours, minutes, seconds, ms);
  if (isNaN(date.getTime())) return null;
  return date;
}

function formatDateString(date: Date, showTime = true): string {
  const pad = (n: number, len = 2) => n.toString().padStart(len, '0');
  const d = pad(date.getDate());
  const m = pad(date.getMonth() + 1);
  const y = date.getFullYear();
  if (!showTime) return `${d}:${m}:${y}`;
  
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  const mmm = pad(date.getMilliseconds(), 3);
  return `${d}:${m}:${y} ${hh}:${mm}:${ss}:${mmm}`;
}

// Parses standard dates, durations, or pure millisecond numbers
function parseMixedValue(input: string): { type: 'date' | 'duration'; ms: number } | null {
  const clean = input.trim();
  if (!clean) return null;

  // DD:MM:YYYY (with separators - / : and a 4 digit year)
  const dateRegex = /^\d{1,2}[-/: ]\d{1,2}[-/: ]\d{4}/;
  if (dateRegex.test(clean)) {
    const date = parseDateString(clean);
    if (date !== null) {
      return { type: 'date', ms: date.getTime() };
    }
  }

  // Duration parser HH:MM:SS:mmm
  const durationMs = parseDurationString(clean);
  if (durationMs !== null) {
    return { type: 'duration', ms: durationMs };
  }

  // Raw milliseconds number
  if (/^-?\d+$/.test(clean)) {
    return { type: 'duration', ms: parseInt(clean, 10) };
  }

  return null;
}

interface DurationRow {
  id: string;
  sign: '+' | '-';
  value: string;
}

let rowCounter = 0;
const newRow = (sign: '+' | '-'): DurationRow => ({ id: `row-${++rowCounter}`, sign, value: '' });

export function DurationArithmetic() {
  const [rows, setRows] = useState<DurationRow[]>([newRow('+'), newRow('+'), newRow('-')]);
  const [invalidIds, setInvalidIds] = useState<Set<string>>(new Set());
  const [hasSubtraction, setHasSubtraction] = useState(false);

  // Math engine states
  const [calculatedMs, setCalculatedMs] = useState<number | null>(null);
  const [resultType, setResultType] = useState<'duration' | 'date'>('duration');

  const addRow = (sign: '+' | '-') => setRows((prev) => [...prev, newRow(sign)]);
  const removeRow = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));
  
  const updateRow = (id: string, rawValue: string) => {
    // Skip autoformat if input contains date dividers or space or year-like lengths
    const shouldFormat = !/[\s-/]/.test(rawValue) && rawValue.replace(/\D/g, '').length <= 9;
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, value: shouldFormat ? autoFormatDurationDigits(rawValue) : rawValue } : r))
    );
  };

  const toggleSign = (id: string) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, sign: r.sign === '+' ? '-' : '+' } : r)));

  const calculate = () => {
    let accumulator = 0;
    let accType: 'duration' | 'date' = 'duration';
    const invalid = new Set<string>();

    let hasSub = false;

    for (const row of rows) {
      if (!row.value.trim()) continue;
      const parsed = parseMixedValue(row.value);
      if (parsed === null) {
        invalid.add(row.id);
        continue;
      }

      const valMs = parsed.ms;
      const rowType = parsed.type;

      if (row.sign === '+') {
        accumulator = accumulator + valMs;
        if (rowType === 'date') {
          accType = 'date';
        }
      } else {
        hasSub = true;
        if (accType === 'date' && rowType === 'date') {
          accumulator = accumulator - valMs;
          accType = 'duration'; // Subtracting two dates yields a duration difference
        } else {
          accumulator = accumulator - valMs;
        }
      }
    }

    setInvalidIds(invalid);
    if (invalid.size > 0) {
      setCalculatedMs(null);
      return;
    }

    setHasSubtraction(hasSub);
    setCalculatedMs(accumulator);
    setResultType(accType);
  };

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/30 border-b">
        <Calculator className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold">Add / Subtract (Mixed Arithmetic)</span>
      </div>
      <div className="p-4 space-y-3">
      <p className="text-sm text-muted-foreground">
        Perform additions & subtractions on mixed Durations (HH:MM:SS:mmm) and Date/Times (DD:MM:YYYY HH:MM:SS:mmm)
      </p>

      <div className="space-y-2">
        {rows.map((row) => {
          const parsed = parseMixedValue(row.value);
          const badgeLabel = parsed ? (parsed.type === 'date' ? 'Date' : 'Duration') : 'Empty';

          return (
            <div key={row.id} className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => toggleSign(row.id)}
                className={cn(
                  'shrink-0',
                  row.sign === '+' ? 'text-green-600 border-green-600/40' : 'text-destructive border-destructive/40',
                )}
                title={row.sign === '+' ? 'Addition — click to switch to subtraction' : 'Subtraction — click to switch to addition'}
              >
                {row.sign === '+' ? <Plus className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
              </Button>
              <Input
                value={row.value}
                onChange={(e) => updateRow(row.id, e.target.value)}
                placeholder="e.g. 01:30:00 or 10:07:2026 14:12:00"
                className={cn('font-mono text-sm flex-1', invalidIds.has(row.id) && 'border-destructive')}
              />
              <span className={cn(
                "text-[9px] font-bold px-1.5 py-0.5 rounded border shadow-sm select-none shrink-0 w-16 text-center font-mono",
                parsed ? (parsed.type === 'date' ? "bg-blue-500/10 text-blue-600 border-blue-500/20" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20") : "bg-muted text-muted-foreground border-border"
              )}>
                {badgeLabel}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => removeRow(row.id)}
                disabled={rows.length <= 1}
                className="shrink-0 text-muted-foreground"
                title="Remove row"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => addRow('+')} className="gap-1">
          <Plus className="h-3.5 w-3.5" /> Add row
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => addRow('-')} className="gap-1">
          <Minus className="h-3.5 w-3.5" /> Add row
        </Button>
        <Button type="button" size="sm" onClick={calculate} className="ml-auto gap-1">
          <Equal className="h-3.5 w-3.5" /> Calculate
        </Button>
      </div>

      {invalidIds.size > 0 && (
        <p className="text-xs text-destructive">
          Fix the highlighted row{invalidIds.size > 1 ? 's' : ''} — use HH:MM:SS or DD:MM:YYYY HH:MM:SS:mmm
        </p>
      )}

      {/* Output Panel Layout */}
      {calculatedMs !== null && (
        resultType === 'date' ? (
          <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 space-y-2 mt-4 animate-fade-in">
            <p className="text-xs text-muted-foreground mb-1 font-bold">Resulting Date & Time</p>
            <code className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-450 select-text block">
              {formatDateString(new Date(calculatedMs), true)}
            </code>
            <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 mt-2 pt-2 border-t border-emerald-500/10">
              <div>
                <span className="text-[10px] text-muted-foreground block font-semibold">Date Format (DD:MM:YYYY)</span>
                <code className="font-mono text-xs font-bold block select-text">
                  {formatDateString(new Date(calculatedMs), false)}
                </code>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block font-semibold">ISO 8601 Format</span>
                <code className="font-mono text-xs font-bold block select-text truncate">
                  {new Date(calculatedMs).toISOString()}
                </code>
              </div>
              <div className="col-span-1 sm:col-span-2">
                <span className="text-[10px] text-muted-foreground block font-semibold">Unix Epoch Details</span>
                <code className="font-mono text-xs font-bold block select-text">
                  Sec: {Math.floor(calculatedMs / 1000)} | Ms: {calculatedMs}
                </code>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 mt-4 animate-fade-in">
            <div className="rounded-md bg-primary/10 border border-primary/20 px-4 py-3">
              <p className="text-xs text-muted-foreground mb-1">Final result duration</p>
              <code className="font-mono text-lg font-bold text-primary select-text">{formatMsToDuration(calculatedMs)}</code>
            </div>

            {/* Conversion Breakdown View Mode */}
            <div className="mt-4 border-t pt-4 space-y-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Converted View Mode</p>
              <div className="grid gap-2 grid-cols-2 sm:grid-cols-5">
                <div className="rounded-md border p-2.5 bg-card/50">
                  <span className="text-[10px] text-muted-foreground font-semibold block">Milliseconds</span>
                  <code className="font-mono text-xs font-bold block mt-1 truncate" title={calculatedMs.toString()}>
                    {calculatedMs}
                  </code>
                </div>
                <div className="rounded-md border p-2.5 bg-card/50">
                  <span className="text-[10px] text-muted-foreground font-semibold block">Seconds</span>
                  <code className="font-mono text-xs font-bold block mt-1 truncate">
                    {trimDecimal(calculatedMs / DURATION_UNIT_MS.sec)}
                  </code>
                </div>
                <div className="rounded-md border p-2.5 bg-card/50">
                  <span className="text-[10px] text-muted-foreground font-semibold block">Minutes</span>
                  <code className="font-mono text-xs font-bold block mt-1 truncate">
                    {trimDecimal(calculatedMs / DURATION_UNIT_MS.min)}
                  </code>
                </div>
                <div className="rounded-md border p-2.5 bg-card/50">
                  <span className="text-[10px] text-muted-foreground font-semibold block">Hours</span>
                  <code className="font-mono text-xs font-bold block mt-1 truncate">
                    {trimDecimal(calculatedMs / DURATION_UNIT_MS.hour)}
                  </code>
                </div>
                <div className="rounded-md border p-2.5 bg-card/50">
                  <span className="text-[10px] text-muted-foreground font-semibold block">Days</span>
                  <code className="font-mono text-xs font-bold block mt-1 truncate">
                    {trimDecimal(calculatedMs / DURATION_UNIT_MS.day)}
                  </code>
                </div>
              </div>
            </div>
          </div>
        )
      )}
      </div>
    </div>
  );
}

export function DurationConverter() {
  return (
    <div className="space-y-6">
      <DurationBuilder />
      <DurationArithmetic />
    </div>
  );
}
