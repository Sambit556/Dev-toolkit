import type { JsonNodeType } from '@devchrono/shared';

export interface JsonError {
  message: string;
  line?: number;
  column?: number;
  position?: number;
}

export interface ParseResult {
  value: unknown;
  error: JsonError | null;
}

export function parseJsonSafe(jsonStr: string): ParseResult {
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

export function getNodeType(value: unknown): JsonNodeType {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value as JsonNodeType;
}

export interface FlatNode {
  id: string;
  depth: number;
  key: string | null;
  value: unknown;
  type: JsonNodeType;
  isCollapsed: boolean;
  childCount: number;
  path: string;
  isLastChild: boolean;
}

export function flattenJson(
  value: unknown,
  collapsed: Set<string>,
  path = '$',
  depth = 0,
  key: string | null = null,
  isLast = true,
): FlatNode[] {
  const type = getNodeType(value);
  const id = path;

  const node: FlatNode = {
    id,
    depth,
    key,
    value,
    type,
    isCollapsed: collapsed.has(id),
    childCount: type === 'array'
      ? (value as unknown[]).length
      : type === 'object'
        ? Object.keys(value as Record<string, unknown>).length
        : 0,
    path,
    isLastChild: isLast,
  };

  const result: FlatNode[] = [node];

  if (collapsed.has(id)) return result;

  if (type === 'array') {
    const arr = value as unknown[];
    arr.forEach((item, i) => {
      result.push(
        ...flattenJson(item, collapsed, `${path}[${i}]`, depth + 1, `${i}`, i === arr.length - 1),
      );
    });
  } else if (type === 'object' && value !== null) {
    const entries = Object.entries(value as Record<string, unknown>);
    entries.forEach(([k, v], i) => {
      result.push(
        ...flattenJson(v, collapsed, `${path}.${k}`, depth + 1, k, i === entries.length - 1),
      );
    });
  }

  return result;
}

export function formatJson(jsonStr: string, indent = 2, sortKeys = false): string {
  const { value, error } = parseJsonSafe(jsonStr);
  if (error) throw new Error(error.message);
  const data = sortKeys ? sortKeysDeep(value) : value;
  return JSON.stringify(data, null, indent);
}

export function minifyJson(jsonStr: string): string {
  const { value, error } = parseJsonSafe(jsonStr);
  if (error) throw new Error(error.message);
  return JSON.stringify(value);
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

export function jsonToTypescript(value: unknown, name = 'Root', indent = 0): string {
  const pad = '  '.repeat(indent);
  const type = getNodeType(value);

  if (type === 'null') return 'null';
  if (type === 'string') return 'string';
  if (type === 'number') return 'number';
  if (type === 'boolean') return 'boolean';

  if (type === 'array') {
    const arr = value as unknown[];
    if (arr.length === 0) return 'unknown[]';
    const itemType = jsonToTypescript(arr[0], name + 'Item', indent);
    return `${itemType}[]`;
  }

  if (type === 'object' && value !== null) {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return 'Record<string, unknown>';
    const lines = entries.map(
      ([k, v]) => `${pad}  ${JSON.stringify(k)}: ${jsonToTypescript(v, k, indent + 1)};`,
    );
    return `{\n${lines.join('\n')}\n${pad}}`;
  }

  return 'unknown';
}

export function generateTypeScript(jsonStr: string, interfaceName = 'Root'): string {
  const { value, error } = parseJsonSafe(jsonStr);
  if (error) throw new Error(error.message);
  const typeBody = jsonToTypescript(value, interfaceName);
  return `interface ${interfaceName} ${typeBody}`;
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
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
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

export function countNodes(value: unknown): number {
  if (value === null || typeof value !== 'object') return 1;
  if (Array.isArray(value)) return 1 + value.reduce((acc: number, v) => acc + countNodes(v), 0);
  return 1 + Object.values(value as Record<string, unknown>).reduce((acc: number, v) => acc + countNodes(v), 0);
}
