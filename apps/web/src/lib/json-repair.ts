const QUOTE_CHARS = new Set(['"', "'", '“', '”', '‘', '’']);
const WORD_START = /[A-Za-z_$]/;
const WORD_CHAR = /[A-Za-z0-9_$]/;
const LITERAL_MAP: Record<string, string> = {
  True: 'true',
  False: 'false',
  None: 'null',
  NaN: 'null',
  Infinity: 'null',
  undefined: 'null',
};

/**
 * Single-pass, string-boundary-aware cleanup: strips // and /* comments,
 * normalizes single/curly-quoted strings to double-quoted, quotes bareword
 * object keys, drops trailing commas, and maps Python/JS-only literals
 * (True/False/None/NaN/Infinity/undefined) to their JSON equivalents.
 * Never touches content that's genuinely inside a JSON string.
 */
function cleanupTokens(input: string): string {
  let out = '';
  let i = 0;
  const n = input.length;

  while (i < n) {
    const ch = input[i];

    // Comments (only outside strings — we only reach here when not inside one)
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

    // Strings — normalize to double-quoted, escaping/unescaping as needed
    if (QUOTE_CHARS.has(ch)) {
      const isCurly = ch === '“' || ch === '”' || ch === '‘' || ch === '’';
      const closer = isCurly ? (ch === '“' || ch === '”' ? new Set(['“', '”']) : new Set(['‘', '’'])) : new Set([ch]);
      let content = '';
      let j = i + 1;
      let closed = false;
      while (j < n) {
        const c = input[j];
        if (c === '\\' && j + 1 < n) {
          content += c + input[j + 1];
          j += 2;
          continue;
        }
        if (closer.has(c)) {
          closed = true;
          j++;
          break;
        }
        content += c;
        j++;
      }
      // Re-escape unescaped double quotes, unescape now-unnecessary escaped single quotes
      const normalized = content
        .replace(/\\'/g, "'")
        .replace(/(?<!\\)"/g, '\\"');
      out += `"${normalized}"`;
      i = closed ? j : j; // if unterminated, we've consumed to end — leave as-is for JSON.parse to report
      continue;
    }

    // Barewords: quote as key if followed by ':', map known non-JSON literals
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
        if (input[k] === ':') {
          out += `"${word}"`;
        } else {
          out += word;
        }
      }
      i = j;
      continue;
    }

    // Trailing commas: skip comma if only whitespace/comments separate it from } or ]
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

/** Appends missing closing brackets for any unmatched { or [ left open at the end. */
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

export interface RepairResult {
  fixed: string;
  changed: boolean;
}

/** Attempts to auto-fix common JSON mistakes. Returns null if the result still doesn't parse. */
export function tryRepairJson(input: string): RepairResult | null {
  const cleaned = cleanupTokens(input);
  const balanced = balanceBrackets(cleaned);

  try {
    JSON.parse(balanced);
    return { fixed: balanced, changed: true };
  } catch {
    return null;
  }
}
