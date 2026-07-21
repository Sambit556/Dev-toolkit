import { z } from 'zod';

export const strictPassword = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password too long to prevent CPU DoS')
  .regex(/[A-Z]/, 'Must contain at least 1 uppercase letter')
  .regex(/[a-z]/, 'Must contain at least 1 lowercase letter')
  .regex(/[0-9]/, 'Must contain at least 1 number')
  .regex(/[\W_]/, 'Must contain at least 1 symbol');

export const LoginSchema = z.object({
  identifier: z.string().trim().min(1, 'Email or mobile number is required'),
  password: z.string().min(1, 'Password is required'),
});

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email format').max(255, 'Email too long').trim(),
  password: strictPassword,
  name: z.string().max(100, 'Name too long').optional(),
  mobileNumber: z.string().regex(/^\+?[0-9\s\-]{7,20}$/, 'Invalid mobile number').optional().or(z.literal('')),
});

export const UpdateProfileSchema = z.object({
  name: z.string().max(100, 'Name too long').optional(),
  mobileNumber: z.string().regex(/^\+?[0-9\s\-]{7,20}$/, 'Invalid mobile number').optional().or(z.literal('')),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format').trim(),
});

export const ResetPasswordSchema = z.object({
  email: z.string().email('Invalid email format').trim(),
  token: z.string().min(1, 'Token is required'),
  newPassword: strictPassword,
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: strictPassword,
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const GoogleCallbackSchema = z.object({
  code: z.string().min(1, 'Missing authorization code'),
  state: z.string().min(1, 'Missing state'),
});

export const GoogleExchangeSchema = z.object({
  code: z.string().min(16).max(128, 'Invalid exchange code'),
});
