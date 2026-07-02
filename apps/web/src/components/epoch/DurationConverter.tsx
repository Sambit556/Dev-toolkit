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

function DurationBuilder() {
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

interface DurationRow {
  id: string;
  sign: '+' | '-';
  value: string;
}

let rowCounter = 0;
const newRow = (sign: '+' | '-'): DurationRow => ({ id: `row-${++rowCounter}`, sign, value: '' });

function DurationArithmetic() {
  const [rows, setRows] = useState<DurationRow[]>([newRow('+'), newRow('+'), newRow('-')]);
  const [invalidIds, setInvalidIds] = useState<Set<string>>(new Set());
  const [sumResult, setSumResult] = useState<number | null>(null);
  const [finalResult, setFinalResult] = useState<number | null>(null);
  const [hasSubtraction, setHasSubtraction] = useState(false);

  const addRow = (sign: '+' | '-') => setRows((prev) => [...prev, newRow(sign)]);
  const removeRow = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));
  const updateRow = (id: string, rawValue: string) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, value: autoFormatDurationDigits(rawValue) } : r)));
  const toggleSign = (id: string) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, sign: r.sign === '+' ? '-' : '+' } : r)));

  const calculate = () => {
    let sumPlus = 0;
    let sumMinus = 0;
    let subtractionEntered = false;
    const invalid = new Set<string>();

    for (const row of rows) {
      if (!row.value.trim()) continue;
      const ms = parseDurationString(row.value);
      if (ms === null) {
        invalid.add(row.id);
        continue;
      }
      if (row.sign === '+') {
        sumPlus += ms;
      } else {
        sumMinus += ms;
        subtractionEntered = true;
      }
    }

    setInvalidIds(invalid);
    if (invalid.size > 0) {
      setSumResult(null);
      setFinalResult(null);
      return;
    }

    setSumResult(sumPlus);
    setHasSubtraction(subtractionEntered);
    setFinalResult(subtractionEntered ? sumPlus - sumMinus : null);
  };

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/30 border-b">
        <Calculator className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold">Add / Subtract</span>
      </div>
      <div className="p-4 space-y-3">
      <p className="text-sm text-muted-foreground">
        Add multiple HH:MM:SS:mmm durations, then subtract others from the total
      </p>

      <div className="space-y-2">
        {rows.map((row) => (
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
              placeholder="e.g. 01:30:00:000"
              className={cn('font-mono text-sm', invalidIds.has(row.id) && 'border-destructive')}
            />
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
        ))}
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
          Fix the highlighted row{invalidIds.size > 1 ? 's' : ''} — use HH:MM:SS or HH:MM:SS:mmm.
        </p>
      )}

      {sumResult !== null && (
        <div className="rounded-md bg-muted px-4 py-3">
          <p className="text-xs text-muted-foreground mb-1">Sum of additions</p>
          <code className="font-mono text-lg font-bold">{formatMsToDuration(sumResult)}</code>
        </div>
      )}

      {hasSubtraction && finalResult !== null && (
        <div className="rounded-md bg-primary/10 border border-primary/20 px-4 py-3">
          <p className="text-xs text-muted-foreground mb-1">Final result (after subtraction)</p>
          <code className="font-mono text-lg font-bold text-primary">{formatMsToDuration(finalResult)}</code>
        </div>
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
