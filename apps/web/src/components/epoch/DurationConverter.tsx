'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus, Minus, Trash2, Equal, ArrowLeftRight, Calculator,
  Wand2, Clock, CalendarDays, CalendarClock, Hash, HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
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
  // Reject out-of-range day/month up front — otherwise the Date constructor
  // silently rolls invalid values into a *different*, wrong valid date (e.g.
  // month 14 becomes March of next year) instead of signaling "not a date",
  // which would stop parseMixedValue from ever trying another interpretation
  // (like MM/DD/YYYY via the native fallback) for an ambiguous input.
  if (month < 0 || month > 11 || day < 1 || day > 31) return null;

  let hours = 0, minutes = 0, seconds = 0, ms = 0;

  if (timePart) {
    const timeMatches = timePart.split(':');
    if (timeMatches.length >= 1) hours = parseInt(timeMatches[0], 10) || 0;
    if (timeMatches.length >= 2) minutes = parseInt(timeMatches[1], 10) || 0;
    if (timeMatches.length >= 3) seconds = parseInt(timeMatches[2], 10) || 0;
    if (timeMatches.length >= 4) ms = parseInt(timeMatches[3], 10) || 0;
  }

  const date = new Date(year, month, day, hours, minutes, seconds, ms);
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) return null;
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

// Parses standard dates, durations, or pure millisecond numbers. Tries the
// most specific / least ambiguous interpretations first:
//   1. A bare integer is always raw milliseconds (never a date or duration —
//      checked first so nothing below can reinterpret e.g. "1000" as a year).
//   2. HH:MM[:SS[:mmm]] duration.
//   3. DD:MM:YYYY / DD-MM-YYYY / DD/MM/YYYY (+ optional time), this app's
//      documented convention.
//   4. Fallback to the browser's own date parser, which covers everything
//      else people might reasonably type — ISO 8601, "Jul 15 2026",
//      MM/DD/YYYY, RFC 2822, etc. — without us hand-rolling every format.
function parseMixedValue(input: string): { type: 'date' | 'duration'; ms: number } | null {
  const clean = input.trim();
  if (!clean) return null;

  if (/^-?\d+$/.test(clean)) {
    return { type: 'duration', ms: parseInt(clean, 10) };
  }

  const durationMs = parseDurationString(clean);
  if (durationMs !== null) {
    return { type: 'duration', ms: durationMs };
  }

  const date = parseDateString(clean);
  if (date !== null) {
    return { type: 'date', ms: date.getTime() };
  }

  const native = new Date(clean);
  if (!isNaN(native.getTime())) {
    return { type: 'date', ms: native.getTime() };
  }

  return null;
}

// "Mixed" (auto-detect) is the flexible default that tries every format in
// turn — great for free-form input, but genuinely ambiguous for date+time
// (is "07/05" July 5th or May 7th? is that a date or a duration?). Committing
// to one specific type removes that ambiguity entirely: every row's input
// then auto-formats itself into exactly that type's shape as you type (the
// same way plain digits already auto-gain colons), so there's nothing left
// to guess. This is one setting for the whole calculator, not per row — every
// row is being added/subtracted together, so they all need to agree on what
// they mean anyway.
type InputMode = 'mixed' | 'duration' | 'date' | 'datetime' | 'ms';

const INPUT_MODE_OPTIONS: {
  value: InputMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  placeholder: string;
}[] = [
  { value: 'mixed', label: 'Mixed (Auto)', icon: Wand2, placeholder: 'e.g. 1:30, 15/07/2026, or 2026-07-15 14:12:00' },
  { value: 'duration', label: 'Duration', icon: Clock, placeholder: 'e.g. 1:30 or 01:30:00:500' },
  { value: 'date', label: 'Date', icon: CalendarDays, placeholder: 'e.g. 16:07:2026, 2026-07-16, or 16/07/2026' },
  { value: 'datetime', label: 'Date + Time', icon: CalendarClock, placeholder: 'e.g. 16:07:2026 14:30:00, or 2026-07-16 14:30:00' },
  { value: 'ms', label: 'Raw ms', icon: Hash, placeholder: 'e.g. 5000' },
];

// Strips everything but digits (and a leading "-" if allowed), then re-groups
// them into the given chunk sizes with the given separators — e.g. groups
// [2,2,4] with seps [':',':'] turns "15072026" into "15:07:2026" as each
// digit is typed, the same way duration input auto-gains its colons.
function maskDigits(raw: string, groups: number[], seps: string[], allowNegative: boolean): string {
  const negative = allowNegative && raw.trim().startsWith('-');
  const maxDigits = groups.reduce((a, b) => a + b, 0);
  const digits = raw.replace(/\D/g, '').slice(0, maxDigits);
  const chunks: string[] = [];
  let idx = 0;
  for (const size of groups) {
    const chunk = digits.slice(idx, idx + size);
    if (!chunk) break;
    chunks.push(chunk);
    idx += size;
  }
  const formatted = chunks.map((c, i) => (i === 0 ? c : seps[i - 1] + c)).join('');
  return negative ? `-${formatted}` : formatted;
}

