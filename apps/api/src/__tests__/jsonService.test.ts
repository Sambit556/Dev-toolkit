import { validateJson, formatJson, minifyJson } from '../services/jsonService';

describe('jsonService', () => {
  describe('validateJson', () => {
    it('validates correct JSON', () => {
      const result = validateJson('{"name":"test","value":42}');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('detects invalid JSON with line/column info', () => {
      const result = validateJson('{"name": "test",}');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBeDefined();
    });

    it('validates JSON array', () => {
      const result = validateJson('[1,2,3]');
      expect(result.valid).toBe(true);
    });

    it('validates null', () => {
      const result = validateJson('null');
      expect(result.valid).toBe(true);
    });

    it('validates nested JSON', () => {
      const json = JSON.stringify({ a: { b: { c: [1, 2, 3] } } });
      const result = validateJson(json);
      expect(result.valid).toBe(true);
      expect(result.nodeCount).toBeGreaterThan(0);
    });

    it('returns size in bytes', () => {
      const json = '{"x":1}';
      const result = validateJson(json);
      expect(result.size).toBe(Buffer.byteLength(json, 'utf8'));
    });
  });

  describe('formatJson', () => {
    it('formats minified JSON', () => {
      const result = formatJson('{"a":1,"b":2}');
      expect(result.valid).toBe(true);
      expect(result.formatted).toContain('\n');
    });

    it('sorts keys when requested', () => {
      const result = formatJson('{"z":1,"a":2}', 2, true);
      const parsed = JSON.parse(result.formatted);
      expect(Object.keys(parsed)[0]).toBe('a');
    });

    it('returns error for invalid JSON', () => {
      const result = formatJson('{bad json}');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('respects indent setting', () => {
      const result = formatJson('{"a":1}', 4);
      expect(result.formatted).toContain('    ');
    });
  });

  describe('minifyJson', () => {
    it('minifies formatted JSON', () => {
      const formatted = JSON.stringify({ a: 1, b: 2 }, null, 2);
      const result = minifyJson(formatted);
      expect(result.minified).toBe('{"a":1,"b":2}');
      expect(result.savingPercent).toBeGreaterThan(0);
    });

    it('reports size savings', () => {
      const formatted = JSON.stringify({ key: 'value' }, null, 2);
      const result = minifyJson(formatted);
      expect(result.originalSize).toBeGreaterThan(result.minifiedSize);
    });

    it('throws on invalid JSON', () => {
      expect(() => minifyJson('{invalid}')).toThrow();
    });
  });
});
