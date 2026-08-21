'use client';

import React, { useRef, useEffect, useState } from 'react';
import {
  Terminal as TermIcon,
  Activity,
  Cpu,
  HardDrive,
  Clock,
  Trash2,
  Send,
  Sparkles,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ChevronDown,
  Copy,
  Check,
  PanelBottom,
  PanelRight,
  X,
} from 'lucide-react';
import { useCloudIdeStore, BottomPanelTab } from '../../store/useCloudIdeStore';
import { ErrorDiagnosticsBanner } from './ErrorDiagnosticsBanner';

export const TerminalPanel: React.FC = () => {
  const {
    activeBottomTab,
    setActiveBottomTab,
    terminalLogs,
    stderrLogs,
    clearTerminal,
    metrics,
    stdinInput,
    setStdinInput,
    runCode,
    diagnostics,
    toggleBottomPanel,
    terminalPosition,
    setTerminalPosition,
    toggleTerminalPosition,
  } = useCloudIdeStore();

  const [copied, setCopied] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleCopyLogs = () => {
    const allLogs = [...terminalLogs, ...stderrLogs].join('\n');
    if (!allLogs) return;
    navigator.clipboard.writeText(allLogs);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [terminalLogs, stderrLogs]);

  const tabs: Array<{ id: BottomPanelTab; label: string; icon: React.ElementType; badge?: string | number }> = [
    { id: 'terminal', label: 'Terminal / Logs', icon: TermIcon },
    { id: 'output', label: 'Raw Output', icon: Activity },
    { id: 'metrics', label: 'Sandbox Telemetry', icon: Cpu },
  ];

  return (
    <div className="flex flex-col h-full w-full bg-black border-t border-neutral-800 text-slate-200 select-none text-xs">
      {/* Top Tab Bar & Execution Metrics Summary */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-black border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeBottomTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveBottomTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-indigo-300 font-semibold border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Live Performance / Status Gauges */}
        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          {metrics.status === 'running' ? (
            <span className="flex items-center gap-1 text-amber-400 animate-pulse font-medium">
              <Activity className="w-3.5 h-3.5 animate-spin" />
              Executing in Sandbox...
            </span>
          ) : metrics.status === 'success' ? (
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Exit Code: 0 (OK)
            </span>
          ) : metrics.status === 'error' ? (
            <span className="flex items-center gap-1 text-rose-400 font-medium">
              <XCircle className="w-3.5 h-3.5" />
              Exit Code: {metrics.exitCode} (Failed)
            </span>
          ) : null}

          {metrics.executionTimeMs > 0 && (
            <span className="hidden sm:flex items-center gap-1 text-slate-300">
              <Clock className="w-3 h-3 text-indigo-400" />
              {metrics.executionTimeMs}ms
            </span>
          )}

          {metrics.memoryUsageMb > 0 && (
            <span className="hidden md:flex items-center gap-1 text-slate-300">
              <HardDrive className="w-3 h-3 text-cyan-400" />
              {metrics.memoryUsageMb} MB RAM
            </span>
          )}

          {/* Dock Position Toggle */}
          <button
            onClick={() => setTerminalPosition(terminalPosition === 'bottom' ? 'right' : 'bottom')}
            title={terminalPosition === 'bottom' ? 'Move Terminal to Right Side' : 'Move Terminal to Bottom'}
            className="p-1 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors text-slate-400 flex items-center gap-1 text-[11px]"
          >
            {terminalPosition === 'bottom' ? (
              <PanelRight className="w-3.5 h-3.5 text-indigo-400" />
            ) : (
              <PanelBottom className="w-3.5 h-3.5 text-indigo-400" />
            )}
            <span className="hidden sm:inline text-[10px]">{terminalPosition === 'bottom' ? 'Dock Right' : 'Dock Bottom'}</span>
          </button>

          <button
            onClick={handleCopyLogs}
            title={copied ? 'Copied to Clipboard!' : 'Copy Terminal Logs'}
            className="p-1 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors text-slate-400 flex items-center gap-1 text-[11px]"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={clearTerminal}
            title="Clear Console Output"
            className="p-1 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors text-slate-400"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => toggleBottomPanel(false)}
            title="Close Panel"
            className="p-1 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors text-slate-400"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Error Diagnostics Banner (if execution failed) */}
      <ErrorDiagnosticsBanner />

      {/* Content Area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto font-mono p-3 space-y-1.5 selection:bg-indigo-500/30">
        {activeBottomTab === 'terminal' && (
          <div className="space-y-1 text-[12px] leading-relaxed">
            {terminalLogs.length === 0 ? (
              <div className="text-neutral-500 text-xs py-2 flex items-center gap-2 font-sans">
                <TermIcon className="w-4 h-4 text-neutral-600" />
                <span>Sandbox console ready. Click <strong>Run</strong> or press <strong>Ctrl+Enter</strong> to execute.</span>
              </div>
            ) : (
              terminalLogs.map((log, index) => {
                if (log.startsWith('─── [Execution #')) {
                  return (
                    <div
                      key={index}
                      className="my-2 py-1 px-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-xs font-bold flex items-center justify-between font-sans shadow-sm"
                    >
                      <span className="flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-indigo-400" />
                        {log.replace(/───/g, '').trim()}
                      </span>
                    </div>
                  );
                }

                if (log.startsWith('[PASS] [Execution #') || log.startsWith('✔ [Execution #')) {
                  return (
                    <div
                      key={index}
                      className="my-1 py-0.5 px-2 rounded bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-[11px] font-semibold flex items-center gap-1.5 font-sans"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{log}</span>
                    </div>
                  );
                }

                if (log.startsWith('[FAIL] [Execution #') || log.startsWith('✖ [Execution #')) {
                  return (
                    <div
                      key={index}
                      className="my-1 py-0.5 px-2 rounded bg-rose-950/30 border border-rose-800/40 text-rose-300 text-[11px] font-semibold flex items-center gap-1.5 font-sans"
                    >
                      <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>{log}</span>
                    </div>
                  );
                }

                if (log.startsWith('[STDERR]') || log.startsWith('[ERROR]')) {
                  return (
                    <div key={index} className="text-rose-400 font-mono whitespace-pre-wrap pl-2 border-l-2 border-rose-500/50 my-0.5">
                      {log}
                    </div>
                  );
                }

                if (!log.trim()) {
                  return <div key={index} className="h-1" />;
                }

                return (
                  <div key={index} className="text-slate-100 whitespace-pre-wrap leading-relaxed">
                    {log}
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeBottomTab === 'output' && (
          <div className="space-y-1">
            {terminalLogs.length === 0 ? (
              <div className="text-neutral-500 text-xs py-2 font-sans">
                No raw output recorded yet. Click Run to execute code in sandbox.
              </div>
            ) : (
              <pre className="text-[12px] text-emerald-300/90 whitespace-pre-wrap font-mono leading-relaxed select-text">
                {terminalLogs.join('\n')}
              </pre>
            )}
          </div>
        )}

        {activeBottomTab === 'metrics' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-2 font-sans">
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <div className="flex items-center gap-2 text-indigo-400 mb-1">
                <Clock className="w-4 h-4" />
                <span className="font-semibold text-xs">Execution Latency</span>
              </div>
              <div className="text-xl font-bold text-slate-100">{metrics.executionTimeMs} ms</div>
              <div className="text-[11px] text-slate-400 mt-1">Warm sandbox startup: ~12ms</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <div className="flex items-center gap-2 text-cyan-400 mb-1">
                <HardDrive className="w-4 h-4" />
                <span className="font-semibold text-xs">RAM Consumption</span>
              </div>
              <div className="text-xl font-bold text-slate-100">{metrics.memoryUsageMb} / 256 MB</div>
              <div className="text-[11px] text-slate-400 mt-1">Isolation ceiling: 256 MB hard cap</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <div className="flex items-center gap-2 text-emerald-400 mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span className="font-semibold text-xs">Security & Sandbox Status</span>
              </div>
              <div className="text-xl font-bold text-emerald-400">ISOLATED</div>
              <div className="text-[11px] text-slate-400 mt-1">
                {metrics.provider ? `Engine: ${metrics.provider}` : 'Upstash Box VM Engine'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Stdin Input Bar */}
      <div className={`p-2 border-t transition-all flex items-center gap-2 shrink-0 ${
        metrics.status === 'running'
          ? 'bg-indigo-950/40 border-indigo-500/50'
          : 'bg-neutral-950 border-neutral-800'
      }`}>
        <span className="text-amber-400 font-bold text-xs pl-1 font-mono flex items-center gap-1">
          <TermIcon className="w-3.5 h-3.5 text-amber-400" />
          stdin &gt;
        </span>
        <input
          type="text"
          placeholder="Provide terminal input / interactive payload (press Enter to feed & run)..."
          value={stdinInput}
          onChange={(e) => setStdinInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              runCode();
            }
          }}
          disabled={metrics.status === 'running'}
          className={`flex-1 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-neutral-500 font-mono transition-all focus:outline-none ${
            stdinInput
              ? 'bg-neutral-900 border-2 border-amber-500/90 ring-2 ring-amber-500/30'
              : 'bg-neutral-900 border border-neutral-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40'
          }`}
        />
        <button
          onClick={runCode}
          disabled={metrics.status === 'running'}
          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-sm text-xs"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Feed & Run</span>
        </button>
      </div>
    </div>
  );
};
