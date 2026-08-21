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
  Baby,
  Sparkle,
  Copy,
  CheckCheck,
} from 'lucide-react';
import { useCloudIdeStore } from '../../store/useCloudIdeStore';

export const AiAssistantPanel: React.FC = () => {
  const {
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
  const [copied, setCopied] = useState(false);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPrompt.trim()) {
      runAiAssist('generate', inputPrompt.trim());
      setInputPrompt('');
    }
  };

  const handleCopyResponse = () => {
    if (aiResponse) {
      navigator.clipboard.writeText(aiResponse);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const quickActions = [
    { id: 'clean', label: 'Clean Code', icon: RefreshCw, desc: 'Format, remove dead code & modernize style' },
    { id: 'explain', label: 'Explain Code', icon: HelpCircle, desc: 'Step-by-step logic, architecture & complexity' },
    { id: 'docs', label: 'Generate Docs', icon: BookOpen, desc: 'Add JSDoc, docstrings & parameter types' },
    { id: 'optimize', label: 'Optimize Speed', icon: Zap, desc: 'Improve time/space complexity & reduce lag' },
    { id: 'eli5', label: 'Explain as Beginner', icon: Baby, desc: 'Simple plain English with zero heavy jargon' },
    { id: 'fix', label: 'Fix Errors', icon: Wrench, desc: 'Where error is, why it came & full fix' },
    { id: 'test', label: 'Generate Tests', icon: TestTube, desc: 'Complete unit test suite with edge cases' },
  ];

  return (
    <div className="flex flex-col h-full bg-black text-slate-200 select-none text-xs p-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5 mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-white">AI Coding Workspace</h3>
            <p className="text-[10px] text-neutral-400">Context: <span className="text-indigo-300 font-mono">{activeFile}</span> ({currentLanguage})</p>
          </div>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-2 gap-1.5 mb-3 shrink-0">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => runAiAssist(action.id as any)}
              disabled={aiLoading}
              className="p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-850 border border-neutral-800 hover:border-indigo-500/50 text-left transition-all group disabled:opacity-50"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300 group-hover:text-indigo-200 mb-0.5">
                <Icon className="w-3.5 h-3.5" />
                <span>{action.label}</span>
              </div>
              <p className="text-[10px] text-neutral-400 line-clamp-1">{action.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Custom Prompt Input */}
      <form onSubmit={handleCustomSubmit} className="mb-3 shrink-0">
        <div className="relative flex items-center bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/30">
          <input
            type="text"
            placeholder="Ask AI what you want (e.g. add auth, clean code, refactor loop)..."
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={aiLoading}
            className="w-full bg-transparent text-xs text-slate-100 placeholder-neutral-500 focus:outline-none pr-8"
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

      {/* Proposed Changes Apply Card */}
      {aiDiffCode && (
        <div className="p-3 bg-indigo-950/40 border border-indigo-500/40 rounded-xl mb-3 space-y-2 shrink-0">
          <div className="flex items-center justify-between text-xs text-indigo-300 font-semibold">
            <span className="flex items-center gap-1">
              <FileCode className="w-3.5 h-3.5" />
              Solution Ready for {aiDiffFile || activeFile}
            </span>
          </div>
          <p className="text-[11px] text-slate-300">
            Click below to apply the AI solution directly into your editor.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={acceptAiDiff}
              className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-colors shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              Apply Solution to IDE
            </button>
            <button
              onClick={rejectAiDiff}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Discard
            </button>
          </div>
        </div>
      )}

      {/* AI Response Output Area */}
      <div className="flex-1 overflow-y-auto bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs flex flex-col relative">
        {aiLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3 text-neutral-400 my-auto">
            <Sparkles className="w-6 h-6 text-indigo-400 animate-spin" />
            <p className="text-xs font-medium">AI is analyzing your code...</p>
          </div>
        ) : aiResponse ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5 mb-2">
              <span className="text-[11px] text-indigo-400 font-semibold flex items-center gap-1">
                <Sparkle className="w-3 h-3" />
                AI Analysis
              </span>
              <button
                onClick={handleCopyResponse}
                title="Copy Response"
                className="text-[11px] text-neutral-400 hover:text-slate-200 flex items-center gap-1 p-1 rounded hover:bg-neutral-800"
              >
                {copied ? <CheckCheck className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
              {aiResponse}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-neutral-500 space-y-2 my-auto">
            <Sparkles className="w-6 h-6 text-neutral-600" />
            <p className="text-xs">Select an action above or describe what you want the AI to do.</p>
          </div>
        )}
      </div>
    </div>
  );
};
