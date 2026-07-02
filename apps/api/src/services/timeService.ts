import type {
  TimestampUnit,
  ConvertTimestampResponse,
  ConvertDateResponse,
  CurrentTimeResponse,
} from '@devchrono/shared';
import { detectTimestampUnit, toUnixMs, isValidIANATimezone } from '@devchrono/shared';
import { AppError } from '../middleware/errorHandler';

function formatWithTimezone(ms: number, timezone: string, use24h = true): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: !use24h,
      timeZoneName: 'short',
    }).format(new Date(ms));
  } catch {
    throw new AppError(400, `Invalid timezone: ${timezone}`, 'INVALID_TIMEZONE');
  }
}

function toISO8601(ms: number): string {
  return new Date(ms).toISOString();
}

function toRFC2822(ms: number): string {
  return new Date(ms).toUTCString();
}

export function getCurrentTime(): CurrentTimeResponse {
  const now = Date.now();
  const nowS = Math.floor(now / 1000);
  const nowNanos = BigInt(now) * BigInt(1_000_000);

  return {
    unixSeconds: nowS,
    unixMs: now,
    unixNanos: nowNanos.toString(),
    utc: new Date(now).toUTCString(),
    iso8601: toISO8601(now),
    rfc2822: toRFC2822(now),
  };
}

export function convertTimestamp(
  timestamp: string,
  unit: TimestampUnit | undefined,
  timezone = 'UTC',
): ConvertTimestampResponse {
  if (!isValidIANATimezone(timezone)) {
    throw new AppError(400, `Invalid IANA timezone: ${timezone}`, 'INVALID_TIMEZONE');
  }

  const detectedUnit = unit ?? detectTimestampUnit(timestamp);
  const ms = toUnixMs(timestamp, detectedUnit);
  const unixSeconds = Math.floor(ms / 1000);
  const isNegative = ms < 0;

  // Overflow check (JS Date range: -8640000000000000 to 8640000000000000)
  if (ms < -8_640_000_000_000_000 || ms > 8_640_000_000_000_000) {
    throw new AppError(400, 'Timestamp is out of valid date range', 'TIMESTAMP_OVERFLOW');
  }

  return {
    timestamp,
    unit: detectedUnit,
    utc: new Date(ms).toUTCString(),
    local: formatWithTimezone(ms, timezone),
    iso8601: toISO8601(ms),
    rfc2822: toRFC2822(ms),
    timezone,
    timezoneFormatted: formatWithTimezone(ms, timezone),
    unixSeconds,
    unixMs: ms,
    isNegative,
  };
}

export function convertDate(
  dateString: string,
  timezone = 'UTC',
): ConvertDateResponse {
  if (!isValidIANATimezone(timezone)) {
    throw new AppError(400, `Invalid IANA timezone: ${timezone}`, 'INVALID_TIMEZONE');
  }

  let ms: number;

  // Try parsing common date formats
  const trimmed = dateString.trim();

  // ISO 8601
  if (/^\d{4}-\d{2}-\d{2}(T|[\s])\d{2}:\d{2}:\d{2}/.test(trimmed)) {
    ms = new Date(trimmed).getTime();
  }
  // YYYY-MM-DD
  else if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    ms = new Date(`${trimmed}T00:00:00Z`).getTime();
  }
  // MM/DD/YYYY
  else if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const [month, day, year] = trimmed.split('/');
    ms = new Date(`${year}-${month}-${day}T00:00:00Z`).getTime();
  }
  // DD-MM-YYYY
  else if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split('-');
    ms = new Date(`${year}-${month}-${day}T00:00:00Z`).getTime();
  }
  // RFC 2822 or other
  else {
    ms = new Date(trimmed).getTime();
  }

  if (isNaN(ms)) {
    throw new AppError(400, `Cannot parse date: "${dateString}"`, 'INVALID_DATE');
  }

  const unixS = Math.floor(ms / 1000);
  const unixMs = ms;
  const nanos = BigInt(ms) * BigInt(1_000_000);

  return {
    unixSeconds: unixS,
    unixMs,
    unixNanos: nanos.toString(),
    utc: new Date(ms).toUTCString(),
    iso8601: toISO8601(ms),
  };
}
