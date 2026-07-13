function shellEscape(value: string): string {
  return `'${value.replace(/'/g, `'"'"'`)}'`;
}

export function buildCurlCommand(opts: {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
}): string {
  const parts = ['curl', '-X', opts.method, shellEscape(opts.url)];
  for (const [key, value] of Object.entries(opts.headers)) {
    parts.push('-H', shellEscape(`${key}: ${value}`));
  }
  if (opts.body) {
    parts.push('--data-raw', shellEscape(opts.body));
  }
  return parts.join(' ');
}

export function tryPrettyJson(text: string): string | null {
  if (!text.trim()) return null;
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return null;
  }
}
