import { Resend } from 'resend';
import nodemailer, { Transporter } from 'nodemailer';
import { getEnv, getEnvWithDefault } from '../utils/env';
import { logger } from '../utils/logger';
import { redis } from '../utils/redis';
import {
  welcomeEmail,
  accountDeactivatedEmail,
  accountDeletedEmail,
  passwordChangedEmail,
  passwordChangeOtpEmail,
  forgotPasswordEmail,
  type SecurityEventContext,
  type EmailContent,
} from '../emails/templates';
import type { SendEmailInput, BatchEmailItemInput } from '../validators/email.validators';

// Resend Configuration
const resendApiKey = getEnv('RESEND_API_KEY')?.trim();
export const defaultResendFrom = getEnvWithDefault('RESEND_FROM_EMAIL', 'DevKits <security@devkits.space>');

export const resend = resendApiKey ? new Resend(resendApiKey) : null;
export const isResendConfigured = Boolean(resend);

// Optional Fallback SMTP (Nodemailer)
let fallbackTransporter: Transporter | null = null;
const smtpUser = getEnv('SMTP_USER')?.trim();
const smtpPass = getEnv('SMTP_PASS')?.replace(/\s+/g, '');
const fromName = getEnvWithDefault('SMTP_FROM_NAME', 'DevKits Vault');

if (smtpUser && smtpPass) {
  fallbackTransporter = nodemailer.createTransport({
    host: getEnvWithDefault('SMTP_HOST', 'smtp.gmail.com'),
    port: parseInt(getEnvWithDefault('SMTP_PORT', '587'), 10),
    secure: getEnvWithDefault('SMTP_SECURE', 'false') === 'true',
    auth: { user: smtpUser, pass: smtpPass },
  });
}

if (isResendConfigured) {
  logger.info('Resend transactional email client initialized successfully.');
} else if (fallbackTransporter) {
  logger.warn('RESEND_API_KEY is not set; falling back to legacy SMTP nodemailer transport.');
} else {
  logger.warn('Neither RESEND_API_KEY nor SMTP credentials configured — transactional emails are disabled.');
}

/**
 * Fire-and-forget core email dispatch: used by auth & security workflows.
 * Never throws or blocks caller responses.
 */
function sendFireAndForget(to: string, content: EmailContent): void {
  if (isResendConfigured && resend) {
    resend.emails.send({
      from: defaultResendFrom,
      to: [to],
      subject: content.subject,
      html: content.html,
      ...(content.text ? { text: content.text } : {}),
      headers: {
        'X-Entity-Ref-ID': `devkits-${Date.now()}`,
      },
    }).then(({ data, error }) => {
      if (error) {
        logger.error('Failed to send transactional email via Resend', { to, subject: content.subject, error });
      } else {
        logger.info('Transactional email sent via Resend', { to, subject: content.subject, id: data?.id });
        // Invalidate cached email list if present
        if (redis) {
          redis.del('resend:emails:list').catch(() => {});
        }
      }
    }).catch((err: any) => {
      logger.error('Unexpected exception during Resend send', { to, subject: content.subject, error: err.message });
    });
    return;
  }

  // Fallback to nodemailer if configured
  if (fallbackTransporter && smtpUser) {
    fallbackTransporter.sendMail({
      from: `"${fromName}" <${smtpUser}>`,
      to,
      subject: content.subject,
      html: content.html,
    }).then(() => {
      logger.info('Transactional email sent via fallback SMTP', { to, subject: content.subject });
    }).catch((err: any) => {
      logger.error('Failed to send transactional email via fallback SMTP', { to, subject: content.subject, error: err.message });
    });
  }
}

// ---------------------------------------------------------------------------
// Account & Auth Lifecycle Emails
// ---------------------------------------------------------------------------

export function sendWelcomeEmail(to: string, name: string): void {
  sendFireAndForget(to, welcomeEmail({ name, email: to }));
}

export function sendAccountDeactivatedEmail(to: string, name: string, context?: SecurityEventContext): void {
  sendFireAndForget(to, accountDeactivatedEmail({ name, email: to, context }));
}

export function sendAccountDeletedEmail(to: string, name: string): void {
  sendFireAndForget(to, accountDeletedEmail({ name, email: to }));
}

export function sendPasswordChangedEmail(to: string, name: string, context?: SecurityEventContext): void {
  sendFireAndForget(to, passwordChangedEmail({ name, email: to, context }));
}

export function sendForgotPasswordEmail(to: string, name: string, resetUrl: string, token: string, expiresInMinutes: number): void {
  sendFireAndForget(to, forgotPasswordEmail({ name, email: to, resetUrl, token, expiresInMinutes }));
}

