import { z } from 'zod';

export const TimestampUnitSchema = z.enum([
  'seconds',
  'milliseconds',
  'nanoseconds',
]);

export const ConvertTimestampSchema = z.object({
  timestamp: z
    .string()
    .min(1, 'Timestamp is required')
    .regex(/^-?\d+$/, 'Timestamp must be a numeric string'),
  unit: TimestampUnitSchema.optional(),
  timezone: z.string().optional().default('UTC'),
});

export const ConvertDateSchema = z.object({
  dateString: z.string().min(1, 'Date string is required'),
  timezone: z.string().optional().default('UTC'),
});

export type ConvertTimestampInput = z.infer<typeof ConvertTimestampSchema>;
export type ConvertDateInput = z.infer<typeof ConvertDateSchema>;
