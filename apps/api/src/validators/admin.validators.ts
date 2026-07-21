import { z } from 'zod';
import { strictPassword } from './auth.validators';

export const SetActiveSchema = z.object({
  isActive: z.boolean(),
});

export const UpdateQuotaSchema = z.object({
  quotaBytes: z.number().int().positive().max(1024 ** 5, 'Quota too large'), // hard ceiling: 1 PB
});

export const AdminChangePasswordSchema = z.object({
  newPassword: strictPassword,
});
