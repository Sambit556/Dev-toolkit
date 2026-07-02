export type TimestampUnit = 'seconds' | 'milliseconds' | 'nanoseconds';

export type DateFormat =
  | 'YYYY-MM-DD'
  | 'YYYY-MM-DD HH:mm:ss'
  | 'ISO8601'
  | 'RFC2822'
  | 'MM/DD/YYYY'
  | 'DD-MM-YYYY';

export interface ConvertTimestampRequest {
  timestamp: string;
  unit?: TimestampUnit;
  timezone?: string;
}

export interface ConvertTimestampResponse {
  timestamp: string;
  unit: TimestampUnit;
  utc: string;
  local: string;
  iso8601: string;
  rfc2822: string;
  timezone: string;
  timezoneFormatted: string;
  unixSeconds: number;
  unixMs: number;
  isNegative: boolean;
}

export interface ConvertDateRequest {
  dateString: string;
  timezone?: string;
  format?: DateFormat;
}

export interface ConvertDateResponse {
  unixSeconds: number;
  unixMs: number;
  unixNanos: string;
  utc: string;
  iso8601: string;
}

export interface CurrentTimeResponse {
  unixSeconds: number;
  unixMs: number;
  unixNanos: string;
  utc: string;
  iso8601: string;
  rfc2822: string;
}

export interface DurationBreakdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  totalMs: number;
}

export interface EpochPreferences {
  defaultUnit: TimestampUnit;
  use24Hour: boolean;
  defaultTimezone: string;
  defaultDateFormat: DateFormat;
}
