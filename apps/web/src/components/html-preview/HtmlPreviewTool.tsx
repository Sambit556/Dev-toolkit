'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Eye, Code, Terminal, Play, RotateCcw, Copy, Layout, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CodeEditor } from '@/components/ui/CodeEditor';
import { toast } from 'sonner';

interface LogEntry {
  type: 'log' | 'error' | 'info';
  val: string;
  timestamp: string;
}

const TEMPLATES = {
  counter: {
    html: `<div class="counter-container">\n  <h2>Simple Click Counter</h2>\n  <div id="count">0</div>\n  <div class="btn-group">\n    <button id="btn-dec" class="btn">- Decrease</button>\n    <button id="btn-inc" class="btn">+ Increase</button>\n  </div>\n</div>`,
    css: `body {\n  font-family: 'Outfit', -apple-system, sans-serif;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  height: 100vh;\n  margin: 0;\n  background: linear-gradient(135deg, #1e293b, #0f172a);\n  color: white;\n}\n\n.counter-container {\n  text-align: center;\n  padding: 2rem;\n  border-radius: 1rem;\n  background: rgba(255, 255, 255, 0.05);\n  backdrop-filter: blur(10px);\n  border: 1px border rgba(255, 255, 255, 0.1);\n  box-shadow: 0 10px 30px rgba(0,0,0,0.5);\n}\n\n#count {\n  font-size: 4rem;\n  font-weight: 800;\n  margin: 1.5rem 0;\n  color: #3b82f6;\n}\n\n.btn {\n  border: none;\n  padding: 0.75rem 1.5rem;\n  margin: 0 0.5rem;\n  border-radius: 0.5rem;\n  cursor: pointer;\n  font-weight: 600;\n  transition: all 0.2s;\n}\n\n#btn-dec {\n  background: #ef4444;\n  color: white;\n}\n#btn-inc {\n  background: #10b981;\n  color: white;\n}\n\n.btn:hover {\n  opacity: 0.9;\n  transform: translateY(-2px);\n}`,
    js: `// Click counter logic\nconst countDiv = document.getElementById('count');\nconst decBtn = document.getElementById('btn-dec');\nconst incBtn = document.getElementById('btn-inc');\n\nlet count = 0;\nconsole.log('App loaded! Initial count:', count);\n\ndecBtn.addEventListener('click', () => {\n  count--;\n  countDiv.innerText = count;\n  console.log('Count decreased to:', count);\n});\n\nincBtn.addEventListener('click', () => {\n  count++;\n  countDiv.innerText = count;\n  console.log('Count increased to:', count);\n});`
  },
  clock: {
    html: `<div class="clock-card">\n  <h2>Digital Clock</h2>\n  <div id="clock">00:00:00</div>\n  <div id="date">Loading...</div>\n</div>`,
    css: `body {\n  font-family: monospace;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  height: 100vh;\n  margin: 0;\n  background: #020617;\n  color: #10b981;\n}\n\n.clock-card {\n  text-align: center;\n  border: 2px solid #10b981;\n  padding: 3rem;\n  border-radius: 1.5rem;\n  box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);\n}\n\n#clock {\n  font-size: 3.5rem;\n  font-weight: 900;\n  letter-spacing: 2px;\n  text-shadow: 0 0 10px rgba(16, 185, 129, 0.4);\n}\n\n#date {\n  margin-top: 1rem;\n  color: #64748b;\n  font-size: 0.9rem;\n}`,
    js: `// Digital clock renderer\nfunction updateClock() {\n  const now = new Date();\n  const timeStr = now.toTimeString().split(' ')[0];\n  const dateStr = now.toDateString();\n  \n  document.getElementById('clock').innerText = timeStr;\n  document.getElementById('date').innerText = dateStr;\n}\n\nconsole.log('Clock runner initialized');\nsetInterval(updateClock, 1000);\nupdateClock();`
  },
  blank: {
    html: `<!-- Write HTML structure here -->\n<div class="app">\n  <h1>HTML / CSS / JS Sandbox</h1>\n  <p>Write your front-end code and check output live!</p>\n</div>`,
    css: `/* Write CSS stylesheet here */\nbody {\n  font-family: sans-serif;\n  padding: 2rem;\n  background: #f8fafc;\n  color: #0f172a;\n}`,
    js: `// Write JavaScript logic here\nconsole.log('Code sandboxed successfully!');`
  }
};

