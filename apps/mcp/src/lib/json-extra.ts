export interface JsonError {
  message: string;
  line?: number;
  column?: number;
  position?: number;
}

export function parseJsonSafe(jsonStr: string): { value: unknown; error: JsonError | null } {
  try {
    return { value: JSON.parse(jsonStr), error: null };
  } catch (err) {
    const message = err instanceof SyntaxError ? err.message : 'Invalid JSON';
    const posMatch = message.match(/position (\d+)/i);
    const position = posMatch ? parseInt(posMatch[1], 10) : undefined;
    let line: number | undefined;
    let column: number | undefined;
    if (position !== undefined) {
      const before = jsonStr.substring(0, position);
      const lines = before.split('\n');
      line = lines.length;
      column = lines[lines.length - 1].length + 1;
    }
    return { value: null, error: { message, line, column, position } };
  }
}

export function sortKeysDeep(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(value as Record<string, unknown>).sort()) {
    sorted[key] = sortKeysDeep((value as Record<string, unknown>)[key]);
  }
  return sorted;
}

export function removeNullValues(value: unknown): unknown {
  if (value === null) return undefined;
  if (Array.isArray(value)) return value.map(removeNullValues).filter((v) => v !== undefined);
  if (typeof value === 'object' && value !== null) {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const cleaned = removeNullValues(v);
      if (cleaned !== undefined) result[k] = cleaned;
    }
    return result;
  }
  return value;
}

