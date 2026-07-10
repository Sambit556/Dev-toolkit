/** Parses "HH:MM:SS" or "HH:MM:SS:mmm" into total milliseconds. Returns null if malformed. */
export function parseDurationString(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const negative = trimmed.startsWith('-');
  const body = negative ? trimmed.slice(1) : trimmed;

  const parts = body.split(':');
  if (parts.length !== 3 && parts.length !== 4) return null;
  if (!parts.every((p) => /^\d+$/.test(p))) return null;

  const [hh, mm, ss, mmm = '0'] = parts;
  const hours = parseInt(hh, 10);
  const minutes = parseInt(mm, 10);
  const seconds = parseInt(ss, 10);
  const millis = parseInt(mmm, 10);

  // We allow fields to exceed standard limits (e.g. minutes > 59) and roll them over
  const totalMs = (((hours * 60 + minutes) * 60 + seconds) * 1000) + millis;
  return negative ? -totalMs : totalMs;
}

/**
 * Auto-inserts ":" separators as digits are typed, so entering an HH:MM:SS:mmm
 * duration doesn't require manually typing the colons — e.g. "013045678" ->
 * "01:30:45:678". Preserves a leading "-" for negative durations. Any other
 * non-digit characters (including colons already in the input) are ignored
 * and re-derived from the digit sequence, so it's safe to run on every
 * keystroke regardless of cursor position or how a deletion happened.
 */
export function autoFormatDurationDigits(raw: string): string {
  const negative = raw.trim().startsWith('-');
  const digits = raw.replace(/\D/g, '').slice(0, 9); // HH(2) + MM(2) + SS(2) + mmm(3)
  const groups = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 6), digits.slice(6, 9)]
    .filter((g) => g.length > 0);
  const formatted = groups.join(':');
  return negative ? `-${formatted}` : formatted;
}

export const DURATION_UNIT_MS = {
  ms: 1,
  sec: 1_000,
  min: 60_000,
  hour: 3_600_000,
  day: 86_400_000,
} as const;

export type DurationUnitKey = keyof typeof DURATION_UNIT_MS;

/** Rounds a unit-converted value to 6 decimals and trims trailing zeros for display. */
export function trimDecimal(n: number): string {
  if (!Number.isFinite(n)) return '';
  return parseFloat(n.toFixed(6)).toString();
}

/** Formats total milliseconds as "HH:MM:SS:mmm". Hours accumulate unbounded (no day rollover). */
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