// 'date' and 'datetime' deliberately have no mask here: unlike a duration
// (always biggest-to-smallest unit, one universal convention), a bare digit
// run for a date is genuinely ambiguous — day-first, month-first, and
// year-first are all common — so guessing one and auto-inserting a
// separator risks corrupting whatever the user actually intends (e.g.
// typing "2026-07-16" character by character used to become "20:26-07-16",
// because the day-first mask jumped in and split after just 2 digits,
// before the user's own "-" ever arrived). Those two modes just accept
// whatever's typed verbatim and lean on `parseRowValue`'s flexible parsing.
function formatByMode(mode: InputMode, raw: string): string {
  switch (mode) {
    case 'duration':
      return maskDigits(raw, [2, 2, 2, 3], [':', ':', ':'], true);
    case 'ms': {
      const negative = raw.trim().startsWith('-');
      const digits = raw.replace(/\D/g, '');
      return negative ? `-${digits}` : digits;
    }
    default:
      return raw;
  }
}

interface DurationRow {
  id: string;
  sign: '+' | '-';
  value: string;
  // Once true, auto-formatting stops touching this row's value entirely.
  // It flips on the moment the user types a separator themselves (":", "-",
  // a space) instead of a plain digit — without it, auto-format's next
  // keystroke would strip that manually-typed character right back out and
  // re-derive its own from the digit sequence (e.g. typing "1", ":", "3",
  // "0" one key at a time would silently become "13:0" instead of "1:30").
  manualFormat: boolean;
}

let rowCounter = 0;
const newRow = (sign: '+' | '-'): DurationRow => ({ id: `row-${++rowCounter}`, sign, value: '', manualFormat: false });

// Parses a row's text according to the calculator's current input mode.
// 'date' and 'datetime' both accept much more than the DD:MM:YYYY auto-format
// mask produces: typing digits with no separators gets that guided mask, but
// typing your own separators (which switches the row to manual mode — see
// `manualFormat`) should work for *any* common layout — "2026-07-16" (ISO),
// "2026/07/16", "16/07/2026" (DD/MM/YYYY), "07/16/2026" (MM/DD/YYYY), and so
// on. `parseDateString` only understands day-first (this app's own
// convention), so anything it rejects falls back to the browser's native
// date parser, which is what correctly resolves ISO and MM/DD/YYYY layouts.
function parseRowValue(row: DurationRow, mode: InputMode): { type: 'date' | 'duration'; ms: number } | null {
  const clean = row.value.trim();
  if (!clean) return null;

  if (mode === 'mixed') return parseMixedValue(clean);

  if (mode === 'duration') {
    const ms = parseDurationString(clean);
    return ms !== null ? { type: 'duration', ms } : null;
  }

  if (mode === 'ms') {
    return /^-?\d+$/.test(clean) ? { type: 'duration', ms: parseInt(clean, 10) } : null;
  }

  const date = parseDateString(clean);
  if (date) return { type: 'date', ms: date.getTime() };

  const native = new Date(clean);
  return !isNaN(native.getTime()) ? { type: 'date', ms: native.getTime() } : null;
}