function getNodeType(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function jsonToTypescriptType(value: unknown, name = 'Root', indent = 0): string {
  const pad = '  '.repeat(indent);
  const type = getNodeType(value);
  if (type === 'null') return 'null';
  if (type === 'string') return 'string';
  if (type === 'number') return 'number';
  if (type === 'boolean') return 'boolean';
  if (type === 'array') {
    const arr = value as unknown[];
    if (arr.length === 0) return 'unknown[]';
    return `${jsonToTypescriptType(arr[0], name + 'Item', indent)}[]`;
  }
  if (type === 'object' && value !== null) {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return 'Record<string, unknown>';
    const lines = entries.map(([k, v]) => `${pad}  ${JSON.stringify(k)}: ${jsonToTypescriptType(v, k, indent + 1)};`);
    return `{\n${lines.join('\n')}\n${pad}}`;
  }
  return 'unknown';
}

export function generateTypeScript(jsonStr: string, interfaceName = 'Root'): string {
  const { value, error } = parseJsonSafe(jsonStr);
  if (error) throw new Error(error.message);
  return `interface ${interfaceName} ${jsonToTypescriptType(value, interfaceName)}`;
}

export function jsonToCsv(jsonStr: string): string {
  const { value, error } = parseJsonSafe(jsonStr);
  if (error) throw new Error(error.message);
  if (!Array.isArray(value)) throw new Error('JSON must be an array of objects to convert to CSV');
  if (value.length === 0) return '';
  const headers = Object.keys(value[0] as Record<string, unknown>);
  const rows = (value as Record<string, unknown>[]).map((row) =>
    headers.map((h) => {
      const v = row[h];
      if (v === null || v === undefined) return '';
      if (typeof v === 'object') return JSON.stringify(v);
      const str = String(v);
      return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str;
    }).join(','),
  );
  return [headers.join(','), ...rows].join('\n');
}

export function escapeJsonString(str: string): string {
  try {
    const parsed = JSON.parse(str);
    if (typeof parsed === 'string') return JSON.stringify(parsed);
    return JSON.stringify(str);
  } catch {
    return JSON.stringify(str);
  }
}

export function unescapeJsonString(str: string): string {
  try {
    const parsed = JSON.parse(str);
    return typeof parsed === 'string' ? parsed : str;
  } catch {
    return str;
  }
}

// --- JSON repair (ported from apps/web/src/lib/json-repair.ts) ---
//
// This is a lenient recursive-descent parser that mirrors JSON grammar but
// tolerates common real-world mistakes (single quotes, unquoted keys/values,
// missing commas/colons/brackets, JS-only literals, comments, function
// values, console-log prefixes, hyphenated ID-like tokens). It builds a real
// JS value as it walks the input, so output comes from JSON.stringify —
// never hand-escaped — and every tolerance it exercises is recorded as a fix.
//
// Recovery philosophy: once we're inside a recognized `{` or `[`, we commit
// to interpreting everything up to its matching close (or EOF) as part of
// that structure — there's no going back to "unrecoverable" from there. A
// single bad token (an emoji, a MAC address, a stray symbol, a missing
// value) never aborts the whole repair; it gets captured as an opaque string,
// filled with `null`, or — only when it isn't even shaped like `key: value`
// — discarded with a fix message saying exactly what was thrown away. Only
// the outermost call (no enclosing braces at all) can still return
// "unrecoverable", for input that was never JSON-shaped to begin with.
//
// Keep this in sync with apps/web/src/lib/json-repair.ts if you touch either.

const CURLY_DOUBLE = new Set(['“', '”']);
const CURLY_SINGLE = new Set(['‘', '’']);
const WORD_START = /[A-Za-z_$]/;
const WORD_CHAR = /[A-Za-z0-9_$]/;
// Unquoted bareword keys/values are frequently ID-like tokens (SKU codes,
// slugs, machine IDs — "MCH-001", "Line-A", "adsf213-10") rather than JS
// identifiers, so hyphens are allowed mid-token even though real JS
// identifiers can't contain them.
const VALUE_WORD_CHAR = /[A-Za-z0-9_$-]/;
const NUMBER_RE = /^[+-]?(\d[\d_]*\.?[\d_]*|\.\d[\d_]*)([eE][+-]?\d+)?/;
const HEX_RE = /^0[xX][0-9a-fA-F]+/;
const KEY_LINE_RE = /^[ \t]*[\w$'"`-]+[ \t]*:/;

const LITERAL_VALUE: Record<string, unknown> = {
  True: true,
  False: false,
  TRUE: true,
  FALSE: false,
  NULL: null,
  None: null,
  NaN: null,
  Infinity: null,
  undefined: null,
};

class RepairError extends Error {
  constructor(message: string, public position: number) {
    super(message);
  }
}

function truncate(s: string, max = 60): string {
  const oneLine = s.replace(/\s+/g, ' ').trim();
  return oneLine.length > max ? `${oneLine.slice(0, max)}…` : oneLine;
}

class LenientParser {
  private pos = 0;
  private readonly maxFixes: number;
  readonly fixes: string[] = [];

  constructor(private input: string) {
    // Every fix corresponds to consuming at least one character, so a
    // well-behaved run can never need more fixes than there are characters
    // (generously padded). This is a last-resort guard against a stuck loop
    // in some recovery path we haven't foreseen — it should never trigger
    // in practice, but a bounded failure beats a hang or an unbounded array.
    this.maxFixes = Math.max(2000, input.length * 4);
  }

  get position() {
    return this.pos;
  }

  private addFix(message: string) {
    if (this.fixes.length >= this.maxFixes) {
      throw new RepairError('Too many fixes — aborting to avoid a stuck loop', this.pos);
    }
    this.fixes.push(message);
  }

  private peek(): string {
    return this.input[this.pos];
  }

  private atEnd(): boolean {
    return this.pos >= this.input.length;
  }

  skipWs() {
    while (!this.atEnd()) {
      const ch = this.peek();
      if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
        this.pos++;
        continue;
      }
      if (ch === '/' && this.input[this.pos + 1] === '/') {
        this.pos += 2;
        while (!this.atEnd() && this.input[this.pos] !== '\n') this.pos++;
        this.addFix('Removed comment');
        continue;
      }
      if (ch === '/' && this.input[this.pos + 1] === '*') {
        this.pos += 2;
        while (!this.atEnd() && !(this.input[this.pos] === '*' && this.input[this.pos + 1] === '/')) this.pos++;
        this.pos += 2;
        this.addFix('Removed comment');
        continue;
      }
      break;
    }
  }

  /** Skips a balanced open/close run (parens, braces, brackets), respecting nested strings/comments. */
  private skipBalanced(open: string, close: string) {
    let depth = 0;
    do {
      if (this.atEnd()) break;
      const c = this.peek();
      if (c === '"' || c === "'" || c === '`') {
        const q = c;
        this.pos++;
        while (!this.atEnd() && this.input[this.pos] !== q) {
          if (this.input[this.pos] === '\\') this.pos++;
          this.pos++;
        }
        this.pos++;
        continue;
      }
      if (c === '/' && this.input[this.pos + 1] === '/') {
        while (!this.atEnd() && this.input[this.pos] !== '\n') this.pos++;
        continue;
      }
      if (c === '/' && this.input[this.pos + 1] === '*') {
        this.pos += 2;
        while (!this.atEnd() && !(this.input[this.pos] === '*' && this.input[this.pos + 1] === '/')) this.pos++;
        this.pos += 2;
        continue;
      }
      if (c === open) depth++;
      else if (c === close) depth--;
      this.pos++;
    } while (depth > 0 && !this.atEnd());
  }

  /** Consumes a JS expression body (no braces) up to the next depth-0 delimiter: , } ] or end. */
  private skipExpressionUntilDelimiter() {
    let depth = 0;
    while (!this.atEnd()) {
      const c = this.peek();
      if (c === '"' || c === "'" || c === '`') {
        const q = c;
        this.pos++;
        while (!this.atEnd() && this.input[this.pos] !== q) {
          if (this.input[this.pos] === '\\') this.pos++;
          this.pos++;
        }
        this.pos++;
        continue;
      }
      if (depth === 0 && (c === ',' || c === '}' || c === ']')) return;
      if (c === '(' || c === '[' || c === '{') depth++;
      else if (c === ')' || c === ']' || c === '}') depth--;
      this.pos++;
    }
  }

  /**
   * Scans forward (without consuming) to the nearest top-level `,` `}` `]`
   * or newline, respecting nested brackets/quotes — used to bound a raw
   * token when nothing recognizable parses. This is the fallback boundary
   * for opaque value/key capture, so it deliberately stops at a newline
   * too: most garbage tokens in hand-edited/pasted JSON are one per line.
   */
  private findEntryBoundary(): number {
    let depth = 0;
    let j = this.pos;
    while (j < this.input.length) {
      const c = this.input[j];
      if (c === '"' || c === "'" || c === '`') {
        const q = c;
        j++;
        while (j < this.input.length && this.input[j] !== q && this.input[j] !== '\n') {
          if (this.input[j] === '\\') j++;
          j++;
        }
        if (this.input[j] === q) j++;
        continue;
      }
      if (depth === 0 && (c === ',' || c === '}' || c === ']' || c === '\n')) return j;
      if (c === '(' || c === '[' || c === '{') depth++;
      else if (c === ')' || c === ']' || c === '}') depth--;
      j++;
    }
    return this.input.length;
  }

  /** Captures whatever's at `pos` up to the next entry boundary as a raw string (or null if empty). */
  private captureOpaqueValue(): unknown {
    const start = this.pos;
    const boundary = this.findEntryBoundary();
    const end = Math.max(boundary, start + 1);
    const raw = this.input.slice(start, end).trim();
    this.pos = end;
    if (raw === '') {
      this.addFix('Filled missing value with null');
      return null;
    }
    this.addFix('Quoted unrecognized value');
    return raw;
  }

  /** True if the char at `idx` is a legitimate place for a clean token (number/bareword) to end. */
  private isCleanValueBoundary(idx: number): boolean {
    if (idx >= this.input.length) return true;
    const c = this.input[idx];
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') return true;
    if (c === ',' || c === '}' || c === ']') return true;
    if (c === '/' && (this.input[idx + 1] === '/' || this.input[idx + 1] === '*')) return true;
    return false;
  }

  private skipFunctionValue() {
    // 'function' keyword already consumed. Optional name, then (...) then { ... }.
    this.skipWs();
    while (!this.atEnd() && WORD_CHAR.test(this.peek())) this.pos++;
    this.skipWs();
    if (this.peek() === '(') this.skipBalanced('(', ')');
    this.skipWs();
    if (this.peek() === '{') this.skipBalanced('{', '}');
    this.addFix('Removed function value (not representable in JSON)');
  }

  private parseArrowFunctionFromParen(): unknown {
    const start = this.pos;
    this.skipBalanced('(', ')');
    this.skipWs();
    if (this.input.slice(this.pos, this.pos + 2) === '=>') {
      this.pos += 2;
      this.skipWs();
      if (this.peek() === '{') this.skipBalanced('{', '}');
      else this.skipExpressionUntilDelimiter();
      this.addFix('Removed function value (not representable in JSON)');
      return null;
    }
    this.pos = start;
    throw new RepairError("Unexpected '(' where a value was expected", this.pos);
  }

  /**
   * Called when `parseKey()` can't find a key start at all (object context).
   * If a `:` shows up before the next entry boundary, treat everything
   * before it as an unusual-but-intentional key name; otherwise this span
   * isn't shaped like `key: value` at all, so it's discarded (with a fix
   * message naming exactly what was thrown away) rather than guessed at.
   */
  private recoverBadEntry(): string | null {
    const start = this.pos;
    const boundary = this.findEntryBoundary();
    const colonIdx = this.input.indexOf(':', start);
    if (colonIdx !== -1 && colonIdx < boundary) {
      const raw = this.input.slice(start, colonIdx).trim();
      this.pos = colonIdx;
      this.addFix(`Quoted unusual key "${truncate(raw, 40)}"`);
      return raw || '_';
    }
    const end = Math.max(boundary, start + 1);
    const raw = this.input.slice(start, end);
    this.pos = end;
    this.addFix(`Discarded unparseable content: "${truncate(raw)}"`);
    return null;
  }

  private parseKey(): string {
    this.skipWs();
    if (this.atEnd()) throw new RepairError('Unexpected end of input while reading a key', this.pos);
    const ch = this.peek();
    if (ch === '"' || ch === "'" || ch === '`' || CURLY_DOUBLE.has(ch) || CURLY_SINGLE.has(ch)) {
      return this.parseString();
    }
    if (WORD_START.test(ch)) {
      const start = this.pos;
      this.pos++;
      while (!this.atEnd() && VALUE_WORD_CHAR.test(this.peek())) this.pos++;
      this.addFix('Quoted unquoted key');
      return this.input.slice(start, this.pos).replace(/-+$/, '');
    }
    if (/[0-9]/.test(ch)) {
      const start = this.pos;
      while (!this.atEnd() && /[0-9.]/.test(this.peek())) this.pos++;
      this.addFix('Quoted unquoted numeric key');
      return this.input.slice(start, this.pos);
    }
    throw new RepairError(`Unexpected character '${ch}' where a key was expected`, this.pos);
  }

  /**
   * Bounded forward scan (from a literal newline hit mid-string) for a
   * plausible closing quote further down. Real multi-line string content
   * (someone pasted a value with an actual line break) should keep the
   * newline instead of truncating; but we bail — treating the newline as
   * the end — the moment a following line looks like the start of a new
   * `key: value` entry, so we don't swallow unrelated keys into one string.
   */
  private hasNearbyCloser(closerSet: Set<string>): boolean {
    const LOOKAHEAD_CAP = 500;
    const limit = Math.min(this.input.length, this.pos + 1 + LOOKAHEAD_CAP);
    let j = this.pos + 1;
    while (j < limit) {
      const c = this.input[j];
      if (closerSet.has(c)) return true;
      if (c === '\n') {
        const nextNl = this.input.indexOf('\n', j + 1);
        const restOfLine = this.input.slice(j + 1, nextNl === -1 ? limit : nextNl);
        if (KEY_LINE_RE.test(restOfLine)) return false;
      }
      j++;
    }
    return false;
  }

  private parseString(): string {
    const openChar = this.peek();
    const isStandard = openChar === '"';
    const closerSet = CURLY_DOUBLE.has(openChar)
      ? CURLY_DOUBLE
      : CURLY_SINGLE.has(openChar)
        ? CURLY_SINGLE
        : new Set([openChar]);
    // Single quotes collide with English possessives/contractions ("John's
    // Laptop") — only treat one as the real closer if what follows looks
    // like a legitimate continuation of JSON structure. Double/curly quotes
    // don't have this ambiguity in practice, so they close unconditionally.
    const disambiguateCloser = openChar === "'";

    if (!isStandard) this.addFix('Converted quotes to double quotes');

    this.pos++; // consume opening quote
    let result = '';
    let closed = false;
    while (!this.atEnd()) {
      const c = this.input[this.pos];
      if (c === '\\' && this.pos + 1 < this.input.length) {
        const next = this.input[this.pos + 1];
        switch (next) {
          case '"': result += '"'; this.pos += 2; continue;
          case '\\': result += '\\'; this.pos += 2; continue;
          case '/': result += '/'; this.pos += 2; continue;
          case 'b': result += '\b'; this.pos += 2; continue;
          case 'f': result += '\f'; this.pos += 2; continue;
          case 'n': result += '\n'; this.pos += 2; continue;
          case 'r': result += '\r'; this.pos += 2; continue;
          case 't': result += '\t'; this.pos += 2; continue;
          case 'u': {
            const hex = this.input.slice(this.pos + 2, this.pos + 6);
            if (/^[0-9a-fA-F]{4}$/.test(hex)) {
              result += String.fromCharCode(parseInt(hex, 16));
              this.pos += 6;
              continue;
            }
            result += next;
            this.pos += 2;
            continue;
          }
          default:
            if (next === openChar) {
              // Escaping this string's own delimiter — safe to unescape.
              result += next;
            } else {
              // Unrecognized escape (e.g. a Windows path "C:\Users\Admin")
              // — preserve both characters literally rather than silently
              // dropping the backslash and corrupting the value.
              result += '\\' + next;
            }
            this.pos += 2;
            continue;
        }
      }
      if (closerSet.has(c)) {
        if (disambiguateCloser) {
          let k = this.pos + 1;
          while (k < this.input.length && (this.input[k] === ' ' || this.input[k] === '\t' || this.input[k] === '\r')) k++;
          const after = this.input[k];
          const looksLikeRealClose =
            k >= this.input.length || ',}]:\n'.includes(after) ||
            (after === '/' && (this.input[k + 1] === '/' || this.input[k + 1] === '*'));
          if (!looksLikeRealClose) {
            result += c;
            this.pos++;
            continue;
          }
        }
        this.pos++;
        closed = true;
        break;
      }
      if (c === '\n') {
        if (this.hasNearbyCloser(closerSet)) {
          result += '\n';
          this.pos++;
          continue;
        }
        // A trailing \r right before this newline is a CRLF line-ending
        // artifact, never meaningful content — drop it before closing.
        if (result.endsWith('\r')) result = result.slice(0, -1);
        this.addFix('Closed unterminated string');
        closed = true;
        break;
      }
      result += c;
      this.pos++;
    }
    if (!closed) this.addFix('Closed unterminated string at end of input');
    return result;
  }

  private parseNumberOrOpaque(): unknown {
    const start = this.pos;

    if (this.input.slice(this.pos, this.pos + 9) === '-Infinity' && this.isCleanValueBoundary(this.pos + 9)) {
      this.pos += 9;
      this.addFix('Converted -Infinity to null');
      return null;
    }

    if (HEX_RE.test(this.input.slice(this.pos))) {
      const match = HEX_RE.exec(this.input.slice(this.pos))![0];
      if (this.isCleanValueBoundary(this.pos + match.length)) {
        this.pos += match.length;
        this.addFix('Converted hex number to decimal');
        return parseInt(match, 16);
      }
    } else {
      const m = NUMBER_RE.exec(this.input.slice(this.pos));
      if (m && m[0] !== '' && m[0] !== '+' && m[0] !== '-' && this.isCleanValueBoundary(this.pos + m[0].length)) {
        let text = m[0];
        this.pos += text.length;
        if (text.includes('_')) { text = text.replace(/_/g, ''); this.addFix('Removed numeric separators'); }
        if (text.startsWith('+')) { text = text.slice(1); this.addFix('Removed redundant leading + from number'); }
        if (text.startsWith('.') || text.startsWith('-.')) { text = text.replace('.', '0.'); this.addFix('Added leading zero to number'); }
        if (text.endsWith('.')) { text = `${text}0`; this.addFix('Added trailing zero to number'); }
        return Number(text);
      }
    }

    // A numeric prefix immediately followed by more non-delimiter content
    // (dots, colons, letters, %, ...) isn't a clean JSON number — it's more
    // likely a version string, IP, date, MAC, or percentage. Capture the
    // whole token as a string instead of truncating it mid-value.
    this.pos = start;
    return this.captureOpaqueValue();
  }

  private parseIdentifierOrOpaque(): unknown {
    const start = this.pos;
    this.pos++;
    while (!this.atEnd() && VALUE_WORD_CHAR.test(this.peek())) this.pos++;
    const word = this.input.slice(start, this.pos).replace(/-+$/, '');

    // Recognized keywords are checked before the clean-boundary gate below,
    // since e.g. "function" is *always* followed by "(" — never a "clean"
    // delimiter — and would otherwise get treated as an opaque token.
    if (word === 'true') return true;
    if (word === 'false') return false;
    if (word === 'null') return null;
    if (word in LITERAL_VALUE) {
      this.addFix(`Converted ${word} to ${JSON.stringify(LITERAL_VALUE[word])}`);
      return LITERAL_VALUE[word];
    }
    if (word === 'function') {
      this.skipFunctionValue();
      return null;
    }
    if (word === 'new') {
      const save = this.pos;
      this.skipWs();
      if (WORD_START.test(this.peek())) {
        while (!this.atEnd() && VALUE_WORD_CHAR.test(this.peek())) this.pos++;
        this.skipWs();
        if (this.peek() === '(') {
          this.skipBalanced('(', ')');
          this.addFix('Removed constructor-call value (not representable in JSON)');
          return null;
        }
      }
      // Not actually "new X(...)" — treat "new" as a plain bareword instead.
      this.pos = save;
    }

    if (!this.isCleanValueBoundary(this.pos)) {
      // A word immediately followed by more non-delimiter junk (":" in a
      // MAC address, "." in "v1.2", ...) should be captured whole rather
      // than split at the first oddity.
      this.pos = start;
      return this.captureOpaqueValue();
    }

    const save = this.pos;
    this.skipWs();
    if (this.input.slice(this.pos, this.pos + 2) === '=>') {
      this.pos += 2;
      this.skipWs();
      if (this.peek() === '{') this.skipBalanced('{', '}');
      else this.skipExpressionUntilDelimiter();
      this.addFix('Removed function value (not representable in JSON)');
      return null;
    }
    this.pos = save;

    this.addFix('Quoted unquoted string value');
    return word;
  }

  /**
   * True if the content at `pos` looks like a bareword/quoted-string
   * immediately followed by `:` — i.e. the start of a NEW `key: value`
   * entry, not a value for whatever key we're currently parsing. Used to
   * detect a missing comma between two consecutive `key:` lines that each
   * lack a value (`city:\ncountry:\n`), so the second key doesn't get
   * swallowed as the first key's value.
   */
  private looksLikeNextKey(): boolean {
    let j = this.pos;
    const ch = this.input[j];
    if (ch === '"' || ch === "'" || ch === '`') {
      const q = ch;
      j++;
      while (j < this.input.length && this.input[j] !== q && this.input[j] !== '\n') {
        if (this.input[j] === '\\') j++;
        j++;
      }
      if (this.input[j] !== q) return false;
      j++;
    } else if (WORD_START.test(ch)) {
      j++;
      while (j < this.input.length && VALUE_WORD_CHAR.test(this.input[j])) j++;
    } else {
      return false;
    }
    while (j < this.input.length && (this.input[j] === ' ' || this.input[j] === '\t' || this.input[j] === '\r')) j++;
    return this.input[j] === ':';
  }

  /**
   * Object-context wrapper around parseValue(): only inside an object does
   * "the next thing looks like a key:" imply a missing value, so this check
   * doesn't run for array elements (where a bareword-then-colon is just an
   * ordinary, if unusual, value token).
   */
  private parseObjectValue(): unknown {
    const beforeWs = this.pos;
    this.skipWs();
    // Only treat "looks like a key" as a missing-value signal if we actually
    // crossed a line boundary to get here — "mac:AA:BB:CC:DD:EE:FF" has no
    // newline between the colon and "AA", so that's one value, not a new key.
    const crossedNewline = this.input.slice(beforeWs, this.pos).includes('\n');
    if (crossedNewline && !this.atEnd() && this.looksLikeNextKey()) {
      this.addFix('Filled missing value with null');
      return null;
    }
    return this.parseValue();
  }

  parseValue(): unknown {
    this.skipWs();
    if (this.atEnd()) throw new RepairError('Unexpected end of input', this.pos);
    const ch = this.peek();

    // No value at all between the colon and the next delimiter (`key:,` or
    // `key:\n}`) — the standard, unambiguous interpretation is `null`.
    if (ch === ',' || ch === '}' || ch === ']') {
      this.addFix('Filled missing value with null');
      return null;
    }

    if (ch === '{') return this.parseObject();
    if (ch === '[') return this.parseArray();
    if (ch === '"' || ch === "'" || ch === '`' || CURLY_DOUBLE.has(ch) || CURLY_SINGLE.has(ch)) {
      return this.parseString();
    }
    if (ch === '-' || ch === '+' || ch === '.' || /[0-9]/.test(ch)) return this.parseNumberOrOpaque();
    if (ch === '(') {
      try {
        return this.parseArrowFunctionFromParen();
      } catch {
        return this.captureOpaqueValue();
      }
    }
    if (WORD_START.test(ch)) return this.parseIdentifierOrOpaque();

    // Anything else (#hex colors, emoji, unicode text, regex-like /.../,
    // HTML/JSX fragments, git-conflict-marker soup, ...) — capture it
    // verbatim as a string rather than aborting the whole repair over one
    // unrecognized token.
    return this.captureOpaqueValue();
  }

  private parseObject(): Record<string, unknown> {
    this.pos++; // consume '{'
    const obj: Record<string, unknown> = {};
    this.skipWs();
    for (;;) {
      while (this.peek() === ',') {
        this.pos++;
        this.addFix('Removed extra comma');
        this.skipWs();
      }
      if (this.peek() === '}') { this.pos++; break; }
      if (this.peek() === ']') { this.pos++; this.addFix('Closed object with mismatched bracket'); break; }
      if (this.atEnd()) { this.addFix('Added missing closing brace'); break; }

      let key: string;
      try {
        key = this.parseKey();
      } catch {
        const recovered = this.recoverBadEntry();
        this.skipWs();
        if (recovered === null) continue;
        key = recovered;
      }

      this.skipWs();
      if (this.peek() === ':') {
        this.pos++;
      } else {
        this.addFix('Inserted missing colon');
      }

      try {
        obj[key] = this.parseObjectValue();
      } catch {
        obj[key] = null;
        this.addFix('Filled missing value with null');
      }
      this.skipWs();

      if (this.peek() === ',') {
        this.pos++;
        this.skipWs();
        if (this.peek() === '}') { this.pos++; this.addFix('Removed trailing comma'); break; }
        continue;
      }
      if (this.peek() === '}') { this.pos++; break; }
      if (this.peek() === ']') { this.pos++; this.addFix('Closed object with mismatched bracket'); break; }
      if (this.atEnd()) { this.addFix('Added missing closing brace'); break; }
      this.addFix('Inserted missing comma');
    }
    return obj;
  }

  private parseArray(): unknown[] {
    this.pos++; // consume '['
    const arr: unknown[] = [];
    this.skipWs();
    for (;;) {
      while (this.peek() === ',') {
        this.pos++;
        this.addFix('Removed extra comma');
        this.skipWs();
      }
      if (this.peek() === ']') { this.pos++; break; }
      if (this.peek() === '}') { this.pos++; this.addFix('Closed array with mismatched bracket'); break; }
      if (this.atEnd()) { this.addFix('Added missing closing bracket'); break; }

      try {
        arr.push(this.parseValue());
      } catch {
        arr.push(null);
        this.addFix('Filled missing value with null');
      }
      this.skipWs();

      if (this.peek() === ',') {
        this.pos++;
        this.skipWs();
        if (this.peek() === ']') { this.pos++; this.addFix('Removed trailing comma'); break; }
        continue;
      }
      if (this.peek() === ']') { this.pos++; break; }
      if (this.peek() === '}') { this.pos++; this.addFix('Closed array with mismatched bracket'); break; }
      if (this.atEnd()) { this.addFix('Added missing closing bracket'); break; }
      this.addFix('Inserted missing comma');
    }
    return arr;
  }
}

/** Strips a short console/log-style prefix (e.g. "Object", "LOG:") before the first { or [. */
function stripLeadingLabel(text: string): { text: string; fix: string | null } {
  const start = text.search(/\S/);
  if (start === -1) return { text, fix: null };
  const firstChar = text[start];
  if (firstChar === '{' || firstChar === '[' || firstChar === '"' || firstChar === "'") {
    return { text, fix: null };
  }
  const rest = text.slice(start);
  const braceIdx = rest.search(/[{[]/);
  if (braceIdx <= 0) return { text, fix: null };
  const prefix = rest.slice(0, braceIdx);
  if (!/^[\w\s:>=-]{1,40}$/.test(prefix)) return { text, fix: null };
  return { text: rest.slice(braceIdx), fix: 'Removed leading label before JSON value' };
}

/** Wraps bare top-level `key: value, ...` content (no outer braces) into an object. */
function wrapBareEntries(text: string): { text: string; fix: string | null } {
  const t = text.trim();
  if (!t || t[0] === '{' || t[0] === '[') return { text, fix: null };
  const firstLine = t.split('\n')[0];
  if (/^["'`\w]/.test(t) && firstLine.includes(':')) {
    return { text: `{${text}}`, fix: 'Wrapped bare key-value pairs in an object' };
  }
  return { text, fix: null };
}

export interface RepairResult {
  fixed: string;
  changed: boolean;
  fixCount: number;
  fixes: string[];
}

/** Attempts to auto-fix common JSON mistakes. Returns null if the result still doesn't parse. */
export function tryRepairJson(input: string): RepairResult | null {
  try {
    JSON.parse(input);
    return { fixed: input, changed: false, fixCount: 0, fixes: [] };
  } catch {
    // fall through to lenient repair
  }

  let text = input;
  const preFixes: string[] = [];

  const labelStripped = stripLeadingLabel(text);
  text = labelStripped.text;
  if (labelStripped.fix) preFixes.push(labelStripped.fix);

  const wrapped = wrapBareEntries(text);
  text = wrapped.text;
  if (wrapped.fix) preFixes.push(wrapped.fix);

  const parser = new LenientParser(text);
  try {
    const value = parser.parseValue();
    parser.skipWs();

    // Anything left over means we didn't actually manage to make sense of
    // the whole input — that's an unrecoverable case, not a partial fix.
    // (This only bites at the true top level: once parsing has entered a
    // `{`/`[`, that container's own loop absorbs everything up to its
    // matching close or EOF, so this is reached only for bare, brace-less
    // input that was never JSON-shaped to begin with.)
    if (parser.position < text.length) return null;

    const fixes = [...preFixes, ...parser.fixes];
    const fixed = JSON.stringify(value, null, 2);
    return { fixed, changed: true, fixCount: fixes.length, fixes };
  } catch {
    return null;
  }
}

// --- Minimal JSONPath (dot/bracket notation, e.g. $.store.items[0].name) ---

export function evaluateJsonPath(jsonStr: string, path: string): unknown[] {
  const { value, error } = parseJsonSafe(jsonStr);
  if (error) throw new Error(error.message);

  const tokens = path
    .replace(/^\$/, '')
    .replace(/\[\*\]/g, '.*')
    .replace(/\[(\d+)\]/g, '.$1')
    .replace(/\[['"]([^'"]+)['"]\]/g, '.$1')
    .split('.')
    .filter((t) => t.length > 0);

  let current: unknown[] = [value];
  for (const token of tokens) {
    const next: unknown[] = [];
    for (const node of current) {
      if (token === '*') {
        if (Array.isArray(node)) next.push(...node);
        else if (node && typeof node === 'object') next.push(...Object.values(node));
      } else if (Array.isArray(node)) {
        const idx = Number(token);
        if (!Number.isNaN(idx) && node[idx] !== undefined) next.push(node[idx]);
      } else if (node && typeof node === 'object' && token in (node as Record<string, unknown>)) {
        next.push((node as Record<string, unknown>)[token]);
      }
    }
    current = next;
  }
  return current;
}
