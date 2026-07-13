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

const QUOTE_CHARS = new Set(['"', "'", '“', '”', '‘', '’']);
const WORD_START = /[A-Za-z_$]/;
const WORD_CHAR = /[A-Za-z0-9_$]/;
const LITERAL_MAP: Record<string, string> = {
  True: 'true', False: 'false', None: 'null', NaN: 'null', Infinity: 'null', undefined: 'null',
};

function cleanupTokens(input: string): string {
  let out = '';
  let i = 0;
  const n = input.length;
  while (i < n) {
    const ch = input[i];
    if (ch === '/' && input[i + 1] === '/') {
      i += 2;
      while (i < n && input[i] !== '\n') i++;
      continue;
    }
    if (ch === '/' && input[i + 1] === '*') {
      i += 2;
      while (i < n && !(input[i] === '*' && input[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    if (QUOTE_CHARS.has(ch)) {
      const isCurly = ch === '“' || ch === '”' || ch === '‘' || ch === '’';
      const closer = isCurly
        ? (ch === '“' || ch === '”' ? new Set(['“', '”']) : new Set(['‘', '’']))
        : new Set([ch]);
      let content = '';
      let j = i + 1;
      while (j < n) {
        const c = input[j];
        if (c === '\\' && j + 1 < n) {
          content += c + input[j + 1];
          j += 2;
          continue;
        }
        if (closer.has(c)) {
          j++;
          break;
        }
        content += c;
        j++;
      }
      const normalized = content.replace(/\\'/g, "'").replace(/(?<!\\)"/g, '\\"');
      out += `"${normalized}"`;
      i = j;
      continue;
    }
    if (WORD_START.test(ch)) {
      let j = i + 1;
      while (j < n && WORD_CHAR.test(input[j])) j++;
      const word = input.slice(i, j);
      if (word === 'true' || word === 'false' || word === 'null') {
        out += word;
      } else if (word in LITERAL_MAP) {
        out += LITERAL_MAP[word];
      } else {
        let k = j;
        while (k < n && /\s/.test(input[k])) k++;
        out += input[k] === ':' ? `"${word}"` : word;
      }
      i = j;
      continue;
    }
    if (ch === ',') {
      let k = i + 1;
      while (k < n && /\s/.test(input[k])) k++;
      if (input[k] === '}' || input[k] === ']') {
        i++;
        continue;
      }
      out += ch;
      i++;
      continue;
    }
    out += ch;
    i++;
  }
  return out;
}

function balanceBrackets(input: string): string {
  const stack: string[] = [];
  let i = 0;
  const n = input.length;
  while (i < n) {
    const ch = input[i];
    if (ch === '"') {
      i++;
      while (i < n) {
        if (input[i] === '\\') {
          i += 2;
          continue;
        }
        if (input[i] === '"') {
          i++;
          break;
        }
        i++;
      }
      continue;
    }
    if (ch === '{' || ch === '[') stack.push(ch === '{' ? '}' : ']');
    else if (ch === '}' || ch === ']') stack.pop();
    i++;
  }
  return stack.length ? input + stack.reverse().join('') : input;
}

export function tryRepairJson(input: string): { fixed: string } | null {
  const cleaned = cleanupTokens(input);
  const balanced = balanceBrackets(cleaned);
  try {
    JSON.parse(balanced);
    return { fixed: balanced };
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
