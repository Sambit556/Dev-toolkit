export interface EmailTemplate {
  id: string;
  name: string;
  category: 'auth' | 'welcome' | 'billing' | 'devops' | 'updates';
  description: string;
  defaultSubject: string;
  color: string;
  variables: Record<string, string>;
  generateHtml: (vars: Record<string, string>) => string;
}

export const EMAIL_CATEGORIES = [
  { key: 'all', label: 'All Templates' },
  { key: 'auth', label: '🔐 Auth & Security' },
  { key: 'welcome', label: '🚀 Welcome & Onboarding' },
  { key: 'billing', label: '💳 Billing & Receipts' },
  { key: 'devops', label: '📦 DevOps & CI/CD' },
  { key: 'updates', label: '📢 Changelog & Updates' },
] as const;

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'otp-verification',
    name: 'OTP Verification Code',
    category: 'auth',
    description: 'Modern 6-digit one-time password with countdown warning and security advisory.',
    color: '#3b82f6',
    defaultSubject: 'Your DevKits Verification Code: {{otp_code}}',
    variables: {
      user_name: 'Alex',
      otp_code: '749201',
      app_name: 'DevKits',
      expires_in: '10 minutes',
      support_email: 'security@devkits.space',
    },
    generateHtml: (v) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0c1222; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #cbd5e1;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0c1222; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background: linear-gradient(180deg, #111a33 0%, #0c1222 100%); border: 1px solid #1e293b; border-radius: 20px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); overflow: hidden;">
          <!-- Top Accent Bar -->
          <tr>
            <td height="4" style="background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899);"></td>
          </tr>
          <!-- Header -->
          <tr>
            <td style="padding: 36px 36px 20px 36px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <div style="display: inline-block; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 8px 14px; color: #60a5fa; font-weight: 800; font-size: 13px; letter-spacing: 0.05em;">
                      ⚡ ` + (v.app_name || 'DevKits') + ` Security
                    </div>
                  </td>
                </tr>
              </table>
              <h1 style="margin: 24px 0 8px 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">
                Verification Code
              </h1>
              <p style="margin: 0; color: #94a3b8; font-size: 14px; line-height: 1.6;">
                Hi <strong style="color: #f1f5f9;">` + (v.user_name || 'Developer') + `</strong>, use the one-time code below to authenticate your request.
              </p>
            </td>
          </tr>
          <!-- OTP Code Box -->
          <tr>
            <td style="padding: 0 36px 24px 36px;">
              <div style="background: #070b14; border: 1px solid #334155; border-radius: 16px; padding: 24px; text-align: center;">
                <div style="color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 8px;">
                  Your One-Time Password
                </div>
                <div style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; color: #38bdf8; font-size: 36px; font-weight: 900; letter-spacing: 0.25em; text-shadow: 0 0 20px rgba(56, 189, 248, 0.3);">
                  ` + (v.otp_code || '000000') + `
                </div>
                <div style="color: #f59e0b; font-size: 12px; font-weight: 600; margin-top: 10px;">
                  ⏳ Expires in ` + (v.expires_in || '10 minutes') + `
                </div>
              </div>
            </td>
          </tr>
          <!-- Security Warning -->
          <tr>
            <td style="padding: 0 36px 36px 36px;">
              <div style="background: rgba(239, 68, 68, 0.08); border-left: 3px solid #ef4444; padding: 12px 16px; border-radius: 6px;">
                <p style="margin: 0; color: #fca5a5; font-size: 12px; line-height: 1.5;">
                  <strong>Never share this code.</strong> DevKits team members will never ask for your verification code.
                </p>
              </div>
              <p style="margin: 20px 0 0 0; color: #64748b; font-size: 11px; line-height: 1.5;">
                Didn't request this code? Contact <a href="mailto:` + (v.support_email || 'security@devkits.space') + `" style="color: #60a5fa; text-decoration: none;">` + (v.support_email || 'security@devkits.space') + `</a> immediately.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #070a12; padding: 20px 36px; border-top: 1px solid #1e293b; text-align: center;">
              <p style="margin: 0; color: #475569; font-size: 11px;">
                © ` + new Date().getFullYear() + ` ` + (v.app_name || 'DevKits') + `. Cloud Security & Developer Storage Platform.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    id: 'developer-welcome',
    name: 'Developer Welcome & Onboarding',
    category: 'welcome',
    description: 'Engaging onboarding email with setup steps, API key notice, and documentation CTA.',
    color: '#8b5cf6',
    defaultSubject: 'Welcome to {{app_name}} — Your Developer Toolkit is Ready',
    variables: {
      user_name: 'Developer',
      app_name: 'DevKits',
      dashboard_url: 'https://devkits.space/storage',
      docs_url: 'https://devkits.space',
    },
    generateHtml: (v) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to DevKits</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0f1d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #cbd5e1;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0a0f1d; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background: #0f172a; border: 1px solid #1e293b; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);">
          <tr>
            <td height="4" style="background: linear-gradient(90deg, #8b5cf6, #3b82f6, #06b6d4);"></td>
          </tr>
          <tr>
            <td style="padding: 40px 36px 24px 36px;">
              <div style="font-size: 28px; margin-bottom: 16px;">🚀</div>
              <h1 style="margin: 0 0 12px 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">
                Welcome to ` + (v.app_name || 'DevKits') + `, ` + (v.user_name || 'there') + `!
              </h1>
              <p style="margin: 0 0 24px 0; color: #94a3b8; font-size: 14px; line-height: 1.6;">
                Your encrypted workspace and developer toolchain is provisioned. Here are three quick steps to get the most out of your suite:
              </p>

              <!-- Step 1 -->
              <div style="background: #070c18; border: 1px solid #1e293b; border-radius: 12px; padding: 16px; margin-bottom: 12px;">
                <div style="font-weight: 700; color: #38bdf8; font-size: 13px; margin-bottom: 4px;">1. Private Encrypted Vault</div>
                <div style="color: #94a3b8; font-size: 12px; line-height: 1.4;">Store, tag, and stream files securely with AES-GCM-256 client-side isolation.</div>
              </div>

              <!-- Step 2 -->
              <div style="background: #070c18; border: 1px solid #1e293b; border-radius: 12px; padding: 16px; margin-bottom: 12px;">
                <div style="font-weight: 700; color: #c084fc; font-size: 13px; margin-bottom: 4px;">2. Mobile QR Drop & Sync</div>
                <div style="color: #94a3b8; font-size: 12px; line-height: 1.4;">Scan your desktop screen from your phone to beam files directly into your workspace.</div>
              </div>

              <!-- Step 3 -->
              <div style="background: #070c18; border: 1px solid #1e293b; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <div style="font-weight: 700; color: #34d399; font-size: 13px; margin-bottom: 4px;">3. 50+ Developer Utilities</div>
                <div style="color: #94a3b8; font-size: 12px; line-height: 1.4;">JSON transform, Regex debugger, HTTP Toolkit, JWT inspector, and Epoch tools built-in.</div>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0 16px 0;">
                <a href="` + (v.dashboard_url || 'https://devkits.space/storage') + `" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff; font-weight: 800; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.5);">
                  Launch Storage Workspace →
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #060913; padding: 20px 36px; border-top: 1px solid #1e293b; text-align: center;">
              <p style="margin: 0; color: #475569; font-size: 11px;">
                Need assistance? Explore our <a href="` + (v.docs_url || 'https://devkits.space') + `" style="color: #818cf8; text-decoration: none;">documentation</a> or reach out anytime.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    id: 'deployment-success',
    name: 'CI/CD Deployment Passed',
    category: 'devops',
    description: 'DevOps notification showcasing successful build status, git branch, commit hash, and preview URL.',
    color: '#10b981',
    defaultSubject: 'Build #{{build_number}} Passed on {{branch_name}} ({{app_name}})',
    variables: {
      app_name: 'DevKits Web',
      build_number: '142',
      branch_name: 'main',
      commit_hash: '9f8b2c4',
      commit_message: 'feat(email): add template gallery & previewer',
      deploy_time: '1m 24s',
      deploy_url: 'https://devkits.space',
    },
    generateHtml: (v) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Deployment Success</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b1120; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #cbd5e1;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0b1120; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background: #0f172a; border: 1px solid #1e293b; border-radius: 20px; overflow: hidden;">
          <tr>
            <td height="4" style="background: #10b981;"></td>
          </tr>
          <tr>
            <td style="padding: 36px 36px 20px 36px;">
              <div style="display: inline-flex; align-items: center; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 9999px; padding: 4px 12px; color: #34d399; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px;">
                ● Production Deployed
              </div>
              <h1 style="margin: 0 0 8px 0; color: #ffffff; font-size: 22px; font-weight: 800;">
                ` + (v.app_name || 'Project') + ` is Live
              </h1>
              <p style="margin: 0 0 24px 0; color: #94a3b8; font-size: 13px;">
                Build <strong>#` + (v.build_number || '1') + `</strong> successfully built and deployed in <strong>` + (v.deploy_time || '1m') + `</strong>.
              </p>

              <!-- Commit Box -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: #080d1a; border: 1px solid #1e293b; border-radius: 12px; padding: 16px; margin-bottom: 24px; font-family: monospace; font-size: 12px;">
                <tr>
                  <td style="color: #64748b; padding-bottom: 6px;">Branch:</td>
                  <td style="color: #38bdf8; font-weight: bold; text-align: right; padding-bottom: 6px;">` + (v.branch_name || 'main') + `</td>
                </tr>
                <tr>
                  <td style="color: #64748b; padding-bottom: 6px;">Commit:</td>
                  <td style="color: #a78bfa; font-weight: bold; text-align: right; padding-bottom: 6px;">` + (v.commit_hash || 'HEAD') + `</td>
                </tr>
                <tr>
                  <td style="color: #64748b;">Message:</td>
                  <td style="color: #f1f5f9; text-align: right;">` + (v.commit_message || 'Update application') + `</td>
                </tr>
              </table>

              <div style="text-align: center; margin-bottom: 12px;">
                <a href="` + (v.deploy_url || 'https://devkits.space') + `" style="display: inline-block; background: #10b981; color: #022c22; font-weight: 800; font-size: 13px; text-decoration: none; padding: 12px 28px; border-radius: 10px;">
                  View Live Deployment →
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #060913; padding: 16px 36px; border-top: 1px solid #1e293b; text-align: center;">
              <p style="margin: 0; color: #475569; font-size: 11px;">
                Automated notification from DevKits CI/CD Pipeline Engine.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    id: 'invoice-receipt',
    name: 'Invoice & Payment Receipt',
    category: 'billing',
    description: 'Crisp billing statement with itemized services, tax, invoice ID, and payment status.',
    color: '#06b6d4',
    defaultSubject: 'Receipt for Invoice #{{invoice_number}} ({{amount_paid}})',
    variables: {
      user_name: 'Alex Johnson',
      invoice_number: 'INV-2026-084',
      invoice_date: 'August 20, 2026',
      amount_paid: '$29.00',
      plan_name: 'DevKits Pro Suite (Monthly)',
      payment_method: 'Visa ending in 4242',
    },
    generateHtml: (v) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0c1222; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #cbd5e1;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0c1222; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background: #0f172a; border: 1px solid #1e293b; border-radius: 20px; overflow: hidden;">
          <tr>
            <td height="4" style="background: linear-gradient(90deg, #06b6d4, #3b82f6);"></td>
          </tr>
          <tr>
            <td style="padding: 36px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td>
                    <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800;">Payment Receipt</h1>
                    <p style="margin: 4px 0 0 0; color: #64748b; font-size: 12px; font-family: monospace;">Invoice ` + (v.invoice_number || 'INV-001') + ` &middot; ` + (v.invoice_date || 'Today') + `</p>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); font-weight: 800; font-size: 11px; padding: 4px 10px; border-radius: 6px; text-transform: uppercase;">
                      Paid
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Bill details -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
                <tr style="border-bottom: 1px solid #1e293b;">
                  <td style="padding: 12px 0; color: #cbd5e1; font-weight: 600;">` + (v.plan_name || 'Subscription Plan') + `</td>
                  <td style="padding: 12px 0; color: #ffffff; font-weight: 800; text-align: right;">` + (v.amount_paid || '$0.00') + `</td>
                </tr>
                <tr style="border-bottom: 1px solid #1e293b;">
                  <td style="padding: 12px 0; color: #64748b;">Payment Method</td>
                  <td style="padding: 12px 0; color: #94a3b8; text-align: right;">` + (v.payment_method || 'Card') + `</td>
                </tr>
                <tr>
                  <td style="padding: 16px 0 0 0; color: #ffffff; font-size: 15px; font-weight: 800;">Total Amount Paid</td>
                  <td style="padding: 16px 0 0 0; color: #38bdf8; font-size: 20px; font-weight: 900; text-align: right;">` + (v.amount_paid || '$0.00') + `</td>
                </tr>
              </table>

              <p style="margin: 0; color: #64748b; font-size: 12px; line-height: 1.5;">
                Thank you for your business, ` + (v.user_name || 'Customer') + `! This charge will appear as DevKits on your card statement.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #060913; padding: 16px 36px; border-top: 1px solid #1e293b; text-align: center;">
              <p style="margin: 0; color: #475569; font-size: 11px;">
                DevKits Technologies &middot; Questions? Contact billing@devkits.space
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    id: 'security-alert',
    name: 'Security Alert: New Sign-in',
    category: 'auth',
    description: 'High-priority security notification with device, location, and 1-click password lock action.',
    color: '#ef4444',
    defaultSubject: 'Security Alert: New Login to Your DevKits Account',
    variables: {
      user_name: 'Alex',
      device_info: 'Chrome on macOS (San Francisco, US)',
      ip_address: '198.51.100.42',
      login_time: 'August 20, 2026 at 4:30 PM UTC',
      lock_url: 'https://devkits.space/storage?action=security',
    },
    generateHtml: (v) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Alert</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #cbd5e1;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0b0f19; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background: #0f172a; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 20px; overflow: hidden;">
          <tr>
            <td height="4" style="background: #ef4444;"></td>
          </tr>
          <tr>
            <td style="padding: 36px 36px 24px 36px;">
              <div style="display: inline-block; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 6px 12px; color: #f87171; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px;">
                ⚠️ Security Notification
              </div>
              <h1 style="margin: 0 0 10px 0; color: #ffffff; font-size: 22px; font-weight: 800;">
                New Sign-in Detected
              </h1>
              <p style="margin: 0 0 20px 0; color: #94a3b8; font-size: 13px; line-height: 1.6;">
                Hi ` + (v.user_name || 'there') + `, we detected a new login to your DevKits account with the following telemetry:
              </p>

              <!-- Telemetry Card -->
              <div style="background: #080d1a; border: 1px solid #1e293b; border-radius: 12px; padding: 16px; margin-bottom: 24px; font-size: 12px;">
                <div style="margin-bottom: 8px;"><strong style="color: #64748b;">Device & Location:</strong> <span style="color: #f1f5f9; font-weight: 600;">` + (v.device_info || 'Unknown Device') + `</span></div>
                <div style="margin-bottom: 8px;"><strong style="color: #64748b;">IP Address:</strong> <span style="color: #38bdf8; font-family: monospace;">` + (v.ip_address || '127.0.0.1') + `</span></div>
                <div><strong style="color: #64748b;">Time:</strong> <span style="color: #f1f5f9;">` + (v.login_time || 'Just now') + `</span></div>
              </div>

              <p style="margin: 0 0 20px 0; color: #94a3b8; font-size: 13px;">
                If this was you, you can safely ignore this email. If you did not authorize this access, secure your account immediately:
              </p>

              <div style="text-align: center; margin-bottom: 16px;">
                <a href="` + (v.lock_url || 'https://devkits.space/storage') + `" style="display: inline-block; background: #ef4444; color: #ffffff; font-weight: 800; font-size: 13px; text-decoration: none; padding: 12px 28px; border-radius: 10px;">
                  Review & Lock Account →
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #060913; padding: 16px 36px; border-top: 1px solid #1e293b; text-align: center;">
              <p style="margin: 0; color: #475569; font-size: 11px;">
                DevKits Automated Threat Protection &middot; security@devkits.space
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    id: 'changelog-update',
    name: 'Product Changelog & Updates',
    category: 'updates',
    description: 'Showcase recent feature rollouts, bug fixes, and version releases with pill badges.',
    color: '#ec4899',
    defaultSubject: 'What\'s New in {{app_name}} v{{version_number}} 🚀',
    variables: {
      app_name: 'DevKits',
      version_number: '2.4.0',
      feature_1: 'Interactive Email Template Gallery with Live Mobile & Desktop Previews',
      feature_2: 'Sleek Light Mode Contrast & Unified Popover Tooltip System',
      feature_3: 'Superadmin Active Scans Telemetry & Session Monitoring',
      cta_url: 'https://devkits.space/storage',
    },
    generateHtml: (v) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Product Update</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #cbd5e1;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0b0f19; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background: #0f172a; border: 1px solid #1e293b; border-radius: 20px; overflow: hidden;">
          <tr>
            <td height="4" style="background: linear-gradient(90deg, #ec4899, #8b5cf6, #3b82f6);"></td>
          </tr>
          <tr>
            <td style="padding: 36px 36px 24px 36px;">
              <span style="display: inline-block; background: rgba(236, 72, 153, 0.15); border: 1px solid rgba(236, 72, 153, 0.3); border-radius: 9999px; padding: 4px 12px; color: #f472b6; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px;">
                Version ` + (v.version_number || '2.4.0') + ` Release
              </span>
              <h1 style="margin: 0 0 12px 0; color: #ffffff; font-size: 24px; font-weight: 800;">
                What's New in ` + (v.app_name || 'DevKits') + `
              </h1>
              <p style="margin: 0 0 24px 0; color: #94a3b8; font-size: 14px; line-height: 1.6;">
                We just deployed our latest platform enhancements to accelerate your workflow. Here are the key highlights:
              </p>

              <!-- Highlight 1 -->
              <div style="background: #080d1a; border: 1px solid #1e293b; border-radius: 12px; padding: 16px; margin-bottom: 12px;">
                <div style="font-weight: 800; color: #f472b6; font-size: 13px; margin-bottom: 4px;">✨ ` + (v.feature_1 || '') + `</div>
              </div>

              <!-- Highlight 2 -->
              <div style="background: #080d1a; border: 1px solid #1e293b; border-radius: 12px; padding: 16px; margin-bottom: 12px;">
                <div style="font-weight: 800; color: #c084fc; font-size: 13px; margin-bottom: 4px;">🎨 ` + (v.feature_2 || '') + `</div>
              </div>

              <!-- Highlight 3 -->
              <div style="background: #080d1a; border: 1px solid #1e293b; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <div style="font-weight: 800; color: #38bdf8; font-size: 13px; margin-bottom: 4px;">⚡ ` + (v.feature_3 || '') + `</div>
              </div>

              <div style="text-align: center; margin-bottom: 12px;">
                <a href="` + (v.cta_url || 'https://devkits.space/storage') + `" style="display: inline-block; background: linear-gradient(135deg, #ec4899, #8b5cf6); color: #ffffff; font-weight: 800; font-size: 13px; text-decoration: none; padding: 12px 30px; border-radius: 10px; box-shadow: 0 10px 25px -5px rgba(236, 72, 153, 0.4);">
                  Try New Features Now →
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #060913; padding: 16px 36px; border-top: 1px solid #1e293b; text-align: center;">
              <p style="margin: 0; color: #475569; font-size: 11px;">
                © ` + new Date().getFullYear() + ` ` + (v.app_name || 'DevKits') + `. You received this because you are an active developer on DevKits.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
];
