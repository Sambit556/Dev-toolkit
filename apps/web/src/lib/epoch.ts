import type { TimestampUnit, EpochPreferences } from '@devchrono/shared';
import { detectTimestampUnit, formatDuration } from '@devchrono/shared';

export { detectTimestampUnit };

export const DEFAULT_PREFERENCES: EpochPreferences = {
  defaultUnit: 'seconds',
  use24Hour: true,
  defaultTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  defaultDateFormat: 'YYYY-MM-DD HH:mm:ss',
};

export function toUnixMs(value: string, unit: TimestampUnit): number {
  // Use BigInt for nanoseconds to avoid precision loss
  if (unit === 'nanoseconds') {
    return Number(BigInt(value) / BigInt(1_000_000));
  }
  const num = Number(value);
  if (unit === 'seconds') return num * 1000;
  return num; // milliseconds
}

export function fromUnixMs(ms: number, unit: TimestampUnit): string {
  if (unit === 'nanoseconds') {
    return (BigInt(ms) * BigInt(1_000_000)).toString();
  }
  if (unit === 'seconds') return Math.floor(ms / 1000).toString();
  return ms.toString();
}

export interface DateTimeResult {
  utc: string;
  local: string;
  timezone: string;
  iso8601: string;
  rfc2822: string;
  unixSeconds: number;
  unixMs: number;
  unixNanos: string;
  unixMicros: string;
  isNegative: boolean;
  formattedDate: string;
}

export function timestampToDate(
  value: string,
  unit: TimestampUnit,
  timezone: string,
  use24Hour = true,
): DateTimeResult {
  const ms = toUnixMs(value, unit);

  if (ms < -8_640_000_000_000_000 || ms > 8_640_000_000_000_000) {
    throw new Error('Timestamp is out of valid date range (±275,760 years)');
  }

  const date = new Date(ms);
  const timeOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: !use24Hour,
    timeZoneName: 'long',
  };

  const localFormatter = new Intl.DateTimeFormat('en-US', {
    ...timeOptions,
    timeZone: timezone,
  });

  return {
    utc: date.toUTCString(),
    local: localFormatter.format(date),
    timezone,
    iso8601: date.toISOString(),
    rfc2822: date.toUTCString(),
    unixSeconds: Math.floor(ms / 1000),
    unixMs: ms,
    unixNanos: (BigInt(ms) * BigInt(1_000_000)).toString(),
    unixMicros: (BigInt(ms) * BigInt(1_000)).toString(),
    isNegative: ms < 0,
    formattedDate: formatDateForDisplay(date, timezone, use24Hour),
  };
}

const RELATIVE_UNITS: { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
  { unit: 'year', ms: 365 * 86400 * 1000 },
  { unit: 'month', ms: 30 * 86400 * 1000 },
  { unit: 'week', ms: 7 * 86400 * 1000 },
  { unit: 'day', ms: 86400 * 1000 },
  { unit: 'hour', ms: 3600 * 1000 },
  { unit: 'minute', ms: 60 * 1000 },
  { unit: 'second', ms: 1000 },
];

const relativeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

/** e.g. "43 minutes ago" / "in 2 days" — relative to now unless `nowMs` is given. */
export function formatRelativeTime(targetMs: number, nowMs = Date.now()): string {
  const diffMs = targetMs - nowMs;
  const absMs = Math.abs(diffMs);
  if (absMs < 1000) return 'just now';

  for (const { unit, ms } of RELATIVE_UNITS) {
    if (absMs >= ms || unit === 'second') {
      return relativeFormatter.format(Math.round(diffMs / ms), unit);
    }
  }
  return 'just now';
}

export function formatDateForDisplay(date: Date, timezone: string, use24Hour = true): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: !use24Hour,
    weekday: 'long',
  }).format(date);
}

