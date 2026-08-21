'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  RefreshCw,
  ExternalLink,
  Laptop,
  Tablet,
  Smartphone,
  X,
  Globe,
  Radio,
  Copy,
  Check,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useCloudIdeStore } from '../../store/useCloudIdeStore';

interface LiveBrowserPreviewProps {
  onClose?: () => void;
}

export const LiveBrowserPreview: React.FC<LiveBrowserPreviewProps> = ({ onClose }) => {
  const {
    files,
    currentLanguage,
    addTerminalLog,
    addStderrLog,
    isLivePreviewOpen,
    toggleLivePreview,
  } = useCloudIdeStore();

  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [iframeSrcDoc, setIframeSrcDoc] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Generate live bundle HTML based on language runtime and files
  const generateLiveBundle = (): string => {
    const normLang = currentLanguage.toLowerCase();
    const indexHtml = files.find((f) => f.name === 'index.html')?.content || '';
    const styleCss = files.find((f) => f.name.endsWith('.css'))?.content || '';

    // Message passing script for console logging inside the preview iframe
    const consoleBridgeScript = `
      <script>
        (function() {
          const _log = console.log;
          const _error = console.error;
          const _warn = console.warn;

          function sendToParent(type, args) {
            try {
              window.parent.postMessage({
                source: 'devkits-preview-frame',
                type: type,
                payload: Array.from(args).map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
              }, '*');
            } catch (e) {}
          }

          console.log = function(...args) {
            _log.apply(console, args);
            sendToParent('log', args);
          };
          console.error = function(...args) {
            _error.apply(console, args);
            sendToParent('error', args);
          };
          console.warn = function(...args) {
            _warn.apply(console, args);
            sendToParent('warn', args);
          };

          window.addEventListener('error', function(e) {
            sendToParent('error', [e.message + ' at ' + e.filename + ':' + e.lineno]);
          });
        })();
      </script>
    `;

    // 1. React.js (18) Runtime with Babel & Tailwind
    if (normLang === 'react') {
      const reactFile = files.find((f) => f.name.endsWith('.tsx') || f.name.endsWith('.jsx'))?.content || '';
      
      // Clean module imports so Babel standalone executes cleanly in browser scope
      let cleanReactCode = reactFile
        .replace(/import\s+React(?:\s*,\s*\{[^}]*\})?\s+from\s+['"]react['"];?/g, '')
        .replace(/import\s+\{[^}]*\}\s+from\s+['"]react['"];?/g, '')
        .replace(/export\s+default\s+function\s+([a-zA-Z0-9_]+)/g, 'function $1')
        .replace(/export\s+default\s+([a-zA-Z0-9_]+);?/g, '');

      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>React 18 Live Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.24.0/babel.min.js"></script>
  <style>
    ${styleCss}
  </style>
  ${consoleBridgeScript}
</head>
<body class="bg-slate-950 text-slate-100">
  <div id="root"></div>
  <script type="text/babel">
    const { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } = React;

    try {
      ${cleanReactCode}

      const TargetComponent = typeof App !== 'undefined' ? App : () => (
        <div className="p-8 text-center text-slate-300">
          <h2 className="text-xl font-bold text-white mb-2">React 18 Ready</h2>
          <p className="text-sm text-slate-400">Define an App component in App.tsx to see your changes live.</p>
        </div>
      );

      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(React.createElement(TargetComponent));
    } catch (err) {
      document.getElementById('root').innerHTML = '<div style="padding: 20px; color: #f87171; font-family: monospace; font-size: 13px;"><strong>React Render Error:</strong><br/>' + err.message + '</div>';
      console.error(err);
    }
  </script>
</body>
</html>`;
    }

    // 2. Vue.js (3) Runtime
    if (normLang === 'vue') {
      const vueFile = files.find((f) => f.name.endsWith('.vue'))?.content || '';
      const templateMatch = vueFile.match(/<template>([\s\S]*?)<\/template>/);
      const scriptMatch = vueFile.match(/<script>([\s\S]*?)<\/script>/);
      const styleMatch = vueFile.match(/<style>([\s\S]*?)<\/style>/);

      const templateContent = templateMatch ? templateMatch[1] : '<div class="p-8 text-center text-white"><h1>Vue 3 App Ready</h1></div>';
      let scriptContent = scriptMatch ? scriptMatch[1].replace(/export\s+default\s+/, 'const ComponentOptions = ') : 'const ComponentOptions = {};';

      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vue 3 Live Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
  <style>
    ${styleCss}
    ${styleMatch ? styleMatch[1] : ''}
  </style>
  ${consoleBridgeScript}
</head>
<body class="bg-slate-950 text-slate-100">
  <div id="app">
    ${templateContent}
  </div>
  <script>
    try {
      ${scriptContent}
      const app = Vue.createApp(typeof ComponentOptions !== 'undefined' ? ComponentOptions : {});
      app.mount('#app');
    } catch(err) {
      document.getElementById('app').innerHTML = '<div style="padding: 20px; color: #f87171; font-family: monospace; font-size: 13px;"><strong>Vue 3 Error:</strong><br/>' + err.message + '</div>';
      console.error(err);
    }
  </script>
</body>
</html>`;
    }

    // 3. Angular Standalone Component Runtime
    if (normLang === 'angular') {
      if (indexHtml) {
        return indexHtml.includes('<!DOCTYPE')
          ? indexHtml.replace('</head>', `<style>${styleCss}</style>${consoleBridgeScript}</head>`)
          : `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script><style>${styleCss}</style>${consoleBridgeScript}</head><body>${indexHtml}</body></html>`;
      }
    }

    // 4. Svelte Component Runtime
    if (normLang === 'svelte') {
      const svelteFile = files.find((f) => f.name.endsWith('.svelte'))?.content || '';
      const scriptMatch = svelteFile.match(/<script>([\s\S]*?)<\/script>/);
      const templateContent = svelteFile.replace(/<script>[\s\S]*?<\/script>/, '');

      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Svelte Live Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    ${styleCss}
  </style>
  ${consoleBridgeScript}
</head>
<body class="bg-slate-950 text-slate-100">
  <div id="svelte-root">
    ${templateContent}
  </div>
  <script>
    try {
      ${scriptMatch ? scriptMatch[1] : ''}
    } catch(e) {
      console.error('Svelte script error:', e);
    }
  </script>
</body>
</html>`;
    }

    // 5. HTML5 / CSS / Vanilla JS Playground
    if (indexHtml) {
      let finalHtml = indexHtml;
      const jsFile = files.find((f) => f.name.endsWith('.js') && f.name !== 'index.html')?.content || '';

      if (!finalHtml.includes('</head>')) {
        finalHtml = `<!DOCTYPE html><html><head><style>${styleCss}</style>${consoleBridgeScript}</head><body>${finalHtml}</body></html>`;
      } else {
        finalHtml = finalHtml.replace('</head>', `<style>${styleCss}</style>${consoleBridgeScript}</head>`);
      }

      if (jsFile && !finalHtml.includes(jsFile)) {
        finalHtml = finalHtml.replace('</body>', `<script>${jsFile}</script></body>`);
      }

      return finalHtml;
    }

    return `<!DOCTYPE html><html><body style="background:#090d16; color:#94a3b8; font-family:sans-serif; display:flex; justify-content:center; align-items:center; height:100vh; margin:0;"><div style="text-align:center;"><h2>Preview Ready</h2><p>Select HTML, React, Vue, or Angular to preview live.</p></div></body></html>`;
  };

  // Live compilation & bundle generation whenever files or language changes
  useEffect(() => {
    const bundle = generateLiveBundle();
    setIframeSrcDoc(bundle);
  }, [files, currentLanguage]);

  // Listen for console bridge messages from the iframe
  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      if (event.data && event.data.source === 'devkits-preview-frame') {
        const { type, payload } = event.data;
        if (type === 'error') {
          addStderrLog(`[Live Browser Error] ${payload}`);
        } else if (type === 'warn') {
          addTerminalLog(`[Live Browser Warning] ${payload}`);
        } else {
          addTerminalLog(`[Live Browser Log] ${payload}`);
        }
      }
    };

    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, [addTerminalLog, addStderrLog]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    const bundle = generateLiveBundle();
    setIframeSrcDoc('');
    setTimeout(() => {
      setIframeSrcDoc(bundle);
      setIsRefreshing(false);
    }, 150);
  };

  const handleOpenExternal = () => {
    const bundle = generateLiveBundle();
    const blob = new Blob([bundle], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText('http://localhost:3000/preview');
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const viewportWidths = {
    desktop: 'w-full',
    tablet: 'w-[768px] max-w-full',
    mobile: 'w-[375px] max-w-full',
  };

  return (
    <div
      className={`flex flex-col bg-slate-950 border-l border-neutral-800 text-slate-200 select-none overflow-hidden transition-all duration-200 ${
        isFullscreen ? 'fixed inset-0 z-50' : 'h-full flex-1'
      }`}
    >
      {/* Mock Browser Top Control Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-slate-800 shrink-0 gap-2">
        {/* Left Browser Actions & URL Bar */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <button
              onClick={handleRefresh}
              title="Reload live page"
              className={`p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors ${
                isRefreshing ? 'animate-spin text-indigo-400' : ''
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Browser Address Bar */}
          <div className="flex-1 flex items-center bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl px-3 py-1 text-xs text-slate-300 font-mono transition-colors group">
            <Globe className="w-3.5 h-3.5 text-emerald-400 mr-2 shrink-0" />
            <span className="text-emerald-400 font-semibold mr-1">http://</span>
            <span className="text-slate-200 truncate">localhost:3000/preview</span>
            <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full font-sans font-bold">
              <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-400" />
              LIVE
            </span>
          </div>

          <button
            onClick={handleCopyUrl}
            title="Copy local preview URL"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Viewport & External Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Responsive Viewport Switcher */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => setViewport('desktop')}
              title="Desktop View (100%)"
              className={`p-1 rounded-md transition-colors ${
                viewport === 'desktop'
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewport('tablet')}
              title="Tablet View (768px)"
              className={`p-1 rounded-md transition-colors ${
                viewport === 'tablet'
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewport('mobile')}
              title="Mobile View (375px)"
              className={`p-1 rounded-md transition-colors ${
                viewport === 'mobile'
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleOpenExternal}
            title="Open in new browser tab"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-indigo-300 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Preview'}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => {
              if (onClose) onClose();
              else toggleLivePreview(false);
            }}
            title="Close Live Preview"
            className="p-1.5 rounded-lg hover:bg-rose-950/40 hover:text-rose-400 text-slate-400 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Interactive Render Canvas */}
      <div className="flex-1 bg-neutral-950/80 p-2 flex items-center justify-center overflow-auto">
        <div
          className={`${viewportWidths[viewport]} h-full bg-slate-950 shadow-2xl rounded-xl overflow-hidden border border-neutral-800/80 transition-all duration-300 relative`}
        >
          <iframe
            ref={iframeRef}
            srcDoc={iframeSrcDoc}
            title="Live Browser Sandbox"
            sandbox="allow-scripts allow-modals allow-same-origin allow-forms allow-popups"
            className="w-full h-full border-0 bg-transparent"
          />
        </div>
      </div>
    </div>
  );
};
