export function getPeriodBoundaries(dateStr: string, period: 'day' | 'month' | 'year', timezone: string) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date: ${dateStr}`);

  const year = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric' }).format(date));
  const month = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: timezone, month: 'numeric' }).format(date)) - 1;
  const day = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: timezone, day: 'numeric' }).format(date));

  let startMs: number, endMs: number;
  switch (period) {
    case 'day':
      startMs = Date.UTC(year, month, day, 0, 0, 0, 0);
      endMs = Date.UTC(year, month, day, 23, 59, 59, 999);
      break;
    case 'month':
      startMs = Date.UTC(year, month, 1, 0, 0, 0, 0);
      endMs = Date.UTC(year, month + 1, 0, 23, 59, 59, 999);
      break;
    case 'year':
      startMs = Date.UTC(year, 0, 1, 0, 0, 0, 0);
      endMs = Date.UTC(year, 11, 31, 23, 59, 59, 999);
      break;
  }
  return {
    startUnixSeconds: Math.floor(startMs / 1000),
    endUnixSeconds: Math.floor(endMs / 1000),
    startIso: new Date(startMs).toISOString(),
    endIso: new Date(endMs).toISOString(),
  };
}

// --- Duration conversion (HH:MM:SS:mmm <-> unit values) ---

export function parseDurationString(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const negative = trimmed.startsWith('-');
  const body = negative ? trimmed.slice(1) : trimmed;
  const parts = body.split(':');
  if (parts.length !== 3 && parts.length !== 4) return null;
  if (!parts.every((p) => /^\d+$/.test(p))) return null;
  const [hh, mm, ss, mmm = '0'] = parts;
  const totalMs = (((parseInt(hh, 10) * 60 + parseInt(mm, 10)) * 60 + parseInt(ss, 10)) * 1000) + parseInt(mmm, 10);
  return negative ? -totalMs : totalMs;
}

export function formatMsToDuration(ms: number): string {
  const negative = ms < 0;
  const abs = Math.abs(Math.round(ms));
  const millis = abs % 1000;
  const totalSeconds = Math.floor(abs / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);
  const pad = (n: number, len = 2) => n.toString().padStart(len, '0');
  const formatted = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}:${pad(millis, 3)}`;
  return negative ? `-${formatted}` : formatted;
}

export const DURATION_UNIT_MS = { ms: 1, sec: 1_000, min: 60_000, hour: 3_600_000, day: 86_400_000 } as const;
export type DurationUnitKey = keyof typeof DURATION_UNIT_MS;

export function convertDuration(value: string, fromUnit: DurationUnitKey | 'hhmmss', toUnit: DurationUnitKey | 'hhmmss'): string {
  let ms: number;
  if (fromUnit === 'hhmmss') {
    const parsed = parseDurationString(value);
    if (parsed === null) throw new Error(`Invalid duration string: "${value}" (expected HH:MM:SS or HH:MM:SS:mmm)`);
    ms = parsed;
  } else {
    ms = Number(value) * DURATION_UNIT_MS[fromUnit];
  }
  if (toUnit === 'hhmmss') return formatMsToDuration(ms);
  const converted = ms / DURATION_UNIT_MS[toUnit];
  return parseFloat(converted.toFixed(6)).toString();
}

export function addSubtractDurations(durationsMs: number[], operations: ('add' | 'sub')[]): string {
  let total = durationsMs[0] ?? 0;
  for (let i = 1; i < durationsMs.length; i++) {
    total = operations[i - 1] === 'sub' ? total - durationsMs[i] : total + durationsMs[i];
  }
  return formatMsToDuration(total);
}

export const TIMEZONE_LIST = Intl.supportedValuesOf('timeZone');

export function listTimezones(search?: string): string[] {
  if (!search) return TIMEZONE_LIST;
  const q = search.toLowerCase();
  return TIMEZONE_LIST.filter((tz) => tz.toLowerCase().includes(q));
}

export const CODE_EXAMPLES = {
  javascript: (ts: number) => `// JavaScript
const timestamp = ${ts};
const date = new Date(timestamp * 1000);
console.log(date.toISOString());`,
  python: (ts: number) => `# Python
import datetime
timestamp = ${ts}
dt = datetime.datetime.fromtimestamp(timestamp, tz=datetime.timezone.utc)
print(dt.isoformat())`,
  java: (ts: number) => `// Java
import java.time.Instant;
Instant instant = Instant.ofEpochSecond(${ts}L);
System.out.println(instant);`,
  go: (ts: number) => `// Go
t := time.Unix(${ts}, 0).UTC()
fmt.Println(t.Format(time.RFC3339))`,
  postgresql: (ts: number) => `-- PostgreSQL
SELECT to_timestamp(${ts}) AS datetime;`,
  mysql: (ts: number) => `-- MySQL
SELECT FROM_UNIXTIME(${ts}) AS datetime;`,
  linux: (ts: number) => `# Linux / macOS
date -d @${ts}           # Linux (GNU date)
date -r ${ts}            # macOS (BSD date)`,
} as const;

export type CodeLanguage = keyof typeof CODE_EXAMPLES;

export function getEpochCodeExample(language: CodeLanguage, unixSeconds: number): string {
  return CODE_EXAMPLES[language](unixSeconds);
}
