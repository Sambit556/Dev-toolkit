'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function LivePreviewContent() {
  const searchParams = useSearchParams();
  const [bundleHtml, setBundleHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('Initializing Live Sandbox...');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Helper to compile project files into executable sandbox HTML
  const buildExecutableHtml = (language: string, files: Array<{ name: string; content: string }>): string => {
    const normLang = (language || '').toLowerCase();
    const indexHtml = files.find((f) => f.name === 'index.html')?.content || '';
    const styleCss = files.find((f) => f.name.endsWith('.css'))?.content || '';

    // Console bridge for developer feedback
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

    const fallbackCss = `
      * { box-sizing: border-box; }
      body { margin: 0; padding: 0; background: #020617; color: #f8fafc; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      .min-h-screen { min-height: 100vh; }
      .bg-slate-950 { background-color: #020617; }
      .bg-slate-900 { background-color: #0f172a; }
      .bg-slate-800 { background-color: #1e293b; }
      .text-slate-100 { color: #f1f5f9; }
      .text-slate-200 { color: #e2e8f0; }
      .text-slate-300 { color: #cbd5e1; }
      .text-slate-400 { color: #94a3b8; }
      .text-white { color: #ffffff; }
      .text-emerald-400 { color: #34d399; }
      .text-indigo-400 { color: #818cf8; }
      .text-rose-400 { color: #fb7185; }
      .text-orange-400 { color: #fb923c; }
      .flex { display: flex; }
      .items-center { align-items: center; }
      .justify-center { justify-content: center; }
      .justify-between { justify-content: space-between; }
      .flex-col { flex-direction: column; }
      .grid { display: grid; }
      .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .gap-2 { gap: 0.5rem; }
      .gap-2\\.5 { gap: 0.625rem; }
      .gap-3 { gap: 0.75rem; }
      .space-y-6 > * + * { margin-top: 1.5rem; }
      .space-y-4 > * + * { margin-top: 1rem; }
      .space-y-2 > * + * { margin-top: 0.5rem; }
      .space-y-1\\.5 > * + * { margin-top: 0.375rem; }
      .space-y-1 > * + * { margin-top: 0.25rem; }
      .w-full { width: 100%; }
      .max-w-md { max-width: 28rem; }
      .rounded-2xl { border-radius: 1rem; }
      .rounded-xl { border-radius: 0.75rem; }
      .rounded-lg { border-radius: 0.5rem; }
      .rounded-full { border-radius: 9999px; }
      .border { border: 1px solid #1e293b; }
      .p-6 { padding: 1.5rem; }
      .p-4 { padding: 1rem; }
      .p-2 { padding: 0.5rem; }
      .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
      .py-2\\.5 { padding-top: 0.625rem; padding-bottom: 0.625rem; }
      .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
      .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
      .font-bold { font-weight: 700; }
      .font-semibold { font-weight: 600; }
      .text-xs { font-size: 0.75rem; line-height: 1rem; }
      .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
      .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
      .text-2xl { font-size: 1.5rem; line-height: 2rem; }
      button { cursor: pointer; border: none; outline: none; font-family: inherit; font-size: inherit; }
      input { outline: none; font-family: inherit; }
      .bg-rose-600 { background-color: #e11d48 !important; }
      .bg-rose-500 { background-color: #f43f5e !important; }
      .bg-emerald-600 { background-color: #059669 !important; }
      .bg-indigo-600 { background-color: #4f46e5 !important; }
      .bg-orange-600 { background-color: #ea580c !important; }
      .from-rose-600 { --tw-gradient-from: #e11d48; }
      .to-red-600 { --tw-gradient-to: #dc2626; }
      .from-rose-500 { --tw-gradient-from: #f43f5e; }
      .to-red-500 { --tw-gradient-to: #ef4444; }
      .from-emerald-600 { --tw-gradient-from: #059669; }
      .to-teal-600 { --tw-gradient-to: #0d9488; }
      .from-indigo-600 { --tw-gradient-from: #4f46e5; }
      .to-cyan-600 { --tw-gradient-to: #0891b2; }
      .from-orange-600 { --tw-gradient-from: #ea580c; }
      .to-amber-600 { --tw-gradient-to: #d97706; }
      .bg-gradient-to-r { background-image: linear-gradient(to right, var(--tw-gradient-from, #e11d48), var(--tw-gradient-to, #dc2626)) !important; }
      .bg-gradient-to-b { background-image: linear-gradient(to bottom, var(--tw-gradient-from, #0f172a), var(--tw-gradient-to, #020617)) !important; }
      .bg-gradient-to-br { background-image: linear-gradient(to bottom right, var(--tw-gradient-from, #f43f5e), var(--tw-gradient-to, #be123c)) !important; }
      .shadow-md { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.3); }
      .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.3); }
      .shadow-rose-600\\/30 { box-shadow: 0 8px 16px rgba(225, 29, 72, 0.35) !important; }
      .shadow-emerald-600\\/30 { box-shadow: 0 8px 16px rgba(5, 150, 105, 0.35) !important; }
      .shadow-indigo-600\\/30 { box-shadow: 0 8px 16px rgba(79, 70, 229, 0.35) !important; }
      .shadow-orange-600\\/30 { box-shadow: 0 8px 16px rgba(234, 88, 12, 0.35) !important; }
      button:active { transform: scale(0.97); }
    `;

    const combinedCss = fallbackCss + '\n' + styleCss;

    // Common Self-Contained Zero-Dependency Framework Engine
    const embeddedEngineScript = `
      <script>
        // --- 1. Embedded Mini-React & ReactDOM ---
        (function() {
          let hookIndex = 0;
          let hooks = [];
          let rootEl = null;
          let RootComponent = null;

          function createElement(type, props, ...children) {
            props = props || {};
            props.children = children.flat().filter(c => c !== null && c !== undefined && c !== false);
            return { type, props };
          }

          function useState(initial) {
            const idx = hookIndex++;
            if (hooks[idx] === undefined) {
              hooks[idx] = typeof initial === 'function' ? initial() : initial;
            }
            const setState = (newVal) => {
              hooks[idx] = typeof newVal === 'function' ? newVal(hooks[idx]) : newVal;
              scheduleRender();
            };
            return [hooks[idx], setState];
          }

          function useEffect(cb, deps) {
            const idx = hookIndex++;
            const prev = hooks[idx];
            const hasChanged = !prev || !deps || deps.some((d, i) => !Object.is(d, prev[i]));
            if (hasChanged) {
              hooks[idx] = deps;
              setTimeout(cb, 0);
            }
          }

          function useRef(init) {
            const idx = hookIndex++;
            if (!hooks[idx]) hooks[idx] = { current: init };
            return hooks[idx];
          }

          function useMemo(fn, deps) {
            const idx = hookIndex++;
            const prev = hooks[idx];
            if (!prev || deps.some((d, i) => !Object.is(d, prev.deps[i]))) {
              hooks[idx] = { val: fn(), deps };
            }
            return hooks[idx].val;
          }

          function useCallback(fn, deps) {
            return useMemo(() => fn, deps);
          }

          function renderVNode(vnode) {
            if (typeof vnode === 'string' || typeof vnode === 'number') {
              return document.createTextNode(String(vnode));
            }
            if (!vnode || !vnode.type) {
              return document.createComment('');
            }
            if (typeof vnode.type === 'function') {
              return renderVNode(vnode.type(vnode.props));
            }
            const el = document.createElement(vnode.type);
            const props = vnode.props || {};
            Object.keys(props).forEach(k => {
              if (k === 'children') return;
              const v = props[k];
              if (k === 'className') el.setAttribute('class', v);
              else if (k.startsWith('on') && typeof v === 'function') {
                el.addEventListener(k.substring(2).toLowerCase(), v);
              } else if (k === 'checked') el.checked = Boolean(v);
              else if (k === 'value') el.value = v;
              else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
              else el.setAttribute(k, v);
            });
            (props.children || []).forEach(c => el.appendChild(renderVNode(c)));
            return el;
          }

          let renderTimer = null;
          function scheduleRender() {
            if (renderTimer) return;
            renderTimer = setTimeout(() => {
              renderTimer = null;
              if (rootEl && RootComponent) {
                hookIndex = 0;
                const vdom = typeof RootComponent === 'function' ? createElement(RootComponent) : RootComponent;
                rootEl.innerHTML = '';
                rootEl.appendChild(renderVNode(vdom));
              }
            }, 10);
          }

          if (!window.React) {
            window.React = { createElement, useState, useEffect, useRef, useMemo, useCallback };
          }
          if (!window.ReactDOM) {
            window.ReactDOM = {
              createRoot: (el) => {
                rootEl = el;
                return {
                  render: (comp) => {
                    RootComponent = comp.type || comp;
                    scheduleRender();
                  }
                };
              }
            };
          }
        })();

        // --- 2. Embedded Mini-Vue ---
        (function() {
          if (!window.Vue) {
            window.Vue = {
              createApp: function(options) {
                return {
                  mount: function(target) {
                    const root = typeof target === 'string' ? document.querySelector(target) : target;
                    if (!root) return;
                    const rawTemplate = root.innerHTML;
                    let state = options.data ? options.data() : {};
                    const methods = options.methods || {};

                    function render() {
                      let html = rawTemplate;
                      html = html.replace(/\\{\\{\\s*([\\s\\S]*?)\\s*\\}\\}/g, function(_, expr) {
                        try {
                          const fn = new Function(...Object.keys(state), 'return (' + expr + ');');
                          return fn(...Object.values(state));
                        } catch(e) {
                          return '';
                        }
                      });
                      root.innerHTML = html;

                      root.querySelectorAll('[v-model]').forEach(input => {
                        const key = input.getAttribute('v-model');
                        input.removeAttribute('v-model');
                        if (key && state[key] !== undefined) {
                          input.value = state[key];
                          input.oninput = (e) => {
                            state[key] = e.target.value;
                            render();
                          };
                        }
                      });

                      root.querySelectorAll('*').forEach(el => {
                        for (const attr of Array.from(el.attributes)) {
                          if (attr.name.startsWith('@') || attr.name.startsWith('v-on:')) {
                            const eventName = attr.name.replace(/^(@|v-on:)/, '');
                            const handlerName = attr.value.trim();
                            el.removeAttribute(attr.name);
                            el.addEventListener(eventName, () => {
                              if (methods[handlerName]) {
                                methods[handlerName].call(state);
                              } else {
                                try {
                                  new Function(...Object.keys(state), handlerName)(...Object.values(state));
                                } catch(e) {}
                              }
                              render();
                            });
                          }
                        }
                      });
                    }

                    render();
                  }
                };
              }
            };
          }
        })();
      </script>
    `;

    // 1. React 18 & Next.js 14
    if (normLang === 'react' || normLang === 'nextjs' || normLang === 'next') {
      const reactFile =
        files.find((f) => f.name === 'app/page.tsx' || f.name.endsWith('page.tsx'))?.content ||
        files.find((f) => f.name.endsWith('.tsx') || f.name.endsWith('.jsx'))?.content ||
        '';

      let cleanCode = reactFile
        .replace(/['"]use client['"];?/g, '')
        .replace(/import\s+.*?from\s+['"][^'"]+['"];?/g, '')
        .replace(/import\s+[^;]+;?/g, '')
        .replace(/export\s+default\s+function\s+([a-zA-Z0-9_]+)\s*\(/g, 'function $1(')
        .replace(/export\s+default\s+function\s*\(/g, 'function AnonymousComponent(')
        .replace(/export\s+default\s+([a-zA-Z0-9_]+);?/g, 'window.App = $1;')
        .replace(/export\s+/g, '');

      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${normLang.includes('next') ? 'Next.js 14' : 'React 18'} Live Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="/vendor/react.production.min.js" onerror="this.src='https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js'"></script>
  <script src="/vendor/react-dom.production.min.js" onerror="this.src='https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js'"></script>
  <script src="/vendor/babel.min.js" onerror="this.src='https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.24.0/babel.min.js'"></script>
  ${embeddedEngineScript}
  <style>${combinedCss}</style>
  ${consoleBridgeScript}
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen">
  <div id="root"></div>
  <script>
    function runReactApp(attempts = 0) {
      if (!window.Babel || !window.React || !window.ReactDOM) {
        if (attempts < 60) {
          setTimeout(() => runReactApp(attempts + 1), 30);
          return;
        }
        const rootEl = document.getElementById('root');
        if (rootEl) {
          rootEl.innerHTML = '<div style="padding:20px;color:#f87171;background:#180b12;border:1px solid #991b1b;border-radius:12px;margin:16px;font-family:monospace;font-size:13px;">Failed to load React/Babel dependencies. Please check network connectivity.</div>';
        }
        return;
      }

      try {
        const rawCode = ${JSON.stringify(cleanCode)};
        const transpiled = Babel.transform(rawCode, {
          presets: [
            ['react', { runtime: 'classic' }],
            'typescript'
          ],
          filename: 'App.tsx'
        }).code;

        const codeToRun = \`
          const { useState, useEffect, useRef, useMemo, useCallback, useContext, createContext, useReducer } = React;
          \${transpiled}
          const RootComponent = typeof App !== 'undefined' ? App : (typeof NextPage !== 'undefined' ? NextPage : (typeof Page !== 'undefined' ? Page : window.App));
          if (RootComponent) {
            const rootEl = document.getElementById('root');
            if (rootEl) {
              const root = ReactDOM.createRoot(rootEl);
              root.render(React.createElement(RootComponent));
            }
          } else {
            const rootEl = document.getElementById('root');
            if (rootEl) {
              rootEl.innerHTML = '<div style="padding:20px;color:#f87171;background:#180b12;border:1px solid #991b1b;border-radius:12px;margin:16px;font-family:monospace;font-size:13px;">No default component exported. Please define "export default function App()" or "export default function NextPage()".</div>';
            }
          }
        \`;

        const scriptEl = document.createElement('script');
        scriptEl.textContent = codeToRun;
        document.body.appendChild(scriptEl);
      } catch (err) {
        console.error('React Live Error:', err);
        const rootEl = document.getElementById('root');
        if (rootEl) {
          rootEl.innerHTML = '<div style="padding:20px; color:#f87171; background:#180b12; border:1px solid #991b1b; border-radius:12px; margin:16px; font-family:monospace; font-size:13px; line-height:1.6;"><strong style="font-size:14px;">[React / Next.js Live Error]</strong><br/>' + (err.message || String(err)) + '</div>';
        }
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => runReactApp());
    } else {
      runReactApp();
    }
  </script>
</body>
</html>`;
    }

    // 2. Vue 3
    if (normLang === 'vue') {
      const vueFile = files.find((f) => f.name.endsWith('.vue'))?.content || '';
      const templateMatch = vueFile.match(/<template>([\s\S]*?)<\/template>/);
      const scriptMatch = vueFile.match(/<script>([\s\S]*?)<\/script>/);
      const styleMatch = vueFile.match(/<style>([\s\S]*?)<\/style>/);

      const templateContent = templateMatch ? templateMatch[1] : '<div class="p-8 text-center text-white"><h1>Vue 3 App Ready</h1></div>';
      const scriptContent = scriptMatch ? scriptMatch[1].replace(/export\s+default\s+/, 'const ComponentOptions = ') : 'const ComponentOptions = {};';

      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vue 3 Live Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
  ${embeddedEngineScript}
  <style>
    ${combinedCss}
    ${styleMatch ? styleMatch[1] : ''}
  </style>
  ${consoleBridgeScript}
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen">
  <div id="app">
    ${templateContent}
  </div>
  <script>
    function renderVue() {
      try {
        ${scriptContent}
        const app = Vue.createApp(typeof ComponentOptions !== 'undefined' ? ComponentOptions : {});
        app.mount('#app');
      } catch(err) {
        document.getElementById('app').innerHTML = '<div style="padding:24px;color:#f87171;font-family:monospace;"><b>Vue 3 Error:</b><br/>' + err.message + '</div>';
        console.error(err);
      }
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', renderVue);
    } else {
      renderVue();
    }
  </script>
</body>
</html>`;
    }

    // 3. Angular Standalone / PHP / Laravel Blade
    if (normLang === 'angular' || normLang === 'php') {
      if (indexHtml) {
        return indexHtml.includes('<!DOCTYPE')
          ? indexHtml.replace('</head>', `<style>${combinedCss}</style>${consoleBridgeScript}</head>`)
          : `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script><style>${combinedCss}</style>${consoleBridgeScript}</head><body>${indexHtml}</body></html>`;
      }
    }

    // 4. Svelte (Native Dedicated Engine)
    if (normLang === 'svelte') {
      const svelteFile = files.find((f) => f.name.endsWith('.svelte'))?.content || '';

      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Svelte Live Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>${combinedCss}</style>
  ${consoleBridgeScript}
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen">
  <div id="svelte-root"></div>
  <script>
    (function() {
      try {
        const rawCode = ${JSON.stringify(svelteFile)};
        const scriptMatch = rawCode.match(/<script>([\\s\\S]*?)<\\/script>/);
        const styleMatch = rawCode.match(/<style>([\\s\\S]*?)<\\/style>/);
        let template = rawCode.replace(/<script>[\\s\\S]*?<\\/script>/, '').replace(/<style>[\\s\\S]*?<\\/style>/, '');

        if (styleMatch) {
          const styleEl = document.createElement('style');
          styleEl.textContent = styleMatch[1];
          document.head.appendChild(styleEl);
        }

        const scriptCode = scriptMatch ? scriptMatch[1] : '';

        // Extract variables for reactive Proxy
        const rawState = {};
        const varMatches = [...scriptCode.matchAll(/(?:let|var)\\s+([a-zA-Z0-9_$]+)\\s*=\\s*([^;]+);/g)];
        for (const m of varMatches) {
          const varName = m[1];
          const valStr = m[2].trim();
          try {
            rawState[varName] = new Function('return (' + valStr + ');')();
          } catch {
            rawState[varName] = valStr.replace(/^['"]|['"]$/g, '');
          }
        }

        let renderPending = false;
        function scheduleUpdate() {
          if (renderPending) return;
          renderPending = true;
          requestAnimationFrame(() => {
            renderPending = false;
            renderDOM();
          });
        }

        const state = new Proxy(rawState, {
          get(target, prop) {
            return target[prop];
          },
          set(target, prop, val) {
            target[prop] = val;
            scheduleUpdate();
            return true;
          }
        });

        // Extract functions in scope
        const functions = {};
        const funcMatches = [...scriptCode.matchAll(/function\\s+([a-zA-Z0-9_$]+)\\s*\\((.*?)\\)\\s*\\{([\\s\\S]*?)\\}/g)];
        for (const m of funcMatches) {
          const funcName = m[1];
          const params = m[2];
          const body = m[3];
          functions[funcName] = new Function('state', ...params.split(',').filter(Boolean), \`
            with (state) {
              \${body}
            }
          \`);
        }

        const rootEl = document.getElementById('svelte-root');

        function renderDOM() {
          let html = template;

          // Preserve attribute directives during variable interpolation
          const tokenMap = {};
          let tokenIdx = 0;
          html = html.replace(/(bind:[a-zA-Z0-9_$]+|on:[a-zA-Z0-9_$]+)=\\{([^}]+)\\}/g, function(full, attr, val) {
            const id = '__SVELTE_ATTR_' + (tokenIdx++) + '__';
            tokenMap[id] = { attr, val };
            return id;
          });

          // Interpolate {expr}
          html = html.replace(/\\{([^{}]+)\\}/g, function(_, expr) {
            try {
              const val = new Function('state', 'with(state) { return (' + expr + '); }')(state);
              return val !== undefined && val !== null ? String(val) : '';
            } catch(e) {
              return '';
            }
          });

          // Restore attribute directives
          Object.keys(tokenMap).forEach(id => {
            const { attr, val } = tokenMap[id];
            html = html.replace(id, attr + '="' + val + '"');
          });

          // Track focused input element
          const activeEl = document.activeElement;
          const activeBind = activeEl ? activeEl.getAttribute('data-svelte-bind') : null;
          const selStart = activeEl && 'selectionStart' in activeEl ? activeEl.selectionStart : null;
          const selEnd = activeEl && 'selectionEnd' in activeEl ? activeEl.selectionEnd : null;

          rootEl.innerHTML = html;

          // Attach two-way bindings and event handlers
          rootEl.querySelectorAll('*').forEach(el => {
            for (const a of Array.from(el.attributes)) {
              if (a.name === 'bind:value') {
                const varName = a.value.trim();
                el.setAttribute('data-svelte-bind', varName);
                if (state[varName] !== undefined) {
                  el.value = state[varName];
                }
                el.oninput = (e) => {
                  state[varName] = e.target.value;
                };
              } else if (a.name.startsWith('on:')) {
                const eventName = a.name.slice(3);
                const handlerName = a.value.trim();
                el.addEventListener(eventName, (e) => {
                  if (functions[handlerName]) {
                    functions[handlerName](state, e);
                  } else {
                    try {
                      new Function('state', '$event', 'with(state) { ' + handlerName + '; }')(state, e);
                    } catch(err) {
                      console.error('Svelte handler error:', err);
                    }
                  }
                });
              }
            }
          });

          if (activeBind) {
            const reFound = rootEl.querySelector('[data-svelte-bind="' + activeBind + '"]');
            if (reFound) {
              reFound.focus();
              if (selStart !== null && selEnd !== null) {
                try { reFound.setSelectionRange(selStart, selEnd); } catch(e) {}
              }
            }
          }
        }

        renderDOM();
      } catch (err) {
        console.error('Svelte Live Error:', err);
        const rootEl = document.getElementById('svelte-root');
        if (rootEl) {
          rootEl.innerHTML = '<div style="padding:20px; color:#f87171; font-family:monospace;"><b>Svelte Live Error:</b><br/>' + err.message + '</div>';
        }
      }
    })();
  </script>
</body>
</html>`;
    }

    // 5. HTML5 / CSS / Vanilla JS
    if (indexHtml) {
      let finalHtml = indexHtml;
      const jsFile = files.find((f) => f.name.endsWith('.js') && f.name !== 'index.html')?.content || '';

      if (!finalHtml.includes('</head>')) {
        finalHtml = `<!DOCTYPE html><html><head><style>${combinedCss}</style>${consoleBridgeScript}</head><body>${finalHtml}</body></html>`;
      } else {
        finalHtml = finalHtml.replace('</head>', `<style>${combinedCss}</style>${consoleBridgeScript}</head>`);
      }

      if (jsFile && !finalHtml.includes(jsFile)) {
        finalHtml = finalHtml.replace('</body>', `<script>${jsFile}</script></body>`);
      }

      return finalHtml;
    }

    return `<!DOCTYPE html><html><body style="background:#090d16;color:#94a3b8;font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;"><div style="text-align:center;"><h2>Preview Ready</h2><p>Live sandbox loaded successfully.</p></div></body></html>`;
  };

  // Synchronize state from URL, BroadcastChannel, or LocalStorage
  useEffect(() => {
    const loadState = () => {
      // 1. Check if URL contains query data parameter
      const snapshotParam = searchParams.get('data') || searchParams.get('snapshot') || searchParams.get('state');
      if (snapshotParam) {
        try {
          const decoded = JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(snapshotParam)))));
          if (decoded && decoded.files) {
            const html = buildExecutableHtml(decoded.language || 'html', decoded.files);
            setBundleHtml(html);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn('Could not parse snapshot parameter:', e);
        }
      }

      // 2. Check local preview bundle in localStorage
      try {
        const localBundle = localStorage.getItem('devkits_live_preview_bundle');
        if (localBundle) {
          setBundleHtml(localBundle);
          setLoading(false);
          return;
        }

        const ideStorage = localStorage.getItem('devkits_cloud_ide_storage');
        if (ideStorage) {
          const parsed = JSON.parse(ideStorage);
          const state = parsed.state || parsed;
          if (state && state.files && state.files.length > 0) {
            const html = buildExecutableHtml(state.currentLanguage || 'react', state.files);
            setBundleHtml(html);
            setLoading(false);
            return;
          }
        }
      } catch (e) {}

      // Default fallback
      setBundleHtml(
        buildExecutableHtml('html', [
          {
            name: 'index.html',
            content: `<!DOCTYPE html><html><body style="background:#090d16;color:#f8fafc;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;"><div style="text-align:center;padding:32px;background:#131b2e;border:1px solid #1e293b;border-radius:16px;box-shadow:0 20px 40px rgba(0,0,0,0.5);"><h1>⚡ DevKits Live Preview</h1><p style="color:#94a3b8;">Start the Cloud IDE to see your live application render here.</p></div></body></html>`,
          },
        ]),
      );
      setLoading(false);
    };

    loadState();

    // 3. Listen for BroadcastChannel updates from Cloud IDE in real-time
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('devkits_live_preview');
      channel.onmessage = (event) => {
        if (event.data) {
          const { language, files, html } = event.data;
          if (html) {
            setBundleHtml(html);
          } else if (files) {
            setBundleHtml(buildExecutableHtml(language, files));
          }
          setLoading(false);
        }
      };
    } catch (e) {}

    // 4. Listen for postMessage from parent window if embedded in iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'devkits_preview_update') {
        const { language, files, html } = event.data;
        if (html) setBundleHtml(html);
        else if (files) setBundleHtml(buildExecutableHtml(language, files));
        setLoading(false);
      }
    };
    window.addEventListener('message', handleMessage);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('message', handleMessage);
    };
  }, [searchParams]);

  return (
    <div className="w-screen h-screen m-0 p-0 overflow-hidden bg-black flex flex-col">
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 text-slate-300">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-mono text-slate-400">{statusMessage}</p>
        </div>
      ) : (
        <iframe
          ref={iframeRef}
          srcDoc={bundleHtml}
          title="DevKits Live Preview Web App"
          sandbox="allow-scripts allow-modals allow-same-origin allow-forms allow-popups"
          className="w-full h-full border-0 bg-transparent"
        />
      )}
    </div>
  );
}

export default function LivePreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="w-screen h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono text-xs">
          Loading Live Sandbox...
        </div>
      }
    >
      <LivePreviewContent />
    </Suspense>
  );
}