export function DurationArithmetic() {
  const [rows, setRows] = useState<DurationRow[]>([newRow('+'), newRow('+'), newRow('-')]);
  const [invalidIds, setInvalidIds] = useState<Set<string>>(new Set());
  const [hasSubtraction, setHasSubtraction] = useState(false);
  // One input mode for the whole calculator — every row is being added or
  // subtracted together, so they all need to agree on what they mean anyway.
  const [inputMode, setInputMode] = useState<InputMode>('mixed');

  // Math engine states
  const [calculatedMs, setCalculatedMs] = useState<number | null>(null);
  const [resultType, setResultType] = useState<'duration' | 'date'>('duration');

  const addRow = (sign: '+' | '-') => setRows((prev) => [...prev, newRow(sign)]);
  const removeRow = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));

  const updateRow = (id: string, rawValue: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;

        // An emptied field gets a clean slate — auto-format engages again
        // next time, even if manual mode was on before.
        if (!rawValue.trim()) return { ...r, value: rawValue, manualFormat: false };

        // Raw ms has nothing to auto-insert (no separators at all), so it
        // just always strips non-digits — no manual-mode concept needed.
        if (inputMode === 'ms') return { ...r, value: formatByMode('ms', rawValue) };

        // Date / Date+Time have no digit mask at all (see `formatByMode`) —
        // whatever's typed is accepted verbatim, in any layout.
        if (inputMode === 'date' || inputMode === 'datetime') return { ...r, value: rawValue };

        // A paste/fill (length changed by more than one character) is
        // presumed to already be exactly what the user wants, so it's
        // respected as-is — and, like a manually-typed separator, switches
        // this row into manual mode so a later keystroke doesn't reformat
        // over it (see the field comment on `manualFormat`).
        const isBulkChange = Math.abs(rawValue.length - r.value.length) > 1;
        if (isBulkChange) return { ...r, value: rawValue, manualFormat: true };

        if (r.manualFormat) return { ...r, value: rawValue };

        // A genuine single-keystroke edit: only keep auto-formatting while
        // the newest character is a plain digit. The moment it isn't (the
        // user typed their own ":", "-", or space, or deleted a character),
        // this row switches to manual mode from here on.
        const addedChar = rawValue.length > r.value.length ? rawValue.slice(-1) : '';
        const isDigitAppend = rawValue.length === r.value.length + 1 && /\d/.test(addedChar);
        if (!isDigitAppend) {
          return { ...r, value: rawValue, manualFormat: rawValue.length > r.value.length };
        }

        const formatted = inputMode === 'mixed' ? autoFormatDurationDigits(rawValue) : formatByMode(inputMode, rawValue);
        return { ...r, value: formatted };
      })
    );
  };

  // Switching the input mode resets every row's value — text typed under one
  // mask (or free-form "Mixed" text) isn't guaranteed to make sense under a
  // different one, so starting fresh avoids stale, confusing leftovers.
  const changeInputMode = (mode: InputMode) => {
    setInputMode(mode);
    setRows((prev) => prev.map((r) => ({ ...r, value: '', manualFormat: false })));
    setInvalidIds(new Set());
    setCalculatedMs(null);
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
      const parsed = parseRowValue(row, inputMode);
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

  const currentMode = INPUT_MODE_OPTIONS.find((o) => o.value === inputMode)!;

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/30 border-b flex-wrap">
        <Calculator className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold">Add / Subtract</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/70 cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-xs">
            Leave this on &quot;Mixed (Auto)&quot; and type anything — a duration, a date, a date+time,
            or raw milliseconds — it&apos;s detected for you. &quot;Duration&quot; fills in its own colons
            as you type digits. &quot;Date&quot; / &quot;Date + Time&quot; accept any layout you type —
            ISO (2026-07-16), DD/MM/YYYY, MM/DD/YYYY, and more. Every row uses the same type.
          </TooltipContent>
        </Tooltip>

        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Input Type</span>
          <Select value={inputMode} onValueChange={(v) => changeInputMode(v as InputMode)}>
            <SelectTrigger className="h-7 w-40 text-[11px] gap-1 px-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INPUT_MODE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  <span className="flex items-center gap-1.5">
                    <opt.icon className="h-3.5 w-3.5" />
                    {opt.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="p-4 space-y-3">
      <div className="space-y-2">
        {rows.map((row) => {
          const parsed = parseRowValue(row, inputMode);
          const isInvalid = invalidIds.has(row.id);
          const badgeLabel = inputMode === 'mixed'
            ? (parsed ? (parsed.type === 'date' ? 'Date' : 'Duration') : (row.value.trim() ? 'Invalid' : 'Empty'))
            : (row.value.trim() ? (parsed ? 'Valid' : 'Invalid') : null);

          return (
            <div key={row.id} className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={() => toggleSign(row.id)}
                    className={cn(
                      'shrink-0',
                      row.sign === '+' ? 'text-green-600 border-green-600/40' : 'text-destructive border-destructive/40',
                    )}
                  >
                    {row.sign === '+' ? <Plus className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {row.sign === '+' ? 'Addition — click to switch to subtraction' : 'Subtraction — click to switch to addition'}
                </TooltipContent>
              </Tooltip>
              <Input
                value={row.value}
                onChange={(e) => updateRow(row.id, e.target.value)}
                placeholder={currentMode.placeholder}
                className={cn('font-mono text-sm flex-1', isInvalid && 'border-destructive')}
              />
              {badgeLabel && (
                <span className={cn(
                  'text-[9px] font-bold px-1.5 py-0.5 rounded border shadow-sm select-none shrink-0 w-16 text-center font-mono',
                  badgeLabel === 'Date' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                    : badgeLabel === 'Duration' || badgeLabel === 'Valid' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    : badgeLabel === 'Invalid' ? 'bg-destructive/10 text-destructive border-destructive/20'
                    : 'bg-muted text-muted-foreground border-border',
                )}>
                  {badgeLabel}
                </span>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeRow(row.id)}
                    disabled={rows.length <= 1}
                    className="shrink-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Remove row</TooltipContent>
              </Tooltip>
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
          Fix the highlighted row{invalidIds.size > 1 ? 's' : ''} — the value doesn&apos;t match its selected type,
          or switch it to &quot;Mixed (Auto)&quot; to have the format detected for you
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
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <code className="font-mono text-xs font-bold block mt-1 truncate">
                        {calculatedMs}
                      </code>
                    </TooltipTrigger>
                    <TooltipContent>{calculatedMs.toString()}</TooltipContent>
                  </Tooltip>
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
