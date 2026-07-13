export type SecurityHeaderStatus = 'good' | 'weak' | 'missing';

export interface SecurityHeaderFinding {
  header: string;
  status: SecurityHeaderStatus;
  detail: string;
  weight: number;
}

export interface SecurityGradeResult {
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  score: number;
  findings: SecurityHeaderFinding[];
}

function normalize(headers: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) out[k.toLowerCase()] = v;
  return out;
}

export function gradeSecurityHeaders(rawHeaders: Record<string, string>): SecurityGradeResult {
  const headers = normalize(rawHeaders);
  const findings: SecurityHeaderFinding[] = [];

  const hsts = headers['strict-transport-security'];
  if (!hsts) {
    findings.push({ header: 'Strict-Transport-Security', status: 'missing', detail: 'Not set — browsers may downgrade to plain HTTP on future visits.', weight: 20 });
  } else {
    const maxAgeMatch = hsts.match(/max-age=(\d+)/i);
    const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 0;
    if (maxAge < 15552000) {
      findings.push({ header: 'Strict-Transport-Security', status: 'weak', detail: `max-age is ${maxAge}s — recommend at least 15552000 (180 days).`, weight: 20 });
    } else {
      findings.push({ header: 'Strict-Transport-Security', status: 'good', detail: hsts, weight: 20 });
    }
  }

  const csp = headers['content-security-policy'];
  if (!csp) {
    findings.push({ header: 'Content-Security-Policy', status: 'missing', detail: 'Not set — no defense-in-depth against XSS/injection.', weight: 25 });
  } else if (/unsafe-inline|unsafe-eval/i.test(csp)) {
    findings.push({ header: 'Content-Security-Policy', status: 'weak', detail: "Allows 'unsafe-inline' or 'unsafe-eval', which weakens XSS protection.", weight: 25 });
  } else {
    findings.push({ header: 'Content-Security-Policy', status: 'good', detail: 'Set with no unsafe-inline/unsafe-eval.', weight: 25 });
  }

  const xcto = headers['x-content-type-options'];
  if (!xcto || xcto.toLowerCase() !== 'nosniff') {
    findings.push({ header: 'X-Content-Type-Options', status: 'missing', detail: 'Not set to "nosniff" — browsers may MIME-sniff responses.', weight: 15 });
  } else {
    findings.push({ header: 'X-Content-Type-Options', status: 'good', detail: xcto, weight: 15 });
  }

  const xfo = headers['x-frame-options'];
  const cspFrameAncestors = csp && /frame-ancestors/i.test(csp);
  if (!xfo && !cspFrameAncestors) {
    findings.push({ header: 'X-Frame-Options / frame-ancestors', status: 'missing', detail: 'Neither set — page can be framed by any site (clickjacking risk).', weight: 15 });
  } else {
    findings.push({ header: 'X-Frame-Options / frame-ancestors', status: 'good', detail: xfo || 'frame-ancestors set via CSP', weight: 15 });
  }

  const referrer = headers['referrer-policy'];
  if (!referrer) {
    findings.push({ header: 'Referrer-Policy', status: 'missing', detail: 'Not set — full URLs may leak to third parties via the Referer header.', weight: 10 });
  } else {
    findings.push({ header: 'Referrer-Policy', status: 'good', detail: referrer, weight: 10 });
  }

  const permissions = headers['permissions-policy'];
  if (!permissions) {
    findings.push({ header: 'Permissions-Policy', status: 'missing', detail: 'Not set — browser features (camera, geolocation, etc.) are not explicitly restricted.', weight: 10 });
  } else {
    findings.push({ header: 'Permissions-Policy', status: 'good', detail: permissions, weight: 10 });
  }

  const setCookie = headers['set-cookie'];
  if (setCookie) {
    const missingFlags: string[] = [];
    if (!/secure/i.test(setCookie)) missingFlags.push('Secure');
    if (!/httponly/i.test(setCookie)) missingFlags.push('HttpOnly');
    if (!/samesite/i.test(setCookie)) missingFlags.push('SameSite');
    if (missingFlags.length > 0) {
      findings.push({ header: 'Set-Cookie flags', status: 'weak', detail: `Missing: ${missingFlags.join(', ')}`, weight: 5 });
    } else {
      findings.push({ header: 'Set-Cookie flags', status: 'good', detail: 'Secure, HttpOnly, and SameSite all present.', weight: 5 });
    }
  }

  const totalWeight = findings.reduce((sum, f) => sum + f.weight, 0);
  const earnedWeight = findings.reduce((sum, f) => sum + (f.status === 'good' ? f.weight : f.status === 'weak' ? f.weight * 0.5 : 0), 0);
  const score = totalWeight === 0 ? 100 : Math.round((earnedWeight / totalWeight) * 100);

  let grade: SecurityGradeResult['grade'];
  if (score >= 90) grade = 'A';
  else if (score >= 75) grade = 'B';
  else if (score >= 60) grade = 'C';
  else if (score >= 40) grade = 'D';
  else grade = 'F';

  return { grade, score, findings };
}
