export type JsonNodeType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'null'
  | 'object'
  | 'array';

export interface JsonValidateRequest {
  json: string;
}

export interface JsonValidateResponse {
  valid: boolean;
  error?: {
    message: string;
    line?: number;
    column?: number;
    position?: number;
  };
  size: number;
  nodeCount?: number;
}

export interface JsonFormatRequest {
  json: string;
  indent?: number;
  sortKeys?: boolean;
}

export interface JsonFormatResponse {
  formatted: string;
  valid: boolean;
  error?: string;
}

export interface JsonMinifyRequest {
  json: string;
}

export interface JsonMinifyResponse {
  minified: string;
  originalSize: number;
  minifiedSize: number;
  savingPercent: number;
}

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'down';
  version: string;
  uptime: number;
  timestamp: string;
  services?: {
    redis?: 'ok' | 'down';
    postgres?: 'ok' | 'down';
  };
}
