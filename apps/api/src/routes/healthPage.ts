import os from 'os';

interface HealthSnapshot {
  status: string;
  version: string;
  uptime: number;
  timestamp: string;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h || d) parts.push(`${h}h`);
  if (m || h || d) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

export function renderHealthPage(snapshot: HealthSnapshot): string {
  const mem = process.memoryUsage();
  const isOk = snapshot.status === 'ok';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>API Status &middot; DevChrono JSONLab</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${isOk ? '🟢' : '🔴'}</text></svg>" />
<style>
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');

  :root {
    --bg: #ffffff;
    --fg: #0f172a;
    --muted: #64748b;
    --card: #ffffff;
    --border: #e2e8f0;
    --primary: #3b6df0;
    --ok: #16a34a;
    --ok-bg: #dcfce7;
    --bad: #dc2626;
    --bad-bg: #fee2e2;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #0b1220;
      --fg: #f1f5f9;
      --muted: #94a3b8;
      --card: #111a2e;
      --border: #1e293b;
      --primary: #5b8bf7;
      --ok: #4ade80;
      --ok-bg: rgba(74, 222, 128, 0.12);
      --bad: #f87171;
      --bad-bg: rgba(248, 113, 113, 0.12);
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg);
    color: var(--fg);
    font-family: 'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace;
    padding: 2rem 1rem;
  }
  .wrap { width: 100%; max-width: 640px; }
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.25rem;
  }
  .title { font-size: 0.95rem; color: var(--muted); }
  .title strong { color: var(--fg); }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.35rem 0.75rem;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 600;
    background: ${isOk ? 'var(--ok-bg)' : 'var(--bad-bg)'};
    color: ${isOk ? 'var(--ok)' : 'var(--bad)'};
  }
  .dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background: currentColor;
    box-shadow: 0 0 0 3px currentColor22;
    animation: pulse 2s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  .card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    overflow: hidden;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }
  .metric {
    padding: 1.1rem 1.25rem;
    border-bottom: 1px solid var(--border);
  }
  .metric:nth-last-child(-n+2) { border-bottom: none; }
  .metric:nth-child(odd) { border-right: 1px solid var(--border); }
  .metric-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--muted);
    margin-bottom: 0.35rem;
  }
  .metric-value {
    font-size: 1.05rem;
    font-weight: 600;
    word-break: break-word;
  }
  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 1rem;
    font-size: 0.75rem;
    color: var(--muted);
  }
  .footer a { color: var(--primary); text-decoration: none; }
  .footer a:hover { text-decoration: underline; }
  @media (max-width: 480px) {
    .grid { grid-template-columns: 1fr; }
    .metric:nth-child(odd) { border-right: none; }
    .metric:nth-last-child(-n+2) { border-bottom: 1px solid var(--border); }
    .metric:last-child { border-bottom: none; }
  }
</style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <div class="title"><strong>DevChrono JSONLab</strong> &middot; API Status</div>
      <span class="badge" id="badge"><span class="dot"></span><span id="badge-text">${isOk ? 'Operational' : 'Degraded'}</span></span>
    </div>
    <div class="card">
      <div class="grid">
        <div class="metric">
          <div class="metric-label">Version</div>
          <div class="metric-value" id="m-version">${snapshot.version}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Uptime</div>
          <div class="metric-value" id="m-uptime">${formatUptime(snapshot.uptime)}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Environment</div>
          <div class="metric-value">${process.env.NODE_ENV || 'development'}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Node.js</div>
          <div class="metric-value">${process.version}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Memory (RSS)</div>
          <div class="metric-value" id="m-memory">${formatBytes(mem.rss)}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Host</div>
          <div class="metric-value">${os.hostname()}</div>
        </div>
      </div>
    </div>
    <div class="footer">
      <span id="last-updated">Updated just now</span>
      <a href="/openapi.json">OpenAPI spec</a>
    </div>
  </div>
  <script>
    async function refresh() {
      try {
        const res = await fetch('/health', { headers: { Accept: 'application/json' } });
        const data = await res.json();
        const ok = data.status === 'ok';

        document.getElementById('badge').style.background = ok ? 'var(--ok-bg)' : 'var(--bad-bg)';
        document.getElementById('badge').style.color = ok ? 'var(--ok)' : 'var(--bad)';
        document.getElementById('badge-text').textContent = ok ? 'Operational' : 'Degraded';
        document.getElementById('m-version').textContent = data.version;

        const days = 86400, hours = 3600, mins = 60;
        let s = Math.floor(data.uptime);
        const d = Math.floor(s / days); s %= days;
        const h = Math.floor(s / hours); s %= hours;
        const m = Math.floor(s / mins); s %= mins;
        const parts = [];
        if (d) parts.push(d + 'd');
        if (h || d) parts.push(h + 'h');
        if (m || h || d) parts.push(m + 'm');
        parts.push(s + 's');
        document.getElementById('m-uptime').textContent = parts.join(' ');

        document.getElementById('last-updated').textContent =
          'Updated ' + new Date().toLocaleTimeString();
      } catch (e) {
        document.getElementById('badge-text').textContent = 'Unreachable';
        document.getElementById('badge').style.background = 'var(--bad-bg)';
        document.getElementById('badge').style.color = 'var(--bad)';
      }
    }
    setInterval(refresh, 5000);
  </script>
</body>
</html>`;
}
