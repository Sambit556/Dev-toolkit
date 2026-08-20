import {
  renderEmailLayout,
  paragraph,
  highlightText,
  ctaButton,
  otpBlock,
  codeBlock,
  infoBox,
  escapeHtml,
} from './layout';

export interface EmailContent {
  subject: string;
  html: string;
  text?: string;
}

export interface SecurityEventContext {
  ip?: string;
  country?: string;
  deviceType?: string;
}

function contextRows(ctx?: SecurityEventContext): Array<{ label: string; value: string }> {
  if (!ctx) return [];
  const rows: Array<{ label: string; value: string }> = [];
  if (ctx.ip) rows.push({ label: 'IP Address', value: ctx.ip });
  if (ctx.country) rows.push({ label: 'Location', value: ctx.country });
  if (ctx.deviceType) rows.push({ label: 'Device / Browser', value: ctx.deviceType });
  rows.push({ label: 'Timestamp', value: new Date().toUTCString() });
  return rows;
}

const BLUE = { from: '#2563eb', to: '#7c3aed' };
const AMBER = { from: '#f59e0b', to: '#ea580c' };
const RED = { from: '#ef4444', to: '#b91c1c' };
const EMERALD = { from: '#10b981', to: '#059669' };

/**
 * 1. Password Change OTP Email (Superadmin Password Change Verification)
 */
export function passwordChangeOtpEmail(params: {
  name: string;
  email: string;
  otp: string;
  expiresInMinutes: number;
}): EmailContent {
  const displayName = params.name || params.email;
  const body =
    paragraph(`Hello ${highlightText(escapeHtml(displayName))},`) +
    paragraph(
      `A security verification was triggered to ${highlightText(
        'change your Superadmin account password'
      )} on DevKits Vault.`
    ) +
    otpBlock(params.otp, 'Superadmin Authorization Code') +
    paragraph(
      `Enter the 6-digit code above in your active browser session to confirm this password change. This code will expire in ${highlightText(
        `${params.expiresInMinutes} minutes`
      )}.`
    ) +
    `<div style="margin:20px 0 10px 0;padding:14px 18px;border-left:3px solid #f59e0b;background-color:#1c1409;border-radius:0 10px 10px 0;font-size:12px;color:#cbd5e1;line-height:20px;">
      <strong style="color:#fbbf24;">Didn't request this change?</strong> If you did not initiate this request, your account credentials may have been targeted. You should immediately review active sessions and rotate your access keys.
    </div>`;

  const text = `Hello ${displayName},

A security verification was triggered to change your Superadmin account password on DevKits Vault.

Your Verification Code: ${params.otp}
(Expires in ${params.expiresInMinutes} minutes)

Enter this 6-digit code in your active browser session to confirm the password change.

Didn't request this? If you did not initiate this change, please review your active sessions and rotate your access keys.

DevKits Security Team
https://devkits.space`;

  return {
    subject: 'DevKits Vault · Superadmin Password Verification Code',
    text,
    html: renderEmailLayout({
      preheader: `Your verification code is ${params.otp}. Expires in ${params.expiresInMinutes} minutes.`,
      accentFrom: AMBER.from,
      accentTo: AMBER.to,
      heading: 'Change Password · Verification Required',
      badgeText: 'Security Verification',
      badgeTone: 'amber',
      bodyHtml: body,
    }),
  };
}

/**
 * 2. Forgot Password Email (Account Password Reset)
 */
export function forgotPasswordEmail(params: {
  name: string;
  email: string;
  resetUrl: string;
  token: string;
  expiresInMinutes: number;
}): EmailContent {
  const displayName = params.name || params.email;
  const body =
    paragraph(`Hello ${highlightText(escapeHtml(displayName))},`) +
    paragraph(
      `We received an authorized request to reset the password for your DevKits account (${highlightText(
        escapeHtml(params.email)
      )}).`
    ) +
    paragraph(
      'Click the secure button below to choose a new password. This link will prefill your reset token in the browser:'
    ) +
    ctaButton('Reset My Password', params.resetUrl, BLUE.from, BLUE.to) +
    paragraph(
      'Alternatively, if you already have the reset form open, you can copy and paste this verification token directly:'
    ) +
    codeBlock(params.token) +
    paragraph(
      `This password reset link and token are valid for ${highlightText(
        `${params.expiresInMinutes} minutes`
      )}. If you did not request this, you can safely disregard this email — your account remains fully secure.`
    );

  const text = `Hello ${displayName},

We received a request to reset the password for your DevKits Vault account (${params.email}).

Reset your password using this link:
${params.resetUrl}

Or copy and paste this verification token:
${params.token}

This token expires in ${params.expiresInMinutes} minutes. If you did not request this, you can safely ignore this email.

DevKits Security Team
https://devkits.space`;

  return {
    subject: 'DevKits Vault · Password Reset Request',
    text,
    html: renderEmailLayout({
      preheader: 'Choose a new password for your DevKits Vault account.',
      accentFrom: BLUE.from,
      accentTo: BLUE.to,
      heading: 'Reset Your Account Password',
      badgeText: 'Action Required',
      badgeTone: 'blue',
      bodyHtml: body,
    }),
  };
}

/**
 * 3. Welcome Email
 */
