import { tryRepairJson } from '../lib/json-repair';

describe('tryRepairJson', () => {
  it('removes trailing commas in objects and arrays', () => {
    const result = tryRepairJson('{"a": 1, "b": [1, 2, 3,],}');
    expect(result).not.toBeNull();
    expect(JSON.parse(result!.fixed)).toEqual({ a: 1, b: [1, 2, 3] });
  });

  it('converts single-quoted strings to double-quoted', () => {
    const result = tryRepairJson("{'name': 'Jane', 'age': 30}");
    expect(result).not.toBeNull();
    expect(JSON.parse(result!.fixed)).toEqual({ name: 'Jane', age: 30 });
  });

  it('quotes bareword object keys', () => {
    const result = tryRepairJson('{name: "Jane", age: 30}');
    expect(result).not.toBeNull();
    expect(JSON.parse(result!.fixed)).toEqual({ name: 'Jane', age: 30 });
  });

  it('strips line and block comments', () => {
    const result = tryRepairJson(`{
      // this is a comment
      "a": 1, /* inline */ "b": 2
    }`);
    expect(result).not.toBeNull();
    expect(JSON.parse(result!.fixed)).toEqual({ a: 1, b: 2 });
  });

  it('maps Python/JS-only literals to JSON equivalents', () => {
    const result = tryRepairJson('{"active": True, "deleted": False, "note": None}');
    expect(result).not.toBeNull();
    expect(JSON.parse(result!.fixed)).toEqual({ active: true, deleted: false, note: null });
  });

  it('normalizes smart/curly quotes', () => {
    const result = tryRepairJson('{“name”: “Jane”}');
    expect(result).not.toBeNull();
    expect(JSON.parse(result!.fixed)).toEqual({ name: 'Jane' });
  });

  it('appends missing closing brackets', () => {
    const result = tryRepairJson('{"a": [1, 2, {"b": 3}');
    expect(result).not.toBeNull();
    expect(JSON.parse(result!.fixed)).toEqual({ a: [1, 2, { b: 3 }] });
  });

  it('does not corrupt // inside string values (e.g. URLs)', () => {
    const result = tryRepairJson('{"url": "https://example.com/path", "ok": true,}');
    expect(result).not.toBeNull();
    expect(JSON.parse(result!.fixed)).toEqual({ url: 'https://example.com/path', ok: true });
  });

  it('does not corrupt colons inside string values', () => {
    const result = tryRepairJson('{time: "12:30:00"}');
    expect(result).not.toBeNull();
    expect(JSON.parse(result!.fixed)).toEqual({ time: '12:30:00' });
  });

  it('preserves escaped double quotes inside originally single-quoted strings', () => {
    const result = tryRepairJson(`{'quote': 'She said \\'hi\\' and "bye"'}`);
    expect(result).not.toBeNull();
    expect((JSON.parse(result!.fixed) as { quote: string }).quote).toBe('She said \'hi\' and "bye"');
  });

  it('returns null for input that cannot be auto-fixed', () => {
    const result = tryRepairJson('this is not json at all ###');
    expect(result).toBeNull();
  });

  it('leaves already-valid JSON alone (still parses to the same value)', () => {
    const original = '{"a": 1, "b": [1, 2, 3]}';
    const result = tryRepairJson(original);
    // parseJsonSafe would never call this on already-valid JSON, but the
    // function itself should still be safe if it were.
    expect(result).not.toBeNull();
    expect(JSON.parse(result!.fixed)).toEqual({ a: 1, b: [1, 2, 3] });
  });
});
