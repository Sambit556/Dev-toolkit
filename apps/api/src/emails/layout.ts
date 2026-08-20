// Professional HTML Email Layout & UI Helper Kit
// Compatible across Gmail, Apple Mail, Outlook, and mobile clients with table-based rendering

export interface EmailLayoutOptions {
  preheader: string;
  accentFrom: string;
  accentTo: string;
  heading: string;
  badgeText?: string;
  badgeTone?: 'blue' | 'purple' | 'amber' | 'emerald' | 'rose';
  bodyHtml: string;
}

const FONT_STACK = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export function renderEmailLayout({
  preheader,
  accentFrom,
  accentTo,
  heading,
  badgeText,
  badgeTone = 'blue',
  bodyHtml,
}: EmailLayoutOptions): string {
  const badgeBg = {
    blue: 'rgba(59, 130, 246, 0.15)',
    purple: 'rgba(139, 92, 246, 0.15)',
    amber: 'rgba(245, 158, 11, 0.15)',
    emerald: 'rgba(16, 185, 129, 0.15)',
    rose: 'rgba(244, 63, 94, 0.15)',
  }[badgeTone];

  const badgeColor = {
    blue: '#60a5fa',
    purple: '#c084fc',
    amber: '#fbbf24',
    emerald: '#34d399',
    rose: '#fb7185',
  }[badgeTone];

  const badgeBorder = {
    blue: 'rgba(59, 130, 246, 0.3)',
    purple: 'rgba(139, 92, 246, 0.3)',
    amber: 'rgba(245, 158, 11, 0.3)',
    emerald: 'rgba(16, 185, 129, 0.3)',
    rose: 'rgba(244, 63, 94, 0.3)',
  }[badgeTone];

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background-color:#060b18;font-family:${FONT_STACK};-webkit-font-smoothing:antialiased;">
  <!-- Preview text in inbox list -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#060b18;padding:40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background-color:#0b1226;border-radius:24px;overflow:hidden;border:1px solid #1a2747;box-shadow:0 20px 40px rgba(0,0,0,0.5);">
          <!-- Top Cyber Gradient Accent Line -->
          <tr>
            <td style="background:linear-gradient(90deg, ${accentFrom}, ${accentTo}, #06b6d4);height:5px;line-height:5px;font-size:0;">&nbsp;</td>
          </tr>

          <!-- Header / Brand -->
          <tr>
            <td style="padding:36px 40px 12px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <!-- Stylized DevKits Logo Mark -->
                        <td style="width:38px;height:38px;border-radius:12px;background:linear-gradient(135deg, ${accentFrom}, ${accentTo});text-align:center;vertical-align:middle;font-weight:900;font-size:14px;color:#ffffff;letter-spacing:0.02em;box-shadow:0 4px 12px rgba(37,99,235,0.35);">
                          DK
                        </td>
                        <td style="padding-left:14px;">
                          <div style="font-size:16px;font-weight:800;letter-spacing:0.02em;color:#f8fafc;">
                            DevKits <span style="font-weight:400;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;margin-left:4px;">Security</span>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  ${
                    badgeText
                      ? `<td align="right">
                          <span style="display:inline-block;padding:4px 12px;border-radius:9999px;font-size:10px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;background-color:${badgeBg};color:${badgeColor};border:1px solid ${badgeBorder};">
                            ${escapeHtml(badgeText)}
                          </span>
                        </td>`
                      : ''
                  }
                </tr>
              </table>
            </td>
          </tr>

          <!-- Heading -->
          <tr>
            <td style="padding:20px 40px 10px 40px;">
              <h1 style="margin:0;font-size:22px;line-height:30px;color:#ffffff;font-weight:800;letter-spacing:-0.02em;">
                ${escapeHtml(heading)}
              </h1>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:10px 40px 36px 40px;font-size:14px;line-height:24px;color:#94a3b8;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Security Footer Divider -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #16203a;background-color:#080e20;font-size:11px;line-height:20px;color:#475569;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="color:#64748b;font-weight:600;margin-bottom:4px;">
                      &#128274; Verified DevKits Security Notification
                    </div>
                    <div>
                      This automated alert was dispatched to your registered email address. If you have inquiries, reach us at <a href="mailto:support@devkits.space" style="color:#60a5fa;text-decoration:none;font-weight:600;">support@devkits.space</a>.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Outer Sub-Footer -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;margin-top:20px;text-align:center;">
          <tr>
            <td style="font-size:11px;line-height:18px;color:#334155;">
              &copy; ${new Date().getFullYear()} DevKits Developer Utility Suite &bull; <a href="https://devkits.space" style="color:#475569;text-decoration:none;">devkits.space</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export function paragraph(text: string): string {
  return `<p style="margin:0 0 16px 0;color:#94a3b8;font-size:14px;line-height:24px;">${text}</p>`;
}

export function highlightText(text: string): string {
  return `<strong style="color:#f8fafc;font-weight:700;">${text}</strong>`;
}

export function ctaButton(label: string, url: string, accentFrom: string, accentTo: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0 24px 0;">
      <tr>
        <td align="center" style="border-radius:12px;background:linear-gradient(135deg, ${accentFrom}, ${accentTo});box-shadow:0 8px 20px rgba(37,99,235,0.3);">
          <a href="${url}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:800;color:#ffffff;text-decoration:none;border-radius:12px;letter-spacing:0.02em;">
            ${escapeHtml(label)} &rarr;
          </a>
        </td>
      </tr>
    </table>`;
}

export function otpBlock(otp: string, label = 'One-Time Verification Code'): string {
  return `
    <div style="margin:20px 0 24px 0;padding:24px;background-color:#070d1d;border:1px solid #23345c;border-radius:16px;text-align:center;box-shadow:inset 0 2px 8px rgba(0,0,0,0.6);">
      <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.12em;color:#60a5fa;margin-bottom:12px;">
        &#128272; ${escapeHtml(label)}
      </div>
      <div style="font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:32px;font-weight:900;letter-spacing:0.25em;color:#ffffff;text-shadow:0 0 16px rgba(96,165,250,0.5);margin:4px 0;">
        ${escapeHtml(otp)}
      </div>
      <div style="font-size:11px;color:#64748b;margin-top:10px;">
        Expires in 10 minutes &bull; Single-use only
      </div>
    </div>`;
}

export function codeBlock(code: string): string {
  return `
    <div style="margin:16px 0 24px 0;padding:16px 20px;background-color:#070d1d;border:1px solid #1e293b;border-radius:12px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:13px;letter-spacing:0.04em;color:#cbd5e1;word-break:break-all;line-height:20px;">
      ${escapeHtml(code)}
    </div>`;
}

export function infoBox(rows: Array<{ label: string; value: string }>, tone: 'neutral' | 'warning' = 'neutral'): string {
  const border = tone === 'warning' ? '#451a03' : '#1e293b';
  const bg = tone === 'warning' ? '#1c1007' : '#080e22';
  const rowsHtml = rows
    .map(
      (r) => `<tr>
      <td style="padding:6px 0;font-size:12px;color:#64748b;white-space:nowrap;font-weight:600;">${escapeHtml(r.label)}</td>
      <td style="padding:6px 0 6px 20px;font-size:12px;color:#e2e8f0;font-weight:600;font-family:ui-monospace,monospace;">${escapeHtml(r.value)}</td>
    </tr>`
    )
    .join('');

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 24px 0;background-color:${bg};border:1px solid ${border};border-radius:14px;padding:16px 20px;">
      ${rowsHtml}
    </table>`;
}
