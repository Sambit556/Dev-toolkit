'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Wrench,
  HelpCircle,
  Zap,
  TestTube,
  BookOpen,
  Send,
  RefreshCw,
  Sparkle,
  Copy,
  CheckCheck,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Code,
} from 'lucide-react';
import { useCloudIdeStore } from '../../store/useCloudIdeStore';

export const AiAssistantPanel: React.FC = () => {
  const {
    aiLoading,
    aiResponse,
    runAiAssist,
    currentLanguage,
    activeFile,
  } = useCloudIdeStore();

  const [inputPrompt, setInputPrompt] = useState('');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPrompt.trim()) {
      runAiAssist('custom', inputPrompt.trim());
      setInputPrompt('');
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const quickActions = [
    { id: 'clean', label: 'Clean Code', icon: RefreshCw, desc: 'Format & modernize' },
    { id: 'fix', label: 'Fix Errors', icon: Wrench, desc: 'Find & auto-fix bugs' },
    { id: 'explain', label: 'Explain Code', icon: HelpCircle, desc: 'Architecture & logic' },
    { id: 'optimize', label: 'Optimize Speed', icon: Zap, desc: 'Reduce runtime lag' },
    { id: 'docs', label: 'Generate Docs', icon: BookOpen, desc: 'Add docstrings & types' },
    { id: 'test', label: 'Generate Tests', icon: TestTube, desc: 'Unit test suite' },
  ];

  // Parse markdown into structured visual sections
  const renderFormattedAiContent = (content: string) => {
    // 1. Check if the content has code blocks
    const parts: Array<{ type: 'text' | 'code'; content: string; lang?: string }> = [];
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: content.substring(lastIndex, match.index) });
      }
      parts.push({ type: 'code', lang: match[1] || currentLanguage, content: match[2].trim() });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({ type: 'text', content: content.substring(lastIndex) });
    }

    return (
      <div className="space-y-3">
        {parts.map((part, idx) => {
          if (part.type === 'code') {
            return (
              <div
                key={`code-${idx}`}
                className="rounded-xl border border-neutral-850 bg-neutral-900/90 overflow-hidden shadow-lg"
              >
                <div className="px-3 py-1.5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-indigo-300">
                    <Code className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{part.lang?.toUpperCase() || currentLanguage.toUpperCase()}</span>
                    <span className="text-[10px] text-neutral-500 font-normal">
                      ({part.content.split('\n').length} lines)
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopyText(part.content, `code-${idx}`)}
                    className="px-2 py-0.5 rounded bg-neutral-850 hover:bg-neutral-800 text-[10px] text-neutral-300 flex items-center gap-1 transition-colors"
                    title="Copy code snippet"
                  >
                    {copiedSection === `code-${idx}` ? (
                      <CheckCheck className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-neutral-400" />
                    )}
                    <span>{copiedSection === `code-${idx}` ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-3 text-[11px] font-mono text-slate-100 overflow-x-auto leading-relaxed selection:bg-indigo-500/30">
                  <code>{part.content}</code>
                </pre>
              </div>
            );
          }

          // Parse text paragraphs into clean styled cards
          const text = part.content.trim();
          if (!text) return null;

          const lines = text.split('\n');
          return (
            <div key={`text-${idx}`} className="space-y-2 text-xs leading-relaxed text-slate-200">
              {lines.map((line, lIdx) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={lIdx} className="h-1" />;

                // Section 1: Where the error is
                if (trimmed.includes('📍') || trimmed.toLowerCase().includes('where the error is')) {
                  return (
                    <div
                      key={lIdx}
                      className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-600/40 text-rose-100 font-medium space-y-1"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        <span>1. 📍 Where the Error Is</span>
                      </div>
                      <p className="text-[11px] text-rose-200/90 font-normal pl-5">
                        {trimmed.replace(/^[#\d\s.*📍]+where the error is[:\s]*/i, '')}
                      </p>
                    </div>
                  );
                }

                // Section 2: Why it came
                if (trimmed.includes('🔍') || trimmed.toLowerCase().includes('why it came')) {
                  return (
                    <div
                      key={lIdx}
                      className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-600/40 text-purple-100 font-medium space-y-1"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                        <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
                        <span>2. 🔍 Why It Came (Root Cause)</span>
                      </div>
                      <p className="text-[11px] text-purple-200/90 font-normal pl-5">
                        {trimmed.replace(/^[#\d\s.*🔍]+why it came[:\s]*/i, '')}
                      </p>
                    </div>
                  );
                }

                // Section 3: What's the solution
                if (trimmed.includes('💡') || trimmed.toLowerCase().includes("what's the solution") || trimmed.toLowerCase().includes('what is the solution')) {
                  return (
                    <div
                      key={lIdx}
                      className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-600/40 text-cyan-100 font-medium space-y-1"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                        <Lightbulb className="w-3.5 h-3.5 text-cyan-400" />
                        <span>3. 💡 What's the Solution</span>
                      </div>
                      <p className="text-[11px] text-cyan-200/90 font-normal pl-5">
                        {trimmed.replace(/^[#\d\s.*💡]+what['a-z\s]+solution[:\s]*/i, '')}
                      </p>
                    </div>
                  );
                }

                // Section 4: Apply the solution
                if (trimmed.includes('🛠️') || trimmed.toLowerCase().includes('apply the solution')) {
                  return (
                    <div
                      key={lIdx}
                      className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-600/40 text-emerald-100 font-medium flex items-center justify-between"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>4. 🛠️ Solution Code</span>
                      </div>
                    </div>
                  );
                }

                // Headers
                if (trimmed.startsWith('### ') || trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
                  return (
                    <h4
                      key={lIdx}
                      className="font-bold text-xs text-indigo-300 pt-1 border-b border-neutral-800 pb-1"
                    >
                      {trimmed.replace(/^#+\s+/, '')}
                    </h4>
                  );
                }

                // Bullet points
                if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                  return (
                    <div key={lIdx} className="flex items-start gap-2 pl-2">
                      <span className="text-indigo-400 text-xs leading-4">•</span>
                      <span className="flex-1 text-slate-300 text-[11px]">{trimmed.replace(/^[-*]\s+/, '')}</span>
                    </div>
                  );
                }

                return (
                  <p key={lIdx} className="text-[11px] text-slate-300 leading-relaxed font-sans">
                    {trimmed}
                  </p>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-black text-slate-200 select-none text-xs p-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-white">AI Coding Workspace</h3>
            <p className="text-[10px] text-neutral-400">
              Active File: <span className="text-indigo-300 font-mono">{activeFile}</span> ({currentLanguage})
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-2.5 shrink-0">
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
      <form onSubmit={handleCustomSubmit} className="mb-2.5 shrink-0">
        <div className="relative flex items-center bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/30">
          <input
            type="text"
            placeholder="Ask AI (e.g. clean code, add auth, optimize speed)..."
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={aiLoading}
            className="w-full bg-transparent text-xs text-slate-100 placeholder-neutral-500 focus:outline-none pr-8 font-sans"
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || aiLoading}
            className="absolute right-1.5 p-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {/* AI Response Output Area */}
      <div className="flex-1 overflow-y-auto bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs flex flex-col relative">
        {aiLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3 text-neutral-400 my-auto">
            <Sparkles className="w-7 h-7 text-indigo-400 animate-spin" />
            <p className="text-xs font-medium text-slate-300">Gemini 3.7 Flash is analyzing your code...</p>
            <p className="text-[10px] text-neutral-500">Generating precise diagnostic & solution</p>
          </div>
        ) : aiResponse ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
              <span className="text-[11px] text-indigo-400 font-semibold flex items-center gap-1">
                <Sparkle className="w-3.5 h-3.5" />
                AI Diagnostic & Analysis
              </span>
              <button
                onClick={() => handleCopyText(aiResponse, 'all')}
                title="Copy Response"
                className="text-[11px] text-neutral-400 hover:text-slate-200 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-neutral-850 border border-neutral-800 transition-colors"
              >
                {copiedSection === 'all' ? (
                  <CheckCheck className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>{copiedSection === 'all' ? 'Copied' : 'Copy All'}</span>
              </button>
            </div>
            {renderFormattedAiContent(aiResponse)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-neutral-500 space-y-2 my-auto">
            <Sparkles className="w-7 h-7 text-neutral-700" />
            <p className="text-xs text-neutral-400 font-medium">No active AI analysis</p>
            <p className="text-[10px] text-neutral-500 max-w-[200px]">
              Click a preset action above or ask a question to analyze, debug, or optimize your code.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