export function HtmlPreviewTool() {
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html');
  const [htmlCode, setHtmlCode] = useState(TEMPLATES.counter.html);
  const [cssCode, setCssCode] = useState(TEMPLATES.counter.css);
  const [jsCode, setJsCode] = useState(TEMPLATES.counter.js);

  const [srcDoc, setSrcDoc] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<string>('counter');
  
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Compile combined document
  const compileSandbox = () => {
    // Inject scripts to intercept console actions and send logs to the host page
    const runString = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>${cssCode}</style>
          <script>
            (function() {
              const interceptLog = (type) => {
                const original = console[type];
                console[type] = function(...args) {
                  const val = args.map(arg => {
                    if (typeof arg === 'object') {
                      try { return JSON.stringify(arg); } catch (e) { return '[Object]'; }
                    }
                    return String(arg);
                  }).join(' ');
                  window.parent.postMessage({ type: 'CONSOLE_LOG', logType: type, val }, '*');
                  original.apply(console, args);
                };
              };
              interceptLog('log');
              interceptLog('error');
              interceptLog('info');

              window.addEventListener('error', (e) => {
                window.parent.postMessage({ type: 'CONSOLE_LOG', logType: 'error', val: e.message }, '*');
              });
            })();
          </script>
        </head>
        <body>
          ${htmlCode}
          <script>${jsCode}</script>
        </body>
      </html>
    `;
    setSrcDoc(runString);
  };

  // Run initial compile
  useEffect(() => {
    compileSandbox();
  }, []);

  // Listen to message events from iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'CONSOLE_LOG') {
        const time = new Date().toTimeString().split(' ')[0];
        setLogs((prev) => [
          ...prev,
          {
            type: e.data.logType,
            val: e.data.val,
            timestamp: time,
          },
        ].slice(-50)); // limit to 50 logs
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleTemplateChange = (val: string) => {
    setActiveTemplate(val);
    const tmpl = TEMPLATES[val as keyof typeof TEMPLATES];
    if (tmpl) {
      setHtmlCode(tmpl.html);
      setCssCode(tmpl.css);
      setJsCode(tmpl.js);
      setLogs([]);
      
      // Auto-compile new template immediately so preview shows it
      const runString = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>${tmpl.css}</style>
            <script>
              (function() {
                const interceptLog = (type) => {
                  const original = console[type];
                  console[type] = function(...args) {
                    const val = args.map(arg => {
                      if (typeof arg === 'object') {
                        try { return JSON.stringify(arg); } catch (e) { return '[Object]'; }
                      }
                      return String(arg);
                    }).join(' ');
                    window.parent.postMessage({ type: 'CONSOLE_LOG', logType: type, val }, '*');
                    original.apply(console, args);
                  };
                };
                interceptLog('log');
                interceptLog('error');
                interceptLog('info');

                window.addEventListener('error', (e) => {
                  window.parent.postMessage({ type: 'CONSOLE_LOG', logType: 'error', val: e.message }, '*');
                });
              })();
            </script>
          </head>
          <body>
            ${tmpl.html}
            <script>${tmpl.js}</script>
          </body>
        </html>
      `;
      setSrcDoc(runString);
      toast.success(`Loaded template: ${val}`);
    }
  };

  const handleClearLogs = () => {
    setLogs([]);
    toast.success('Console logs cleared');
  };

  const handleResetCode = () => {
    handleTemplateChange(activeTemplate);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Editor Panel */}
      <div className="flex flex-col space-y-4">
        <Card className="border bg-card/60 backdrop-blur-sm shadow-sm">
          <CardContent className="p-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-bold">Template:</span>
              <Select value={activeTemplate} onValueChange={handleTemplateChange}>
                <SelectTrigger className="h-8 w-44 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="counter">Interactive Counter App</SelectItem>
                  <SelectItem value="clock">Live Digital Clock</SelectItem>
                  <SelectItem value="blank">Blank Sandbox Template</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleResetCode} className="h-8 gap-1.5 text-xs text-red-500 hover:bg-red-500/10">
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
              <Button size="sm" onClick={compileSandbox} className="h-8 gap-1.5 text-xs font-bold">
                <Play className="h-3.5 w-3.5 fill-current" />
                Run Code
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Code Tabs wrapper */}
        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="flex-1 flex flex-col border rounded-xl shadow-md overflow-hidden bg-card">
          <TabsList className="grid grid-cols-3 rounded-none border-b h-10 p-0 bg-muted/20">
            <TabsTrigger value="html" className="gap-1.5 text-xs rounded-none border-r data-[state=active]:border-b-2 data-[state=active]:border-primary">
              <Code className="h-3.5 w-3.5" /> HTML
            </TabsTrigger>
            <TabsTrigger value="css" className="gap-1.5 text-xs rounded-none border-r data-[state=active]:border-b-2 data-[state=active]:border-primary">
              <Layout className="h-3.5 w-3.5" /> CSS
            </TabsTrigger>
            <TabsTrigger value="js" className="gap-1.5 text-xs rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
              <Terminal className="h-3.5 w-3.5" /> JavaScript
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-[360px] h-[360px]">
            <TabsContent value="html" className="m-0 h-full">
              <CodeEditor
                value={htmlCode}
                onChange={setHtmlCode}
                language="html"
                height="100%"
                className="border-none rounded-none"
              />
            </TabsContent>
            <TabsContent value="css" className="m-0 h-full">
              <CodeEditor
                value={cssCode}
                onChange={setCssCode}
                language="css"
                height="100%"
                className="border-none rounded-none"
              />
            </TabsContent>
            <TabsContent value="js" className="m-0 h-full">
              <CodeEditor
                value={jsCode}
                onChange={setJsCode}
                language="javascript"
                height="100%"
                className="border-none rounded-none"
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Preview Output Panel */}
      <div className="flex flex-col space-y-4">
        {/* Output Browser Frame */}
        <Card className="border shadow-lg overflow-hidden flex flex-col bg-white">
          <div className="bg-slate-100 dark:bg-slate-900 border-b px-4 py-2 flex items-center justify-between text-slate-500 font-mono text-[10px] select-none h-9">
            <span className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" /> Sandbox Browser Frame Output
            </span>
            <div className="flex gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
            </div>
          </div>

          <div className="h-[280px] bg-white relative">
            {srcDoc ? (
              <iframe
                ref={iframeRef}
                title="Code Sandbox Sandbox"
                srcDoc={srcDoc}
                sandbox="allow-scripts"
                className="w-full h-full border-none"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground/50 italic bg-slate-50/20">
                Click Run to render preview
              </div>
            )}
          </div>
        </Card>

        {/* Live Console Output Log */}
        <Card className="border shadow-md overflow-hidden bg-slate-950 text-slate-100 flex flex-col h-[135px]">
          <div className="bg-slate-900 px-3 py-1.5 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center border-b border-slate-800 select-none">
            <span className="flex items-center gap-1">
              <Terminal className="h-3.5 w-3.5 text-primary" /> Live Console Logs
            </span>
            {logs.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClearLogs} className="text-red-400 hover:text-red-500 h-5 px-1.5 text-[9px] hover:bg-slate-800">
                Clear
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-2 font-mono text-[10px] space-y-1 select-text">
            {logs.length > 0 ? (
              logs.map((log, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2 items-start py-0.5 border-b border-slate-900 last:border-b-0 ${
                    log.type === 'error' ? 'text-red-400' : log.type === 'info' ? 'text-sky-400' : 'text-slate-100'
                  }`}
                >
                  <span className="text-slate-500 shrink-0 select-none">[{log.timestamp}]</span>
                  <span className="break-all font-semibold whitespace-pre-wrap">{log.val}</span>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-slate-600 italic select-none">
                No logs generated by console
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
