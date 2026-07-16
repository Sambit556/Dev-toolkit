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

  it('reports changed: false and fixCount: 0 for already-valid JSON', () => {
    const result = tryRepairJson('{"a": 1}');
    expect(result).toEqual({ fixed: '{"a": 1}', changed: false, fixCount: 0, fixes: [] });
  });

  it('quotes unquoted string values', () => {
    const result = tryRepairJson('{name: John, city: NYC}');
    expect(result).not.toBeNull();
    expect(JSON.parse(result!.fixed)).toEqual({ name: 'John', city: 'NYC' });
  });

  it('inserts missing commas between object properties', () => {
    const result = tryRepairJson('{"a": 1 "b": 2 "c": 3}');
    expect(result).not.toBeNull();
    expect(JSON.parse(result!.fixed)).toEqual({ a: 1, b: 2, c: 3 });
  });

  it('inserts missing commas between array elements', () => {
    const result = tryRepairJson('[1 2 3 "four"]');
    expect(result).not.toBeNull();
    expect(JSON.parse(result!.fixed)).toEqual([1, 2, 3, 'four']);
  });

  it('inserts a missing colon between key and value', () => {
    const result = tryRepairJson('{"a" 1, "b": 2}');
    expect(result).not.toBeNull();
    expect(JSON.parse(result!.fixed)).toEqual({ a: 1, b: 2 });
  });

  it('removes extra/duplicated commas', () => {
    const result = tryRepairJson('{"a": 1,, "b": [1,, 2]}');
    expect(result).not.toBeNull();
    expect(JSON.parse(result!.fixed)).toEqual({ a: 1, b: [1, 2] });
  });

  it('strips function values and replaces them with null', () => {
    const result = tryRepairJson('{"a": 1, "onClick": function() { return 1; }, "b": 2}');
    expect(result).not.toBeNull();
    expect(JSON.parse(result!.fixed)).toEqual({ a: 1, onClick: null, b: 2 });
  });

  it('strips arrow function values and replaces them with null', () => {
    const result = tryRepairJson('{"a": 1, "handler": (x) => x + 1, "b": 2}');
    expect(result).not.toBeNull();
    expect(JSON.parse(result!.fixed)).toEqual({ a: 1, handler: null, b: 2 });
  });

  it('maps NaN/Infinity/undefined to JSON-safe equivalents', () => {
    const result = tryRepairJson('{"a": NaN, "b": Infinity, "c": undefined}');
    expect(result).not.toBeNull();
    expect(JSON.parse(result!.fixed)).toEqual({ a: null, b: null, c: null });
  });

  it('strips a console-log style label before the JSON value', () => {
    const result = tryRepairJson('Object { "name": "Jane", "age": 30 }');
    expect(result).not.toBeNull();
    expect(JSON.parse(result!.fixed)).toEqual({ name: 'Jane', age: 30 });
  });

  it('wraps bare top-level key/value pairs in an object', () => {
    const result = tryRepairJson('name: "Jane", age: 30');
    expect(result).not.toBeNull();
    expect(JSON.parse(result!.fixed)).toEqual({ name: 'Jane', age: 30 });
  });

  it('preserves property order after repair', () => {
    const result = tryRepairJson("{'z': 1, 'a': 2, 'm': 3,}");
    expect(result).not.toBeNull();
    expect(Object.keys(JSON.parse(result!.fixed))).toEqual(['z', 'a', 'm']);
  });

  it('reports a positive fixCount and matching fixes length when repairs are made', () => {
    const result = tryRepairJson("{name: 'Jane', age: 30,}");
    expect(result).not.toBeNull();
    expect(result!.changed).toBe(true);
    expect(result!.fixCount).toBeGreaterThan(0);
    expect(result!.fixes).toHaveLength(result!.fixCount);
  });

  it('returns null (unrecoverable) when trailing garbage follows a valid value', () => {
    const result = tryRepairJson('{"a": 1} some trailing garbage');
    expect(result).toBeNull();
  });

  it('fills genuinely missing values with null instead of aborting', () => {
    const result = tryRepairJson('{name:, city:\ncountry:\n}');
    expect(result).not.toBeNull();
    expect(JSON.parse(result!.fixed)).toEqual({ name: null, city: null, country: null });
  });

  it('captures IPs, versions, dates and MAC addresses as strings instead of breaking', () => {
    const result = tryRepairJson('{ip:192.168.1.20, version:1.0.0, date:2026-07-16, mac:AA:BB:CC:DD:EE:FF, pct:95%}');
    expect(result).not.toBeNull();
    expect(JSON.parse(result!.fixed)).toEqual({
      ip: '192.168.1.20',
      version: '1.0.0',
      date: '2026-07-16',
      mac: 'AA:BB:CC:DD:EE:FF',
      pct: '95%',
    });
  });

  it('captures unrecognized single-line tokens (hex colors, HTML) as strings', () => {
    const result = tryRepairJson('{color:#FF0000, html:<div>Hello</div>}');
    expect(result).not.toBeNull();
    expect(JSON.parse(result!.fixed)).toEqual({ color: '#FF0000', html: '<div>Hello</div>' });
  });

  it('discards garbage entries with no key:value shape instead of aborting the whole object', () => {
    const result = tryRepairJson('{a:1, ~~~~~~~, <<<<<<< HEAD, b:2}');
    expect(result).not.toBeNull();
    expect(JSON.parse(result!.fixed)).toEqual({ a: 1, b: 2 });
    expect(result!.fixes.some((f) => f.includes('Discarded'))).toBe(true);
  });

  it('preserves Windows-style backslashes instead of dropping them', () => {
    const result = tryRepairJson('{"path": "C:\\Users\\Admin\\Test"}');
    expect(result).not.toBeNull();
    expect((JSON.parse(result!.fixed) as { path: string }).path).toBe('C:\\Users\\Admin\\Test');
  });

  it('does not treat an apostrophe as closing a single-quoted string', () => {
    const result = tryRepairJson("{'note': 'John's Laptop'}");
    expect(result).not.toBeNull();
    expect((JSON.parse(result!.fixed) as { note: string }).note).toBe("John's Laptop");
  });

  it('continues a double-quoted string across a real embedded newline', () => {
    const result = tryRepairJson('{"greeting": "hello,\nworld", "ok": true}');
    expect(result).not.toBeNull();
    const parsed = JSON.parse(result!.fixed) as { greeting: string; ok: boolean };
    expect(parsed.greeting).toBe('hello,\nworld');
    expect(parsed.ok).toBe(true);
  });

  it('does not merge unrelated keys when an unterminated string has no real closer nearby', () => {
    const result = tryRepairJson("{hindi:'नमस्ते,\njapanese:\"world,\narabic:'ok,\n}");
    expect(result).not.toBeNull();
    const parsed = JSON.parse(result!.fixed) as Record<string, unknown>;
    expect(Object.keys(parsed)).toEqual(['hindi', 'japanese', 'arabic']);
  });

  it('maps all-caps TRUE/FALSE/NULL to their JSON equivalents', () => {
    const result = tryRepairJson('{a: TRUE, b: FALSE, c: NULL}');
    expect(result).not.toBeNull();
    expect(JSON.parse(result!.fixed)).toEqual({ a: true, b: false, c: null });
  });

  it('strips constructor-call values (new Date(), new Map(), etc.) to null', () => {
    const result = tryRepairJson('{created: new Date(), map: new Map(), plain: new}');
    expect(result).not.toBeNull();
    expect(JSON.parse(result!.fixed)).toEqual({ created: null, map: null, plain: 'new' });
  });

  it('never loops forever or crashes when array/object closers are mismatched', () => {
    const result = tryRepairJson('{a: [1, 2}, b: {c: 3]}');
    expect(result).not.toBeNull();
    expect(() => JSON.parse(result!.fixed)).not.toThrow();
  });

  it('closes a single-quoted string correctly when the file uses CRLF line endings', () => {
    const result = tryRepairJson("{companyName:'DevKits'\r\nplantName:\"Plant 01\",\r\n}");
    expect(result).not.toBeNull();
    expect(JSON.parse(result!.fixed)).toEqual({ companyName: 'DevKits', plantName: 'Plant 01' });
  });

  it('strips a trailing CRLF artifact when a string is genuinely unterminated', () => {
    const result = tryRepairJson("{a: 'unterminated on this line\r\nb: 2}");
    expect(result).not.toBeNull();
    const parsed = JSON.parse(result!.fixed) as { a: string };
    expect(parsed.a.endsWith('\r')).toBe(false);
  });

  it('never returns null for a huge adversarial single top-level object', () => {
    // A stress-test payload combining dozens of independent malformations at
    // once. The previous engine aborted the *entire* repair over any single
    // unparseable token; this only asserts the new one always makes forward
    // progress and produces valid JSON somewhere, not that every fragment is
    // semantically perfect (much of this content was never JSON-shaped).
    const payload = `{
      companyName:'DevKits'
      plantName:"Plant 01",
      location: Bangalore,
      version:1.0.0,
      active:TRUE,
      enabled:yes,
      date:2026-07-16,
      numbers:[1\n2,3,,4,,,,5,6.5,07,0xFF,1_000,],
      mixed:[{},[],(),<>,null,undefined,NaN,Infinity,-Infinity,function(){},()=>{},],
      object1:{id:001,name:'Machine A' status:Running operator:John Doe,color:#FF0000,ip:192.168.1.20,mac:AA:BB:CC:DD:EE:FF,},
      object2:{,,,,,name:'Test',,,,,},
      emptyValues:{name:,city:\ncountry:\n},
      randomGarbage:\n@#$%^&*()_+\n~~~~~~~\n<<<<<<< HEAD\n=======\n>>>>>>> branch\ngit conflict\n
      jsonAgain:{"name":"valid"},
    }`;
    const result = tryRepairJson(payload);
    expect(result).not.toBeNull();
    expect(() => JSON.parse(result!.fixed)).not.toThrow();
  });

  it('quotes hyphenated unquoted values like IDs and slugs', () => {
    const result = tryRepairJson("{id: MCH-001, line: Line-A, op: adsf213-10}");
    expect(result).not.toBeNull();
    expect(JSON.parse(result!.fixed)).toEqual({ id: 'MCH-001', line: 'Line-A', op: 'adsf213-10' });
  });
});
