import type { TimestampUnit } from '../types/epoch';

export function detectTimestampUnit(timestamp: string): TimestampUnit {
  const digits = timestamp.replace(/^-/, '').length;
  if (digits <= 10) return 'seconds';
  if (digits <= 13) return 'milliseconds';
  return 'nanoseconds';
}

export function toUnixMs(timestamp: string, unit: TimestampUnit): number {
  const num = Number(timestamp);
  switch (unit) {
    case 'seconds':
      return num * 1000;
    case 'milliseconds':
      return num;
    case 'nanoseconds':
      return Math.floor(num / 1_000_000);
  }
}

export function isValidTimestamp(timestamp: string): boolean {
  return /^-?\d+$/.test(timestamp.trim());
}

export function isValidIANATimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function formatDuration(totalSeconds: number): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const abs = Math.abs(totalSeconds);
  const days = Math.floor(abs / 86400);
  const hours = Math.floor((abs % 86400) / 3600);
  const minutes = Math.floor((abs % 3600) / 60);
  const seconds = Math.floor(abs % 60);
  return { days, hours, minutes, seconds };
}