export function sendPasswordChangeOtpEmail(to: string, name: string, otp: string, expiresInMinutes: number): void {
  sendFireAndForget(to, passwordChangeOtpEmail({ name, email: to, otp, expiresInMinutes }));
}

// ---------------------------------------------------------------------------
// Superadmin Resend Email Management Methods
// ---------------------------------------------------------------------------

/**
 * Send a single transactional email via Resend
 */
export async function sendSingleEmail(input: SendEmailInput) {
  if (!resend) {
    throw new Error('Resend is not configured (missing RESEND_API_KEY).');
  }

  const toList = Array.isArray(input.to) ? input.to : [input.to];
  const payload: any = {
    from: input.from?.trim() || defaultResendFrom,
    to: toList,
    subject: input.subject,
    html: input.html,
  };

  if (input.text) payload.text = input.text;
  if (input.scheduledAt) payload.scheduledAt = input.scheduledAt;
  if (input.replyTo) payload.reply_to = input.replyTo;
  if (input.cc) payload.cc = input.cc;
  if (input.bcc) payload.bcc = input.bcc;

  const result = await resend.emails.send(payload);
  if (result.error) {
    throw new Error(result.error.message || 'Failed to send email via Resend');
  }

  if (redis) {
    redis.del('resend:emails:list').catch(() => {});
  }

  return result.data;
}

/**
 * Send a batch of emails via Resend
 */
export async function sendBatchEmails(emails: BatchEmailItemInput[]) {
  if (!resend) {
    throw new Error('Resend is not configured (missing RESEND_API_KEY).');
  }

  const batchPayload = emails.map((item) => {
    const toList = Array.isArray(item.to) ? item.to : [item.to];
    const emailObj: any = {
      from: item.from?.trim() || defaultResendFrom,
      to: toList,
      subject: item.subject,
      html: item.html,
    };
    if (item.text) emailObj.text = item.text;
    if (item.replyTo) emailObj.reply_to = item.replyTo;
    if (item.cc) emailObj.cc = item.cc;
    if (item.bcc) emailObj.bcc = item.bcc;
    return emailObj;
  });

  const result = await resend.batch.send(batchPayload);
  if (result.error) {
    throw new Error(result.error.message || 'Failed to send batch emails via Resend');
  }

  if (redis) {
    redis.del('resend:emails:list').catch(() => {});
  }

  return result.data;
}

/**
 * List recent emails from Resend (cached in Redis for 10 seconds to protect rate limits)
 */
export async function listEmails(bypassCache = false) {
  if (!resend) {
    throw new Error('Resend is not configured (missing RESEND_API_KEY).');
  }

  const cacheKey = 'resend:emails:list';
  if (!bypassCache && redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return typeof cached === 'string' ? JSON.parse(cached) : cached;
      }
    } catch {
      // ignore cache read failure
    }
  }

  const result = await resend.emails.list();
  if (result.error) {
    throw new Error(result.error.message || 'Failed to list emails from Resend');
  }

  const data = result.data;

  if (redis && data) {
    redis.set(cacheKey, JSON.stringify(data), { ex: 10 }).catch(() => {});
  }

  return data;
}

/**
 * Get details of a single email by ID
 */
export async function getEmailById(id: string) {
  if (!resend) {
    throw new Error('Resend is not configured (missing RESEND_API_KEY).');
  }

  const result = await resend.emails.get(id);
  if (result.error) {
    throw new Error(result.error.message || `Failed to fetch email with ID ${id}`);
  }

  return result.data;
}

/**
 * Update the scheduled send time for an email
 */
export async function updateScheduledEmail(id: string, scheduledAt: string) {
  if (!resend) {
    throw new Error('Resend is not configured (missing RESEND_API_KEY).');
  }

  const result = await resend.emails.update({
    id,
    scheduledAt,
  });

  if (result.error) {
    throw new Error(result.error.message || `Failed to update scheduled email with ID ${id}`);
  }

  if (redis) {
    redis.del('resend:emails:list').catch(() => {});
  }

  return result.data;
}

/**
 * Cancel a scheduled email before it is dispatched
 */
export async function cancelScheduledEmail(id: string) {
  if (!resend) {
    throw new Error('Resend is not configured (missing RESEND_API_KEY).');
  }

  const result = await resend.emails.cancel(id);
  if (result.error) {
    throw new Error(result.error.message || `Failed to cancel scheduled email with ID ${id}`);
  }

  if (redis) {
    redis.del('resend:emails:list').catch(() => {});
  }

  return result.data;
}
