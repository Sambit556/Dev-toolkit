import { renderEmailLayout, paragraph, ctaButton, codeBlock, infoBox, escapeHtml } from './layout';

export interface EmailContent {
  subject: string;
  html: string;
}

// Optional context included when available (see utils/geo.ts / requestContext) — every
// field is optional so callers never need to block on IP/geo lookups to send an email.
export interface SecurityEventContext {
  ip?: string;
  country?: string;
  deviceType?: string;
}

function contextRows(ctx?: SecurityEventContext): Array<{ label: string; value: string }> {
  if (!ctx) return [];
  const rows: Array<{ label: string; value: string }> = [];
  if (ctx.ip) rows.push({ label: 'IP address', value: ctx.ip });
  if (ctx.country) rows.push({ label: 'Location', value: ctx.country });
  if (ctx.deviceType) rows.push({ label: 'Device', value: ctx.deviceType });
  rows.push({ label: 'Time', value: new Date().toUTCString() });
  return rows;
}

const BLUE = { from: '#3b82f6', to: '#8b5cf6' };
const AMBER = { from: '#f59e0b', to: '#ef4444' };
const RED = { from: '#ef4444', to: '#b91c1c' };

export function welcomeEmail(params: { name: string; email: string }): EmailContent {
  const displayName = params.name || params.email;
  const body =
    paragraph(`Hi ${escapeHtml(displayName)},`) +
    paragraph(`Your DevKits Vault account for <strong style="color:#e2e8f0;">${escapeHtml(params.email)}</strong> has been created successfully. Your vault is private, encrypted in transit, and only ever accessible with your credentials.`) +
    paragraph('A few things worth knowing:') +
    `<ul style="margin:0 0 24px 0;padding-left:20px;">
      <li style="margin-bottom:6px;">Uploaded files are scanned before storage and never executed — even previews render through isolated, sandboxed viewers.</li>
      <li style="margin-bottom:6px;">You can deactivate your account any time from Profile &rarr; Danger Zone — it's reversible, and your files are kept safely.</li>
      <li>If anything about this account looks unfamiliar, contact us immediately using the address below.</li>
    </ul>`;
  return {
    subject: 'Welcome to DevKits Vault — your account is ready',
    html: renderEmailLayout({
      preheader: 'Your DevKits Vault account was just created.',
      accentFrom: BLUE.from,
      accentTo: BLUE.to,
      heading: 'Welcome to DevKits Vault',
      bodyHtml: body,
    }),
  };
}

export function accountDeactivatedEmail(params: { name: string; email: string; context?: SecurityEventContext }): EmailContent {
  const displayName = params.name || params.email;
  const body =
    paragraph(`Hi ${escapeHtml(displayName)},`) +
    paragraph(`Your DevKits Vault account has just been <strong style="color:#f8fafc;">deactivated</strong>. You've been signed out of every device, and no one can sign back in until it's reactivated.`) +
    infoBox(contextRows(params.context), 'warning') +
    paragraph('This is reversible — your files and settings have been kept exactly as they were. Only an administrator can reactivate the account.') +
    paragraph("<strong style=\"color:#f87171;\">Didn't do this?</strong> Contact us immediately using the address below — this may mean someone else has access to your account.");
  return {
    subject: 'Your DevKits Vault account has been deactivated',
    html: renderEmailLayout({
      preheader: 'Your account was just deactivated and every session was signed out.',
      accentFrom: AMBER.from,
      accentTo: AMBER.to,
      heading: 'Account Deactivated',
      bodyHtml: body,
    }),
  };
}

export function accountDeletedEmail(params: { name: string; email: string }): EmailContent {
  const displayName = params.name || params.email;
  const body =
    paragraph(`Hi ${escapeHtml(displayName)},`) +
    paragraph(`Your DevKits Vault account (<strong style="color:#f8fafc;">${escapeHtml(params.email)}</strong>) and everything in it — files, folders, and settings — have been <strong style="color:#f87171;">permanently deleted</strong>. This cannot be undone.`) +
    paragraph('If you believe this was a mistake, contact us right away — we may be able to help depending on how recently this happened, but deleted files themselves cannot be recovered.');
  return {
    subject: 'Your DevKits Vault account has been deleted',
    html: renderEmailLayout({
      preheader: 'Your account and all of its files have been permanently deleted.',
      accentFrom: RED.from,
      accentTo: RED.to,
      heading: 'Account Deleted',
      bodyHtml: body,
    }),
  };
}

export function passwordChangedEmail(params: { name: string; email: string; context?: SecurityEventContext }): EmailContent {
  const displayName = params.name || params.email;
  const body =
    paragraph(`Hi ${escapeHtml(displayName)},`) +
    paragraph('The password for your DevKits Vault account was just changed. You&rsquo;ve been signed out on every other device as a precaution.') +
    infoBox(contextRows(params.context)) +
    paragraph("<strong style=\"color:#f87171;\">Didn't do this?</strong> Your account may be compromised — contact us immediately using the address below.");
  return {
    subject: 'Your DevKits Vault password was changed',
    html: renderEmailLayout({
      preheader: 'Your password was just changed — you were signed out everywhere else.',
      accentFrom: BLUE.from,
      accentTo: BLUE.to,
      heading: 'Password Changed',
      bodyHtml: body,
    }),
  };
}

export function passwordChangeOtpEmail(params: { name: string; email: string; otp: string; expiresInMinutes: number }): EmailContent {
  const displayName = params.name || params.email;
  const body =
    paragraph(`Hi ${escapeHtml(displayName)},`) +
    paragraph('A password change was requested for your DevKits Vault <strong style="color:#f8fafc;">Superadmin</strong> account. Enter this code in the Change Password form to continue:') +
    codeBlock(params.otp) +
    paragraph(`This code expires in ${params.expiresInMinutes} minutes and can only be used a few times before it's invalidated.`) +
    paragraph("<strong style=\"color:#f87171;\">Didn't request this?</strong> Ignore this email — your password will not be changed without the code above — and consider rotating the account's credentials as a precaution.");
  return {
    subject: 'Your DevKits Vault Superadmin password-change code',
    html: renderEmailLayout({
      preheader: 'Use this code to confirm your Superadmin password change.',
      accentFrom: AMBER.from,
      accentTo: AMBER.to,
      heading: 'Password Change Verification',
      bodyHtml: body,
    }),
  };
}

export function forgotPasswordEmail(params: { name: string; email: string; resetUrl: string; token: string; expiresInMinutes: number }): EmailContent {
  const displayName = params.name || params.email;
  const body =
    paragraph(`Hi ${escapeHtml(displayName)},`) +
    paragraph('We received a request to reset the password for your DevKits Vault account. Click below to choose a new one — this link fills in the reset form for you.') +
    ctaButton('Reset My Password', params.resetUrl, BLUE.from, BLUE.to) +
    paragraph("If the button doesn't work, open the vault and paste this code into the Reset Password form instead:") +
    codeBlock(params.token) +
    paragraph(`This link and code expire in ${params.expiresInMinutes} minutes. If you didn&rsquo;t request this, you can safely ignore this email — your password will not be changed.`);
  return {
    subject: 'Reset your DevKits Vault password',
    html: renderEmailLayout({
      preheader: 'Use this link to choose a new DevKits Vault password.',
      accentFrom: BLUE.from,
      accentTo: BLUE.to,
      heading: 'Reset Your Password',
      bodyHtml: body,
    }),
  };
}
