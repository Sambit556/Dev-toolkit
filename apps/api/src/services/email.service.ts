import nodemailer, { Transporter } from 'nodemailer';
import { getEnv, getEnvWithDefault } from '../utils/env';
import { logger } from '../utils/logger';
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

let transporter: Transporter | null = null;
let isConfigured = false;

// Google displays app passwords grouped as "xxxx xxxx xxxx xxxx" for readability, but
// the actual credential has no spaces — if SMTP_PASS was copy-pasted straight from that
// display (a very easy mistake), Gmail's SMTP server rejects auth outright, and since
// sendFireAndForget only logs failures (by design — email must never block/fail the
// action that triggered it), that shows up as "email sending doesn't work" with nothing
// visibly wrong anywhere. Stripping whitespace here makes that mistake unable to recur,
// regardless of what ends up in .env.
const smtpUser = getEnv('SMTP_USER')?.trim();
const smtpPass = getEnv('SMTP_PASS')?.replace(/\s+/g, '');

if (smtpUser && smtpPass) {
  transporter = nodemailer.createTransport({
    host: getEnvWithDefault('SMTP_HOST', 'smtp.gmail.com'),
    port: parseInt(getEnvWithDefault('SMTP_PORT', '587'), 10),
    secure: getEnvWithDefault('SMTP_SECURE', 'false') === 'true', // true for port 465, false for 587 (STARTTLS)
    auth: { user: smtpUser, pass: smtpPass },
  });
  isConfigured = true;
} else {
  logger.warn('SMTP_USER/SMTP_PASS are not configured — transactional emails are disabled (calls become silent no-ops).');
}

const fromName = getEnvWithDefault('SMTP_FROM_NAME', 'DevKits Vault');

/**
 * Fire-and-forget: callers never await this for the purpose of blocking their own
 * response — a failed/slow email must never fail or delay the account action that
 * triggered it (registration, deactivation, password change, etc.). Errors are
 * logged, not thrown.
 */
function sendFireAndForget(to: string, content: EmailContent): void {
  if (!isConfigured || !transporter) return;

  transporter.sendMail({
    from: `"${fromName}" <${smtpUser}>`,
    to,
    subject: content.subject,
    html: content.html,
  }).then(() => {
    logger.info('Transactional email sent', { to, subject: content.subject });
  }).catch((err: any) => {
    logger.error('Failed to send transactional email', { to, subject: content.subject, error: err.message });
  });
}

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
