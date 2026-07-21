import { z } from 'zod';

export const UpdateNameSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').trim(),
});
