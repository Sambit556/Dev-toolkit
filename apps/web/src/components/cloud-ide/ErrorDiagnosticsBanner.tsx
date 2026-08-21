'use client';

import React from 'react';
import { AlertTriangle, Sparkles, X } from 'lucide-react';
import { useCloudIdeStore } from '../../store/useCloudIdeStore';

export const ErrorDiagnosticsBanner: React.FC = () => {
  const { diagnostics, dismissDiagnostics, runAiAssist, selectFile } = useCloudIdeStore();

  if (!diagnostics.hasError) return null;

  const handleFixAndRerun = async () => {
    await runAiAssist('fix');
  };

  // Clean single-line error summary
  const rawMsg = diagnostics.errorMessage || 'Syntax or runtime error detected';
  const singleLineMsg = rawMsg.split('\n')[0].replace(/^(?:Error:\s*)+/i, '');

  return (
    <div className="bg-rose-950/90 border-b border-rose-600/40 px-3 py-1.5 text-xs text-rose-100 flex items-center justify-between gap-2 shrink-0 animate-in slide-in-from-top-1 duration-150">
      <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        
        {diagnostics.failingFile && (
          <button
            onClick={() => selectFile(diagnostics.failingFile!)}
            className="px-1.5 py-0.5 bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700/50 rounded text-[11px] font-mono shrink-0 hover:underline"
            title="Jump to file"
          >
            {diagnostics.failingFile}{diagnostics.failingLine ? `:${diagnostics.failingLine}` : ''}
          </button>
        )}

        <span className="font-semibold text-rose-300 text-[11px] shrink-0">
          [{diagnostics.errorType || 'Warning'}]:
        </span>

        <span className="truncate text-rose-100/90 text-[11px] font-mono" title={rawMsg}>
          {singleLineMsg}
        </span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleFixAndRerun}
          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-md flex items-center gap-1 text-[11px] transition-colors shadow-sm"
          title="Analyze and auto-fix with AI"
        >
          <Sparkles className="w-3 h-3 text-indigo-200" />
          <span>Fix with AI</span>
        </button>

        <button
          onClick={dismissDiagnostics}
          className="p-1 hover:bg-rose-900/80 rounded text-rose-300 hover:text-white transition-colors"
          title="Dismiss banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