export function parseDateString(dateString: string, timezone = 'UTC'): Date | null {
  const s = dateString.trim();
  if (!s) return null;

  // ISO 8601 / RFC 2822
  let date = new Date(s);
  if (!isNaN(date.getTime())) return date;

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    date = new Date(`${s}T00:00:00Z`);
    if (!isNaN(date.getTime())) return date;
  }

  // YYYY-MM-DD HH:mm:ss
  if (/^\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}:\d{2}$/.test(s)) {
    date = new Date(s.replace(' ', 'T') + (timezone === 'UTC' ? 'Z' : ''));
    if (!isNaN(date.getTime())) return date;
  }

  // MM/DD/YYYY
  const mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) {
    date = new Date(`${mdy[3]}-${mdy[1].padStart(2, '0')}-${mdy[2].padStart(2, '0')}T00:00:00Z`);
    if (!isNaN(date.getTime())) return date;
  }

  // DD-MM-YYYY
  const dmy = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dmy) {
    date = new Date(`${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}T00:00:00Z`);
    if (!isNaN(date.getTime())) return date;
  }

  return null;
}

export function getStartEnd(
  date: Date,
  period: 'day' | 'month' | 'year',
  timezone: string,
): { start: number; end: number } {
  const year = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric' }).format(date));
  const month = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: timezone, month: 'numeric' }).format(date)) - 1;
  const day = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: timezone, day: 'numeric' }).format(date));

  let startMs: number, endMs: number;

  switch (period) {
    case 'day':
      startMs = new Date(Date.UTC(year, month, day, 0, 0, 0, 0)).getTime();
      endMs = new Date(Date.UTC(year, month, day, 23, 59, 59, 999)).getTime();
      break;
    case 'month':
      startMs = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0)).getTime();
      endMs = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999)).getTime();
      break;
    case 'year':
      startMs = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0)).getTime();
      endMs = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)).getTime();
      break;
  }

  return {
    start: Math.floor(startMs / 1000),
    end: Math.floor(endMs / 1000),
  };
}

export { formatDuration };

export const TIMEZONE_LIST = Intl.supportedValuesOf('timeZone');

export const CODE_EXAMPLES = {
  javascript: (ts: number) => `// JavaScript
const timestamp = ${ts};
const date = new Date(timestamp * 1000);
console.log(date.toISOString());        // "${new Date(ts * 1000).toISOString()}"
console.log(date.toLocaleDateString()); // locale date`,

  python: (ts: number) => `# Python
import datetime
timestamp = ${ts}
dt = datetime.datetime.fromtimestamp(timestamp, tz=datetime.timezone.utc)
print(dt.isoformat())  # "${new Date(ts * 1000).toISOString()}"`,

  java: (ts: number) => `// Java
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;

long timestamp = ${ts}L;
Instant instant = Instant.ofEpochSecond(timestamp);
ZonedDateTime zdt = instant.atZone(ZoneId.of("UTC"));
System.out.println(zdt); // ${new Date(ts * 1000).toISOString()}`,

  go: (ts: number) => `// Go
import (
  "fmt"
  "time"
)

timestamp := int64(${ts})
t := time.Unix(timestamp, 0).UTC()
fmt.Println(t.Format(time.RFC3339)) // ${new Date(ts * 1000).toISOString()}`,

  postgresql: (ts: number) => `-- PostgreSQL
SELECT
  to_timestamp(${ts}) AS datetime,
  to_timestamp(${ts}) AT TIME ZONE 'UTC' AS utc_datetime,
  extract(epoch from now())::bigint AS current_epoch;`,

  mysql: (ts: number) => `-- MySQL
SELECT
  FROM_UNIXTIME(${ts}) AS datetime,
  FROM_UNIXTIME(${ts}, '%Y-%m-%d %H:%i:%s') AS formatted,
  UNIX_TIMESTAMP(NOW()) AS current_epoch;`,

  linux: (ts: number) => `# Linux / macOS
date -d @${ts}           # Linux (GNU date)
date -r ${ts}            # macOS (BSD date)
date -r ${ts} -u         # UTC on macOS
echo $(( $(date +%s) ))  # Current epoch`,
} as const;

export type CodeLanguage = keyof typeof CODE_EXAMPLES;
