import { getCurrentTime, convertTimestamp, convertDate } from '../services/timeService';

describe('timeService', () => {
  describe('getCurrentTime', () => {
    it('returns all timestamp units', () => {
      const result = getCurrentTime();
      expect(result.unixSeconds).toBeGreaterThan(0);
      expect(result.unixMs).toBeGreaterThan(result.unixSeconds);
      expect(result.unixNanos).toBeDefined();
      expect(result.iso8601).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('convertTimestamp', () => {
    it('converts seconds timestamp to date', () => {
      const result = convertTimestamp('1700000000', 'seconds', 'UTC');
      expect(result.unixSeconds).toBe(1700000000);
      expect(result.unit).toBe('seconds');
      expect(result.iso8601).toMatch(/2026/);
    });

    it('converts milliseconds timestamp', () => {
      const result = convertTimestamp('1700000000000', 'milliseconds', 'UTC');
      expect(result.unixMs).toBe(1700000000000);
      expect(result.unit).toBe('milliseconds');
    });

    it('auto-detects seconds unit (10 digits)', () => {
      const result = convertTimestamp('1700000000', undefined, 'UTC');
      expect(result.unit).toBe('seconds');
    });

    it('auto-detects milliseconds unit (13 digits)', () => {
      const result = convertTimestamp('1700000000000', undefined, 'UTC');
      expect(result.unit).toBe('milliseconds');
    });

    it('handles zero timestamp (Unix epoch)', () => {
      const result = convertTimestamp('0', 'seconds', 'UTC');
      expect(result.unixSeconds).toBe(0);
      expect(result.iso8601).toBe('1970-01-01T00:00:00.000Z');
    });

    it('handles negative timestamp (before 1970)', () => {
      const result = convertTimestamp('-86400', 'seconds', 'UTC');
      expect(result.isNegative).toBe(true);
      expect(result.unixSeconds).toBe(-86400);
    });

    it('throws on invalid timezone', () => {
      expect(() => convertTimestamp('1700000000', 'seconds', 'Invalid/Zone')).toThrow();
    });
  });

  describe('convertDate', () => {
    it('converts ISO 8601 date to timestamp', () => {
      const result = convertDate('2026-11-14T22:13:20.000Z', 'UTC');
      expect(result.unixSeconds).toBe(1700000000);
    });

    it('converts YYYY-MM-DD date', () => {
      const result = convertDate('2026-11-14', 'UTC');
      expect(result.unixSeconds).toBeGreaterThan(0);
    });

    it('converts MM/DD/YYYY date', () => {
      const result = convertDate('11/14/2026', 'UTC');
      expect(result.unixSeconds).toBeGreaterThan(0);
    });

    it('throws on invalid date', () => {
      expect(() => convertDate('not-a-date', 'UTC')).toThrow();
    });
  });
});
