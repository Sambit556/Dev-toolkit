import {
  parseJsonSafe,
  formatJson,
  minifyJson,
  sortKeysDeep,
  removeNullValues,
  generateTypeScript,
  jsonToCsv,
  countNodes,
} from '../lib/json-utils';

describe('json-utils', () => {
  describe('parseJsonSafe', () => {
    it('parses valid JSON object', () => {
      const { value, error } = parseJsonSafe('{"a":1}');
      expect(error).toBeNull();
      expect(value).toEqual({ a: 1 });
    });

    it('parses valid JSON array', () => {
      const { value, error } = parseJsonSafe('[1,2,3]');
      expect(error).toBeNull();
      expect(value).toEqual([1, 2, 3]);
    });

    it('returns error for invalid JSON', () => {
      const { value, error } = parseJsonSafe('{bad}');
      expect(value).toBeNull();
      expect(error).not.toBeNull();
      expect(error!.message).toBeDefined();
    });

    it('provides line/column for multi-line error', () => {
      const json = '{\n  "a": 1,\n  "b":\n}';
      const { error } = parseJsonSafe(json);
      expect(error).not.toBeNull();
    });

    it('parses null', () => {
      const { value, error } = parseJsonSafe('null');
      expect(error).toBeNull();
      expect(value).toBeNull();
    });
  });

  describe('formatJson', () => {
    it('formats minified JSON', () => {
      const result = formatJson('{"a":1,"b":2}');
      expect(result).toContain('\n');
      expect(result).toContain('  ');
    });

    it('respects indent level', () => {
      const result = formatJson('{"a":1}', 4);
      expect(result).toContain('    ');
    });

    it('sorts keys when requested', () => {
      const result = formatJson('{"z":3,"a":1,"m":2}', 2, true);
      const keys = Object.keys(JSON.parse(result));
      expect(keys).toEqual(['a', 'm', 'z']);
    });

    it('throws for invalid JSON', () => {
      expect(() => formatJson('{invalid}')).toThrow();
    });
  });

  describe('minifyJson', () => {
    it('removes whitespace', () => {
      const formatted = JSON.stringify({ a: 1, b: [1, 2] }, null, 2);
      const result = minifyJson(formatted);
      expect(result).not.toContain('\n');
      expect(result).not.toContain('  ');
    });

    it('throws for invalid JSON', () => {
      expect(() => minifyJson('{bad}')).toThrow();
    });
  });

  describe('sortKeysDeep', () => {
    it('sorts top-level keys', () => {
      const result = sortKeysDeep({ z: 1, a: 2, m: 3 }) as Record<string, unknown>;
      expect(Object.keys(result)).toEqual(['a', 'm', 'z']);
    });

    it('sorts nested keys', () => {
      const result = sortKeysDeep({ b: { z: 1, a: 2 }, a: 1 }) as Record<string, unknown>;
      expect(Object.keys(result)).toEqual(['a', 'b']);
      expect(Object.keys(result.b as Record<string, unknown>)).toEqual(['a', 'z']);
    });

    it('preserves arrays', () => {
      const result = sortKeysDeep([3, 1, 2]);
      expect(result).toEqual([3, 1, 2]);
    });
  });

  describe('removeNullValues', () => {
    it('removes null values from object', () => {
      const result = removeNullValues({ a: 1, b: null, c: 'hello' }) as Record<string, unknown>;
      expect(result.a).toBe(1);
      expect('b' in result).toBe(false);
      expect(result.c).toBe('hello');
    });

    it('removes null from arrays', () => {
      const result = removeNullValues([1, null, 2, null, 3]);
      expect(result).toEqual([1, 2, 3]);
    });

    it('handles nested nulls', () => {
      const result = removeNullValues({ a: { b: null, c: 1 } }) as Record<string, unknown>;
      const inner = result.a as Record<string, unknown>;
      expect('b' in inner).toBe(false);
      expect(inner.c).toBe(1);
    });
  });

  describe('generateTypeScript', () => {
    it('generates interface for simple object', () => {
      const ts = generateTypeScript('{"name":"John","age":30}');
      expect(ts).toContain('interface Root');
      expect(ts).toContain('"name": string');
      expect(ts).toContain('"age": number');
    });

    it('handles array types', () => {
      const ts = generateTypeScript('[1,2,3]', 'Numbers');
      expect(ts).toContain('number[]');
    });
  });

  describe('jsonToCsv', () => {
    it('converts array of objects to CSV', () => {
      const csv = jsonToCsv('[{"a":1,"b":2},{"a":3,"b":4}]');
      const lines = csv.split('\n');
      expect(lines[0]).toBe('a,b');
      expect(lines[1]).toBe('1,2');
      expect(lines[2]).toBe('3,4');
    });

    it('throws for non-array input', () => {
      expect(() => jsonToCsv('{"a":1}')).toThrow();
    });
  });

  describe('countNodes', () => {
    it('counts primitive as 1', () => {
      expect(countNodes(42)).toBe(1);
      expect(countNodes('hello')).toBe(1);
      expect(countNodes(null)).toBe(1);
    });

    it('counts object nodes', () => {
      expect(countNodes({ a: 1, b: 2 })).toBe(3); // object + 2 values
    });

    it('counts array nodes', () => {
      expect(countNodes([1, 2, 3])).toBe(4); // array + 3 values
    });

    it('counts nested nodes', () => {
      expect(countNodes({ a: { b: 1 } })).toBe(3); // root + inner obj + value
    });
  });
});
