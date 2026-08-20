'use client';

import React from 'react';
import { AlertTriangle, Sparkles, ArrowRight, X } from 'lucide-react';
import { useCloudIdeStore } from '../../store/useCloudIdeStore';

export const ErrorDiagnosticsBanner: React.FC = () => {
  const { diagnostics, dismissDiagnostics, runAiAssist, runCode, selectFile } = useCloudIdeStore();

  if (!diagnostics.hasError) return null;

  const handleFixAndRerun = async () => {
    await runAiAssist('fix');
  };

  return (
    <div className="bg-rose-950/70 border-b border-rose-600/40 p-3 text-xs text-rose-100 flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-semibold text-rose-200">
            <span>{diagnostics.errorType || 'Runtime Error'}</span>
            {diagnostics.failingFile && (
              <button
                onClick={() => selectFile(diagnostics.failingFile!)}
                className="underline hover:text-white text-rose-300 text-[11px]"
              >
                {diagnostics.failingFile}
                {diagnostics.failingLine ? `:${diagnostics.failingLine}` : ''}
              </button>
            )}
          </div>
          <p className="text-rose-200/90 leading-tight">
            {diagnostics.errorMessage || 'An exception interrupted code execution in the isolated sandbox.'}
          </p>
          {diagnostics.rootCauseAnalysis && (
            <p className="text-[11px] text-rose-300/80">
              <strong>Root Cause:</strong> {diagnostics.rootCauseAnalysis}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
        <button
          onClick={handleFixAndRerun}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg flex items-center gap-1.5 shadow-sm shadow-indigo-600/30 transition-all hover:scale-105"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Fix with AI</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={dismissDiagnostics}
          className="p-1 hover:bg-rose-900/60 rounded text-rose-300 hover:text-white transition-colors"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
