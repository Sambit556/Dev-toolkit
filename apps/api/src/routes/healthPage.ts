import os from 'os';

interface HealthSnapshot {
  status: string;
  database: string;
  storage: string;
  authentication: string;
  redis: string;
  env: string;
  version: string;
  uptime: number;
  timestamp: string;
  details: {
    dbError?: string;
    s3Error?: string;
    redisStatus: string;
  };
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
  const isHealthy = snapshot.status === 'ok';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>System Diagnostics &middot; DevChrono JSONLab</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${isHealthy ? '🟢' : '🟡'}</text></svg>" />
<style>
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');

  :root {
    --bg: #0b0f19;
    --fg: #f1f5f9;
    --muted: #94a3b8;
    --card: #111827;
    --border: #1f2937;
    --primary: #3b82f6;
    --ok: #10b981;
    --ok-bg: rgba(16, 185, 129, 0.1);
    --bad: #ef4444;
    --bad-bg: rgba(239, 68, 68, 0.1);
    --warn: #f59e0b;
    --warn-bg: rgba(245, 158, 11, 0.1);
  }

  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg) radial-gradient(circle at top, #1e293b 0%, var(--bg) 70%);
    color: var(--fg);
    font-family: 'JetBrains Mono', monospace;
    padding: 2rem 1rem;
  }
  .wrap { width: 100%; max-width: 720px; }
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid var(--border);
    padding-bottom: 1rem;
  }
  .title { font-size: 1.1rem; color: var(--muted); }
  .title strong { color: var(--fg); text-shadow: 0 0 10px rgba(59, 130, 246, 0.3); }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.8rem;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 600;
    background: ${isHealthy ? 'var(--ok-bg)' : 'var(--warn-bg)'};
    color: ${isHealthy ? 'var(--ok)' : 'var(--warn)'};
    border: 1px solid currentColor;
  }
  .dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background: currentColor;
    animation: pulse 2s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; filter: drop-shadow(0 0 2px currentColor); }
    50% { opacity: 0.4; }
  }
  .card {
    background: rgba(17, 24, 39, 0.8);
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    backdrop-filter: blur(10px);
    overflow: hidden;
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
  }
  .section-title {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--muted);
    padding: 1rem 1.25rem 0.5rem 1.25rem;
    border-bottom: 1px solid var(--border);
    background: rgba(31, 41, 55, 0.3);
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }
  .dependency-list {
    padding: 0.5rem 1.25rem;
    border-bottom: 1px solid var(--border);
  }
  .dep-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 0;
    border-bottom: 1px solid rgba(31, 41, 55, 0.5);
  }
  .dep-item:last-child { border-bottom: none; }
  .dep-label { font-size: 0.85rem; font-weight: 500; }
  .dep-status {
    font-size: 0.75rem;
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    font-weight: 600;
  }
  .status-healthy { background: var(--ok-bg); color: var(--ok); }
  .status-unhealthy { background: var(--bad-bg); color: var(--bad); }
  .status-warn { background: var(--warn-bg); color: var(--warn); }

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
    font-size: 0.95rem;
    font-weight: 600;
    word-break: break-word;
  }
  .error-panel {
    background: rgba(239, 68, 68, 0.05);
    border-top: 1px solid rgba(239, 68, 68, 0.2);
    padding: 1rem 1.25rem;
    font-size: 0.75rem;
  }
  .error-title { color: var(--bad); font-weight: bold; margin-bottom: 0.25rem; }
  .error-desc { color: #f87171; white-space: pre-wrap; font-family: monospace; }
  
  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 1.5rem;
    font-size: 0.75rem;
    color: var(--muted);
  }
  .footer a { color: var(--primary); text-decoration: none; }
  .footer a:hover { text-decoration: underline; }

  @media (max-width: 600px) {
    .grid { grid-template-columns: 1fr; }
    .metric:nth-child(odd) { border-right: none; border-bottom: 1px solid var(--border); }
    .metric:nth-last-child(-n+2) { border-bottom: 1px solid var(--border); }
    .metric:last-child { border-bottom: none; }
  }
</style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <div class="title"><strong>DevChrono</strong> &middot; Diagnostic Board</div>
      <span class="badge" id="badge"><span class="dot"></span><span id="badge-text">${isHealthy ? 'Operational' : 'Degraded'}</span></span>
    </div>
    
    <div class="card">
      <div class="section-title">Core Resource Status</div>
      <div class="dependency-list">
        <div class="dep-item">
          <span class="dep-label">PostgreSQL Database</span>
          <span class="dep-status ${snapshot.database === 'healthy' ? 'status-healthy' : 'status-unhealthy'}">${snapshot.database.toUpperCase()}</span>
        </div>
        <div class="dep-item">
          <span class="dep-label">AWS S3 Cloud Storage</span>
          <span class="dep-status ${snapshot.storage === 'healthy' ? 'status-healthy' : 'status-unhealthy'}">${snapshot.storage.toUpperCase()}</span>
        </div>
        <div class="dep-item">
          <span class="dep-label">JWT Cryptography Config</span>
          <span class="dep-status ${snapshot.authentication === 'healthy' ? 'status-healthy' : 'status-unhealthy'}">${snapshot.authentication === 'healthy' ? 'VALID' : 'UNCONFIGURED'}</span>
        </div>
        <div class="dep-item">
          <span class="dep-label">Server Session Store</span>
          <span class="dep-status ${snapshot.redis === 'connected' ? 'status-healthy' : 'status-warn'}">${snapshot.redis === 'connected' ? 'REDIS (ONLINE)' : 'IN-MEMORY (FALLBACK)'}</span>
        </div>
        <div class="dep-item">
          <span class="dep-label">Environment File (.env)</span>
          <span class="dep-status ${snapshot.env === 'valid' ? 'status-healthy' : 'status-unhealthy'}">${snapshot.env === 'valid' ? 'COMPLETE' : 'INCOMPLETE'}</span>
        </div>
      </div>

      <div class="section-title">Node.js Process Performance</div>
      <div class="grid">
        <div class="metric">
          <div class="metric-label">API Version</div>
          <div class="metric-value">${snapshot.version}</div>
        </div>
        <div class="metric">
          <div class="metric-label">System Uptime</div>
          <div class="metric-value" id="m-uptime">${formatUptime(snapshot.uptime)}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Memory Allocation (RSS)</div>
          <div class="metric-value">${formatBytes(mem.rss)}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Host OS Node</div>
          <div class="metric-value">${os.hostname()} (${os.platform()})</div>
        </div>
      </div>

      ${
        snapshot.details.dbError || snapshot.details.s3Error
          ? `<div class="error-panel">
              ${
                snapshot.details.dbError
                  ? `<div class="error-title">Database Error:</div>
                     <div class="error-desc">${snapshot.details.dbError}</div>`
                  : ''
              }
              ${
                snapshot.details.s3Error
                  ? `<div class="error-title" style="margin-top: 0.5rem;">S3 Storage Error:</div>
                     <div class="error-desc">${snapshot.details.s3Error}</div>`
                  : ''
              }
             </div>`
          : ''
      }
    </div>
    
    <div class="footer">
      <span id="last-updated">Diagnostics refreshed just now</span>
      <a href="/openapi.json">OpenAPI Spec</a>
    </div>
  </div>
</body>
</html>`;
}
