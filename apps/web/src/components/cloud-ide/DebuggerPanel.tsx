'use client';

import React, { useState } from 'react';
import {
  Bug,
  Play,
  Square,
  StepForward,
  CornerDownRight,
  Plus,
  Trash2,
  List,
  Eye,
  Layers,
  CheckCircle,
} from 'lucide-react';
import { useCloudIdeStore } from '../../store/useCloudIdeStore';

export const DebuggerPanel: React.FC = () => {
  const {
    breakpoints,
    toggleBreakpoint,
    isDebugging,
    currentDebugLine,
    callStack,
    debugVariables,
    watchList,
    addWatchExpression,
    removeWatchExpression,
    startDebugger,
    stopDebugger,
    stepOver,
    stepInto,
    continueExecution,
    activeFile,
  } = useCloudIdeStore();

  const [newWatchInput, setNewWatchInput] = useState('');

  const handleAddWatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWatchInput.trim()) {
      addWatchExpression(newWatchInput.trim());
      setNewWatchInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60 text-slate-200 select-none text-sm p-3">
      {/* Header & Controls */}
      <div className="border-b border-slate-800/80 pb-2 mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-600/20 text-rose-400 border border-rose-500/30">
              <Bug className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-white">Debug & Runtime Inspector</h3>
              <p className="text-[10px] text-slate-400">Step execution & live memory scope</p>
            </div>
          </div>
        </div>

        {/* Debug Action Bar */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
          {!isDebugging ? (
            <button
              onClick={startDebugger}
              className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Debugger</span>
            </button>
          ) : (
            <>
              <button
                onClick={continueExecution}
                title="Continue Execution"
                className="p-1.5 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 rounded-lg transition-colors"
              >
                <Play className="w-4 h-4 fill-current" />
              </button>
              <button
                onClick={stepOver}
                title="Step Over"
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
              >
                <StepForward className="w-4 h-4" />
              </button>
              <button
                onClick={stepInto}
                title="Step Into"
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
              >
                <CornerDownRight className="w-4 h-4" />
              </button>
              <button
                onClick={stopDebugger}
                title="Stop Debugger"
                className="p-1.5 bg-rose-600/20 text-rose-400 hover:bg-rose-600/40 rounded-lg transition-colors"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {/* Call Stack Section */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mb-2">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Call Stack</span>
          </div>
          {callStack.length > 0 ? (
            <div className="space-y-1 text-xs font-mono">
              {callStack.map((frame, idx) => (
                <div
                  key={idx}
                  className={`p-1.5 rounded flex items-center justify-between ${
                    idx === 0 ? 'bg-indigo-600/20 text-indigo-300 font-semibold' : 'text-slate-400'
                  }`}
                >
                  <span>{frame.functionName}</span>
                  <span className="text-[10px] text-slate-400">
                    {frame.file}:{frame.line}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-400">No active debug frame paused.</p>
          )}
        </div>

        {/* Variables Scope Section */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mb-2">
            <List className="w-3.5 h-3.5 text-cyan-400" />
            <span>Scope Variables</span>
          </div>
          {Object.keys(debugVariables).length > 0 ? (
            <div className="space-y-1 text-xs font-mono">
              {Object.entries(debugVariables).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between p-1 bg-slate-900/60 rounded">
                  <span className="text-indigo-400">{k}:</span>
                  <span className="text-amber-300 truncate max-w-[140px]">
                    {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-400">Start debugger to inspect local scopes.</p>
          )}
        </div>

        {/* Watch Expressions */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
            <div className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span>Watch Expressions</span>
            </div>
          </div>

          <form onSubmit={handleAddWatch} className="flex items-center gap-1 mb-2">
            <input
              type="text"
              placeholder="e.g. user.latency or x + y"
              value={newWatchInput}
              onChange={(e) => setNewWatchInput(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="p-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="space-y-1 text-xs font-mono">
            {watchList.map((w) => (
              <div key={w.id} className="flex items-center justify-between p-1.5 bg-slate-900/60 rounded">
                <span className="text-slate-300">{w.expression}</span>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-semibold">{w.value || 'undefined'}</span>
                  <button
                    onClick={() => removeWatchExpression(w.id)}
                    className="text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Breakpoints List */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mb-2">
            <Bug className="w-3.5 h-3.5 text-rose-400" />
            <span>Breakpoints ({breakpoints.length})</span>
          </div>
          {breakpoints.length > 0 ? (
            <div className="space-y-1 text-xs">
              {breakpoints.map((bp, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-1.5 bg-slate-900/60 rounded cursor-pointer hover:bg-slate-800"
                  onClick={() => toggleBreakpoint(bp.file, bp.line)}
                >
                  <span className="text-indigo-300">
                    {bp.file} : Line {bp.line}
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-400">Click the editor line gutter to set breakpoints.</p>
          )}
        </div>
      </div>
    </div>
  );
};
