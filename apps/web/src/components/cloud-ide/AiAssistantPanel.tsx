'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Wrench,
  HelpCircle,
  FileCode,
  Zap,
  TestTube,
  BookOpen,
  Send,
  Check,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';
import { useCloudIdeStore } from '../../store/useCloudIdeStore';

export const AiAssistantPanel: React.FC = () => {
  const {
    aiPrompt,
    setAiPrompt,
    aiLoading,
    aiResponse,
    aiDiffCode,
    aiDiffFile,
    runAiAssist,
    acceptAiDiff,
    rejectAiDiff,
    currentLanguage,
    activeFile,
  } = useCloudIdeStore();

  const [inputPrompt, setInputPrompt] = useState('');

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPrompt.trim()) {
      runAiAssist('generate', inputPrompt.trim());
      setInputPrompt('');
    }
  };

  const quickActions = [
    { id: 'explain', label: 'Explain Code', icon: HelpCircle, desc: 'Analyze architecture, logic & complexity' },
    { id: 'fix', label: 'Fix Errors', icon: Wrench, desc: 'Resolve runtime exceptions and type bugs' },
    { id: 'refactor', label: 'Refactor Clean', icon: RefreshCw, desc: 'Apply clean code & SOLID principles' },
    { id: 'optimize', label: 'Optimize Speed', icon: Zap, desc: 'Improve time & memory performance' },
    { id: 'test', label: 'Generate Tests', icon: TestTube, desc: 'Create comprehensive unit test suite' },
    { id: 'docs', label: 'Generate Docs', icon: BookOpen, desc: 'Add JSDoc, docstrings & annotations' },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-900/60 text-slate-200 select-none text-sm p-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-white">AI Coding Workspace</h3>
            <p className="text-[10px] text-slate-400">Context: {activeFile} ({currentLanguage})</p>
          </div>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => runAiAssist(action.id as any)}
              disabled={aiLoading}
              className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/50 text-left transition-all group disabled:opacity-50"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300 group-hover:text-indigo-200 mb-0.5">
                <Icon className="w-3.5 h-3.5" />
                <span>{action.label}</span>
              </div>
              <p className="text-[10px] text-slate-400 line-clamp-1">{action.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Custom Prompt Input */}
      <form onSubmit={handleCustomSubmit} className="mb-3">
        <div className="relative flex items-center bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-2 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/30">
          <input
            type="text"
            placeholder="Ask AI or describe code to generate..."
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={aiLoading}
            className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-400 focus:outline-none pr-8"
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || aiLoading}
            className="absolute right-2 p-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {/* Diff Review Card if Pending */}
      {aiDiffCode && (
        <div className="p-3 bg-indigo-950/40 border border-indigo-500/40 rounded-xl mb-3 space-y-2">
          <div className="flex items-center justify-between text-xs text-indigo-300 font-semibold">
            <span className="flex items-center gap-1">
              <FileCode className="w-3.5 h-3.5" />
              Proposed Changes for {aiDiffFile}
            </span>
          </div>
          <p className="text-[11px] text-slate-300">
            Review the generated code diff. Click accept to update your file automatically.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={acceptAiDiff}
              className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Accept Changes
            </button>
            <button
              onClick={rejectAiDiff}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Discard
            </button>
          </div>
        </div>
      )}

      {/* AI Response Output Area */}
      <div className="flex-1 overflow-y-auto bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-xs">
        {aiLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3 text-slate-400">
            <Sparkles className="w-6 h-6 text-indigo-400 animate-spin" />
            <p className="text-xs font-medium">Generating intelligent code solutions...</p>
          </div>
        ) : aiResponse ? (
          <div className="space-y-2 text-slate-200 whitespace-pre-wrap leading-relaxed">
            {aiResponse}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 space-y-2">
            <Sparkles className="w-6 h-6 text-slate-400" />
            <p className="text-xs">Select an action above or type a custom prompt to instruct the AI.</p>
          </div>
        )}
      </div>
    </div>
  );
};
