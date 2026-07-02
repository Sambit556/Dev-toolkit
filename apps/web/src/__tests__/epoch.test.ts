import {
  detectTimestampUnit,
  toUnixMs,
  parseDateString,
  timestampToDate,
  getStartEnd,
} from '../lib/epoch';

describe('epoch utilities', () => {
  describe('detectTimestampUnit', () => {
    it('detects seconds (10 digits)', () => {
      expect(detectTimestampUnit('1700000000')).toBe('seconds');
    });
    it('detects milliseconds (13 digits)', () => {
      expect(detectTimestampUnit('1700000000000')).toBe('milliseconds');
    });
    it('detects nanoseconds (16 digits)', () => {
      expect(detectTimestampUnit('1700000000000000')).toBe('nanoseconds');
    });
    it('detects nanoseconds (19 digits)', () => {
      expect(detectTimestampUnit('1700000000000000000')).toBe('nanoseconds');
    });
    it('handles 9-digit timestamps as seconds', () => {
      expect(detectTimestampUnit('999999999')).toBe('seconds');
    });
  });

  describe('toUnixMs', () => {
    it('converts seconds to ms', () => {
      expect(toUnixMs('1700000000', 'seconds')).toBe(1700000000000);
    });
    it('returns ms as-is', () => {
      expect(toUnixMs('1700000000000', 'milliseconds')).toBe(1700000000000);
    });
    it('converts nanoseconds to ms using BigInt', () => {
      expect(toUnixMs('1700000000000000000', 'nanoseconds')).toBe(1700000000000);
    });
  });

  describe('parseDateString', () => {
    it('parses ISO 8601 date', () => {
      const d = parseDateString('2023-11-14T22:13:20.000Z');
      expect(d).not.toBeNull();
      expect(d!.getTime()).toBe(1700000000000);
    });

    it('parses YYYY-MM-DD', () => {
      const d = parseDateString('2023-11-14');
      expect(d).not.toBeNull();
      expect(d!.getUTCFullYear()).toBe(2023);
    });

    it('parses MM/DD/YYYY', () => {
      const d = parseDateString('11/14/2023');
      expect(d).not.toBeNull();
      expect(d!.getUTCFullYear()).toBe(2023);
    });

    it('parses DD-MM-YYYY', () => {
      const d = parseDateString('14-11-2023');
      expect(d).not.toBeNull();
      expect(d!.getUTCMonth()).toBe(10); // November = 10 (0-indexed)
    });

    it('returns null for invalid dates', () => {
      const d = parseDateString('not-a-date');
      expect(d).toBeNull();
    });

    it('returns null for empty string', () => {
      const d = parseDateString('');
      expect(d).toBeNull();
    });
  });

  describe('timestampToDate', () => {
    it('converts seconds timestamp', () => {
      const result = timestampToDate('1700000000', 'seconds', 'UTC');
      expect(result.unixSeconds).toBe(1700000000);
      expect(result.iso8601).toBe('2023-11-14T22:13:20.000Z');
    });

    it('handles zero timestamp (epoch)', () => {
      const result = timestampToDate('0', 'seconds', 'UTC');
      expect(result.unixSeconds).toBe(0);
      expect(result.iso8601).toBe('1970-01-01T00:00:00.000Z');
      expect(result.isNegative).toBe(false);
    });

    it('handles negative timestamp', () => {
      const result = timestampToDate('-86400', 'seconds', 'UTC');
      expect(result.isNegative).toBe(true);
      expect(result.unixSeconds).toBe(-86400);
    });

    it('throws for overflow timestamp', () => {
      expect(() => timestampToDate('999999999999999999', 'seconds', 'UTC')).toThrow();
    });

    it('provides nanoseconds', () => {
      const result = timestampToDate('1700000000', 'seconds', 'UTC');
      expect(result.unixNanos).toBe('1700000000000000000');
    });
  });

  describe('getStartEnd', () => {
    const date = new Date('2023-11-14T00:00:00Z');

    it('returns start and end of day', () => {
      const { start, end } = getStartEnd(date, 'day', 'UTC');
      expect(start).toBeLessThan(end);
      expect(end - start).toBe(86399);
    });

    it('returns start and end of month', () => {
      const { start, end } = getStartEnd(date, 'month', 'UTC');
      expect(start).toBeLessThan(end);
      const startDate = new Date(start * 1000);
      const endDate = new Date(end * 1000);
      expect(startDate.getUTCDate()).toBe(1);
      expect(endDate.getUTCDate()).toBe(30); // November has 30 days
    });

    it('returns start and end of year', () => {
      const { start, end } = getStartEnd(date, 'year', 'UTC');
      const startDate = new Date(start * 1000);
      const endDate = new Date(end * 1000);
      expect(startDate.getUTCMonth()).toBe(0); // January
      expect(endDate.getUTCMonth()).toBe(11); // December
    });
  });
});
