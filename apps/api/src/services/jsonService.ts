import type {
  JsonValidateResponse,
  JsonFormatResponse,
  JsonMinifyResponse,
} from '@devchrono/shared';
import { AppError } from '../middleware/errorHandler';

interface JsonParseError {
  message: string;
  line?: number;
  column?: number;
  position?: number;
}

function parseJsonSafe(jsonStr: string): { value: unknown; error: JsonParseError | null } {
  try {
    return { value: JSON.parse(jsonStr), error: null };
  } catch (err) {
    const message = err instanceof SyntaxError ? err.message : 'Invalid JSON';
    // Extract position info from error message
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

    return {
      value: null,
      error: { message, line, column, position },
    };
  }
}

function countNodes(value: unknown): number {
  if (value === null || typeof value !== 'object') return 1;
  if (Array.isArray(value)) {
    return 1 + value.reduce((acc: number, item) => acc + countNodes(item), 0);
  }
  return 1 + Object.values(value as Record<string, unknown>).reduce(
    (acc: number, v) => acc + countNodes(v), 0
  );
}

function sortKeysDeep(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(value as Record<string, unknown>).sort()) {
    sorted[key] = sortKeysDeep((value as Record<string, unknown>)[key]);
  }
  return sorted;
}

export function validateJson(jsonStr: string): JsonValidateResponse {
  const { value, error } = parseJsonSafe(jsonStr);

  if (error) {
    return {
      valid: false,
      error,
      size: Buffer.byteLength(jsonStr, 'utf8'),
    };
  }

  return {
    valid: true,
    size: Buffer.byteLength(jsonStr, 'utf8'),
    nodeCount: countNodes(value),
  };
}

export function formatJson(
  jsonStr: string,
  indent = 2,
  sortKeys = false,
): JsonFormatResponse {
  const { value, error } = parseJsonSafe(jsonStr);

  if (error) {
    return { formatted: '', valid: false, error: error.message };
  }

  const data = sortKeys ? sortKeysDeep(value) : value;
  return {
    formatted: JSON.stringify(data, null, indent),
    valid: true,
  };
}

export function minifyJson(jsonStr: string): JsonMinifyResponse {
  const { value, error } = parseJsonSafe(jsonStr);

  if (error) {
    throw new AppError(400, error.message, 'INVALID_JSON');
  }

  const minified = JSON.stringify(value);
  const originalSize = Buffer.byteLength(jsonStr, 'utf8');
  const minifiedSize = Buffer.byteLength(minified, 'utf8');

  return {
    minified,
    originalSize,
    minifiedSize,
    savingPercent: parseFloat(
      (((originalSize - minifiedSize) / originalSize) * 100).toFixed(2),
    ),
  };
}
