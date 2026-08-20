'use client';

import React, { useRef, useEffect } from 'react';
import {
  Terminal as TermIcon,
  AlertCircle,
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
  } = useCloudIdeStore();

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [terminalLogs, stderrLogs]);

  const tabs: Array<{ id: BottomPanelTab; label: string; icon: React.ElementType; badge?: string | number }> = [
    { id: 'terminal', label: 'Terminal / Logs', icon: TermIcon },
    { id: 'output', label: 'Raw Output', icon: Activity },
    { id: 'problems', label: 'Problems & Lint', icon: AlertCircle, badge: diagnostics.hasError ? '1' : undefined },
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

          <button
            onClick={clearTerminal}
            title="Clear Console Output"
            className="p-1 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors text-slate-400"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => toggleBottomPanel(false)}
            title="Minimize Panel"
            className="p-1 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors text-slate-400"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Error Diagnostics Banner (if execution failed) */}
      <ErrorDiagnosticsBanner />

      {/* Content Area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto font-mono p-3 space-y-1">
        {activeBottomTab === 'terminal' && (
          <div className="space-y-1 text-[12px] leading-relaxed">
            {terminalLogs.length === 0 && stderrLogs.length === 0 && (
              <div className="text-neutral-500 text-xs py-1">
                Terminal ready. Click Run or press Ctrl+Enter to execute.
              </div>
            )}
            {terminalLogs.map((log, index) => (
              <div key={index} className="text-slate-300 whitespace-pre-wrap">
                {log}
              </div>
            ))}
            {stderrLogs.map((err, index) => (
              <div key={index} className="text-rose-400 bg-rose-950/20 p-2 rounded border-l-2 border-rose-500 whitespace-pre-wrap">
                {err}
              </div>
            ))}
          </div>
        )}

        {activeBottomTab === 'output' && (
          <div className="text-[12px] text-emerald-400 whitespace-pre-wrap">
            {terminalLogs.join('\n') || 'No output recorded yet. Click Run to execute.'}
          </div>
        )}

        {activeBottomTab === 'problems' && (
          <div className="space-y-2">
            {diagnostics.hasError ? (
              <div className="p-3 bg-rose-950/30 border border-rose-800/40 rounded-xl space-y-1">
                <div className="flex items-center gap-2 text-rose-400 font-bold">
                  <AlertCircle className="w-4 h-4" />
                  <span>{diagnostics.errorType || 'Runtime Error'} in {diagnostics.failingFile} (Line {diagnostics.failingLine})</span>
                </div>
                <p className="text-slate-300">{diagnostics.errorMessage}</p>
                <div className="pt-2 text-indigo-300 text-xs font-sans">
                  <strong>Recommended Fix:</strong> {diagnostics.suggestedFix}
                </div>
              </div>
            ) : (
              <div className="text-slate-400 text-center py-6">
                No lint problems or runtime errors detected in workspace.
              </div>
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
      <div className="p-2 bg-slate-950 border-t border-slate-800/80 flex items-center gap-2 shrink-0">
        <span className="text-indigo-400 font-bold text-xs pl-1">stdin &gt;</span>
        <input
          type="text"
          placeholder="Provide interactive stdin / custom test input (e.g. 42 or json payload)..."
          value={stdinInput}
          onChange={(e) => setStdinInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') runCode();
          }}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
        />
        <button
          onClick={runCode}
          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold flex items-center gap-1 transition-colors shrink-0"
        >
          <Send className="w-3 h-3" />
          <span>Feed & Run</span>
        </button>
      </div>
    </div>
  );
};
