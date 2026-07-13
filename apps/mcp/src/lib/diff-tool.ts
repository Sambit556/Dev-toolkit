import { diffLines, diffWords, diffChars } from 'diff';

export interface DiffPart {
  value: string;
  added?: boolean;
  removed?: boolean;
}

/** Computes a structural diff between two texts at line, word, or character granularity. */
export function computeTextDiff(original: string, modified: string, granularity: 'line' | 'word' | 'char' = 'line'): DiffPart[] {
  const fn = granularity === 'word' ? diffWords : granularity === 'char' ? diffChars : diffLines;
  return fn(original, modified).map((part) => ({
    value: part.value,
    added: part.added,
    removed: part.removed,
  }));
}
