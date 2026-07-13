import { config } from './config.js';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function extractMessage(body: unknown, fallback: string): string {
  if (body && typeof body === 'object') {
    const obj = body as Record<string, unknown>;
    if (typeof obj.message === 'string') return obj.message;
    if (typeof obj.error === 'string') return obj.error;
  }
  if (typeof body === 'string' && body) return body;
  return fallback;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${config.apiBaseUrl}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const text = await res.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    body = text;
  }

  if (!res.ok) {
    throw new ApiError(extractMessage(body, `Request to ${path} failed with status ${res.status}`), res.status);
  }

  return body as T;
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'GET' });
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body) });
}

export function apiDelete<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'DELETE' });
}
