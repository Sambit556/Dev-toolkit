// Shared HTML email shell — table-based layout with inline styles throughout
// (Gmail/Outlook strip <style> blocks and don't support flexbox/grid), so every
// visual choice here is deliberately the lowest-common-denominator that still
// renders consistently. No external images/tracking pixels — the brand mark is
// a plain styled table cell, not a hosted asset.

export interface EmailLayoutOptions {
  preheader: string; // hidden preview text shown next to the subject in inbox lists
  accentFrom: string; // gradient start (hex)
  accentTo: string; // gradient end (hex)
  heading: string;
  bodyHtml: string; // pre-built inner HTML (paragraphs, info boxes, button — see helpers below)
}

const FONT_STACK = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export function renderEmailLayout({ preheader, accentFrom, accentTo, heading, bodyHtml }: EmailLayoutOptions): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background-color:#0b1020;font-family:${FONT_STACK};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0b1020;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#0f1526;border-radius:20px;overflow:hidden;border:1px solid #1e2740;">
          <tr>
            <td style="background:linear-gradient(135deg, ${accentFrom}, ${accentTo});height:6px;line-height:6px;font-size:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:32px 36px 8px 36px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg, ${accentFrom}, ${accentTo});text-align:center;vertical-align:middle;font-size:16px;line-height:36px;">&#128737;&#65039;</td>
                  <td style="padding-left:10px;font-size:14px;font-weight:800;letter-spacing:0.06em;color:#e2e8f0;text-transform:uppercase;">DevKits Vault</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 36px 8px 36px;">
              <h1 style="margin:0;font-size:20px;line-height:28px;color:#f8fafc;font-weight:800;">${escapeHtml(heading)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 36px 32px 36px;font-size:14px;line-height:22px;color:#94a3b8;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 36px;border-top:1px solid #1e2740;font-size:11px;line-height:18px;color:#526080;">
              This is an automated security notification from DevKits Vault — you don't need to reply.
              Questions? Contact <a href="mailto:sambitkumar566@gmail.com" style="color:#7c9eff;text-decoration:none;">sambitkumar566@gmail.com</a>.
            </td>
          </tr>
        </table>
        <div style="max-width:560px;padding:16px 12px 0 12px;font-size:11px;color:#3d4763;">
          &copy; ${new Date().getFullYear()} DevKits Vault. Sent because this address is associated with a DevKits Vault account.
        </div>
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
  return `<p style="margin:0 0 16px 0;">${text}</p>`;
}

export function ctaButton(label: string, url: string, accentFrom: string, accentTo: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px 0;">
      <tr>
        <td style="border-radius:10px;background:linear-gradient(135deg, ${accentFrom}, ${accentTo});">
          <a href="${url}" style="display:inline-block;padding:12px 24px;font-size:13px;font-weight:800;color:#ffffff;text-decoration:none;border-radius:10px;">${escapeHtml(label)}</a>
        </td>
      </tr>
    </table>`;
}

export function codeBlock(code: string): string {
  return `
    <div style="margin:8px 0 24px 0;padding:14px 18px;background-color:#161d33;border:1px solid #2a3554;border-radius:10px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:15px;letter-spacing:0.04em;color:#e2e8f0;word-break:break-all;">
      ${escapeHtml(code)}
    </div>`;
}

export function infoBox(rows: Array<{ label: string; value: string }>, tone: 'neutral' | 'warning' = 'neutral'): string {
  const border = tone === 'warning' ? '#3f2a1a' : '#1e2740';
  const bg = tone === 'warning' ? '#1f150c' : '#131a2e';
  const rowsHtml = rows.map(
    (r) => `<tr>
      <td style="padding:6px 0;font-size:12px;color:#64748b;white-space:nowrap;">${escapeHtml(r.label)}</td>
      <td style="padding:6px 0 6px 16px;font-size:12px;color:#cbd5e1;font-weight:600;">${escapeHtml(r.value)}</td>
    </tr>`
  ).join('');
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 24px 0;background-color:${bg};border:1px solid ${border};border-radius:10px;padding:14px 18px;">
      ${rowsHtml}
    </table>`;
}