export function welcomeEmail(params: { name: string; email: string }): EmailContent {
  const displayName = params.name || params.email;
  const body =
    paragraph(`Hello ${highlightText(escapeHtml(displayName))},`) +
    paragraph(
      `Welcome to DevKits Vault! Your private encrypted developer storage workspace for ${highlightText(
        escapeHtml(params.email)
      )} has been created.`
    ) +
    `<div style="margin:20px 0;padding:16px 20px;background-color:#080e22;border:1px solid #1e293b;border-radius:14px;">
      <div style="font-size:12px;font-weight:800;color:#f8fafc;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em;">
        Your Vault Features
      </div>
      <div style="font-size:12px;color:#94a3b8;line-height:22px;">
        &bull; AES-GCM encrypted client-side storage<br/>
        &bull; Isolated browser sandboxing for file previews<br/>
        &bull; Excalidraw diagrams, text notes & time-capsule events<br/>
        &bull; Real-time cryptographic key validation
      </div>
    </div>` +
    ctaButton('Open DevKits Vault', 'https://devkits.space/storage', EMERALD.from, EMERALD.to);

  const text = `Hello ${displayName},

Welcome to DevKits Vault! Your encrypted developer workspace for ${params.email} is ready.

Access your vault at:
https://devkits.space/storage

DevKits Security Team
https://devkits.space`;

  return {
    subject: 'Welcome to DevKits Vault — Your workspace is ready',
    text,
    html: renderEmailLayout({
      preheader: 'Your DevKits Vault account is active and ready.',
      accentFrom: EMERALD.from,
      accentTo: EMERALD.to,
      heading: 'Welcome to DevKits Vault',
      badgeText: 'Account Created',
      badgeTone: 'emerald',
      bodyHtml: body,
    }),
  };
}

/**
 * 4. Password Changed Notification Email
 */
export function passwordChangedEmail(params: {
  name: string;
  email: string;
  context?: SecurityEventContext;
}): EmailContent {
  const displayName = params.name || params.email;
  const body =
    paragraph(`Hello ${highlightText(escapeHtml(displayName))},`) +
    paragraph(
      'The password for your DevKits Vault account was recently updated. As a security measure, all other active sessions and access tokens were revoked.'
    ) +
    (params.context ? infoBox(contextRows(params.context)) : '') +
    `<div style="margin:20px 0 10px 0;padding:14px 18px;border-left:3px solid #ef4444;background-color:#1c0909;border-radius:0 10px 10px 0;font-size:12px;color:#cbd5e1;line-height:20px;">
      <strong style="color:#f87171;">Didn't perform this update?</strong> If this was not you, your account may be compromised. Please contact our security team immediately at <a href="mailto:support@devkits.space" style="color:#60a5fa;text-decoration:none;font-weight:700;">support@devkits.space</a>.
    </div>`;

  const text = `Hello ${displayName},

The password for your DevKits Vault account was recently updated. All other active sessions and access tokens have been revoked.

Didn't do this? Contact support@devkits.space immediately.

DevKits Security Team
https://devkits.space`;

  return {
    subject: 'DevKits Vault · Security Alert: Password Updated',
    text,
    html: renderEmailLayout({
      preheader: 'Your account password was just updated.',
      accentFrom: BLUE.from,
      accentTo: BLUE.to,
      heading: 'Password Successfully Updated',
      badgeText: 'Security Notice',
      badgeTone: 'blue',
      bodyHtml: body,
    }),
  };
}

/**
 * 5. Account Deactivated Email
 */
export function accountDeactivatedEmail(params: {
  name: string;
  email: string;
  context?: SecurityEventContext;
}): EmailContent {
  const displayName = params.name || params.email;
  const body =
    paragraph(`Hello ${highlightText(escapeHtml(displayName))},`) +
    paragraph(
      `Your DevKits Vault account has been ${highlightText(
        'deactivated'
      )}. You have been logged out of all devices and access is suspended.`
    ) +
    (params.context ? infoBox(contextRows(params.context), 'warning') : '') +
    paragraph(
      'Your encrypted data remains secure and intact. Contact an administrator to reactivate your access.'
    );

  const text = `Hello ${displayName},

Your DevKits Vault account has been deactivated. You have been signed out of all devices. Your data remains secure. Contact an administrator to reactivate.

DevKits Security Team
https://devkits.space`;

  return {
    subject: 'DevKits Vault · Account Deactivated',
    text,
    html: renderEmailLayout({
      preheader: 'Your DevKits Vault account was deactivated.',
      accentFrom: AMBER.from,
      accentTo: AMBER.to,
      heading: 'Account Deactivated',
      badgeText: 'Deactivated',
      badgeTone: 'amber',
      bodyHtml: body,
    }),
  };
}

/**
 * 6. Account Deleted Email
 */
export function accountDeletedEmail(params: { name: string; email: string }): EmailContent {
  const displayName = params.name || params.email;
  const body =
    paragraph(`Hello ${highlightText(escapeHtml(displayName))},`) +
    paragraph(
      `Your DevKits Vault account (${highlightText(
        escapeHtml(params.email)
      )}) and all associated data have been ${highlightText('permanently deleted')}.`
    );

  const text = `Hello ${displayName},

Your DevKits Vault account (${params.email}) and all associated files have been permanently deleted.

DevKits Security Team
https://devkits.space`;

  return {
    subject: 'DevKits Vault · Account Deleted',
    text,
    html: renderEmailLayout({
      preheader: 'Your DevKits Vault account was deleted.',
      accentFrom: RED.from,
      accentTo: RED.to,
      heading: 'Account Deleted',
      badgeText: 'Deleted',
      badgeTone: 'rose',
      bodyHtml: body,
    }),
  };
}
