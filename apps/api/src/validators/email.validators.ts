import { z } from 'zod';

const emailRecipient = z.union([
  z.string().email(),
  z.array(z.string().email()).nonempty(),
]);

export const SendEmailSchema = z.object({
  to: emailRecipient,
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject too long'),
  html: z.string().min(1, 'HTML body is required'),
  text: z.string().optional(),
  from: z.string().optional(),
  replyTo: z.union([z.string().email(), z.array(z.string().email())]).optional(),
  cc: z.union([z.string().email(), z.array(z.string().email())]).optional(),
  bcc: z.union([z.string().email(), z.array(z.string().email())]).optional(),
  scheduledAt: z.string().datetime({ message: 'scheduledAt must be a valid ISO 8601 string' }).optional(),
});

export const BatchEmailItemSchema = z.object({
  to: emailRecipient,
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject too long'),
  html: z.string().min(1, 'HTML body is required'),
  text: z.string().optional(),
  from: z.string().optional(),
  replyTo: z.union([z.string().email(), z.array(z.string().email())]).optional(),
  cc: z.union([z.string().email(), z.array(z.string().email())]).optional(),
  bcc: z.union([z.string().email(), z.array(z.string().email())]).optional(),
});

export const SendBatchEmailSchema = z.object({
  emails: z.array(BatchEmailItemSchema).min(1, 'At least 1 email is required in batch').max(100, 'Maximum 100 emails allowed per batch'),
});

export const UpdateScheduledEmailSchema = z.object({
  scheduledAt: z.string().datetime({ message: 'scheduledAt must be a valid ISO 8601 date string' }),
});

export type SendEmailInput = z.infer<typeof SendEmailSchema>;
export type BatchEmailItemInput = z.infer<typeof BatchEmailItemSchema>;
export type SendBatchEmailInput = z.infer<typeof SendBatchEmailSchema>;
export type UpdateScheduledEmailInput = z.infer<typeof UpdateScheduledEmailSchema>;
