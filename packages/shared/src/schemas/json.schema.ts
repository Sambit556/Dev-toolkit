import { z } from 'zod';

export const JsonValidateSchema = z.object({
  json: z.string().min(1, 'JSON input is required').max(10 * 1024 * 1024, 'JSON too large (max 10MB)'),
});

export const JsonFormatSchema = z.object({
  json: z.string().min(1, 'JSON input is required').max(10 * 1024 * 1024, 'JSON too large (max 10MB)'),
  indent: z.number().int().min(0).max(8).optional().default(2),
  sortKeys: z.boolean().optional().default(false),
});

export const JsonMinifySchema = z.object({
  json: z.string().min(1, 'JSON input is required').max(10 * 1024 * 1024, 'JSON too large (max 10MB)'),
});

export type JsonValidateInput = z.infer<typeof JsonValidateSchema>;
export type JsonFormatInput = z.infer<typeof JsonFormatSchema>;
export type JsonMinifyInput = z.infer<typeof JsonMinifySchema>;
