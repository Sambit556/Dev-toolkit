'use client';

import React from 'react';
import {
  ArrowRightLeft,
  Sparkles,
  Copy,
  Check,
  PlusCircle,
  AlertTriangle,
  FileCode,
  Zap,
  ClipboardPaste,
} from 'lucide-react';
import { useCloudIdeStore } from '../../store/useCloudIdeStore';

const CONVERTER_LANGUAGES = [
  { id: 'python', name: 'Python 3', ext: '.py' },
  { id: 'typescript', name: 'TypeScript', ext: '.ts' },
  { id: 'javascript', name: 'JavaScript', ext: '.js' },
  { id: 'go', name: 'Go (Golang)', ext: '.go' },
  { id: 'rust', name: 'Rust', ext: '.rs' },
  { id: 'cpp', name: 'C++ (C++20)', ext: '.cpp' },
  { id: 'java', name: 'Java', ext: '.java' },
  { id: 'csharp', name: 'C# (.NET)', ext: '.cs' },
  { id: 'php', name: 'PHP', ext: '.php' },
  { id: 'ruby', name: 'Ruby', ext: '.rb' },
  { id: 'sql', name: 'SQL', ext: '.sql' },
];

export const CodeConverterStudio: React.FC = () => {
  const {
    files,
    activeFile,
    converterSourceLang,
    converterTargetLang,
    converterSourceCode,
    converterTargetCode,
    converterWarnings,
    converterNotes,
    converterLoading,
    setConverterSourceLang,
    setConverterTargetLang,
    setConverterSourceCode,
    runCodeConversion,
    applyConvertedToProject,
  } = useCloudIdeStore();

  const [copied, setCopied] = React.useState(false);
  const [pasteNotice, setPasteNotice] = React.useState(false);

  const handleCopy = () => {
    if (converterTargetCode) {
      navigator.clipboard.writeText(converterTargetCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setConverterSourceCode(text);
        setPasteNotice(true);
        setTimeout(() => setPasteNotice(false), 1500);
      }
    } catch {
      // Fallback
    }
  };

  const handleLoadActiveFile = () => {
    const current = files.find((f) => f.name === activeFile) || files[0];
    if (current) {
      setConverterSourceCode(current.content);
      // Auto-detect source language from active file extension
      if (current.name.endsWith('.py')) setConverterSourceLang('python');
      else if (current.name.endsWith('.ts') || current.name.endsWith('.tsx')) setConverterSourceLang('typescript');
      else if (current.name.endsWith('.js') || current.name.endsWith('.jsx')) setConverterSourceLang('javascript');
      else if (current.name.endsWith('.go')) setConverterSourceLang('go');
      else if (current.name.endsWith('.rs')) setConverterSourceLang('rust');
      else if (current.name.endsWith('.cpp')) setConverterSourceLang('cpp');
      else if (current.name.endsWith('.java')) setConverterSourceLang('java');
    }
  };

  const handleSwap = () => {
    const prevSrc = converterSourceLang;
    const prevTarget = converterTargetLang;
    setConverterSourceLang(prevTarget);
    setConverterTargetLang(prevSrc);
    if (converterTargetCode) {
      setConverterSourceCode(converterTargetCode);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black text-slate-200 select-none text-sm p-3 overflow-y-auto">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <ArrowRightLeft className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-white">Code Converter Studio</h3>
            <p className="text-[10px] text-slate-400">Transpile code across 10+ languages preserving structure</p>
          </div>
        </div>
      </div>

      {/* Language Selectors & Swap */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex-1">
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Source Language</label>
          <select
            value={converterSourceLang}
            onChange={(e) => setConverterSourceLang(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            {CONVERTER_LANGUAGES.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSwap}
          title="Swap Languages"
          className="p-2 mt-4 bg-neutral-900 hover:bg-neutral-800 rounded-lg border border-neutral-800 text-slate-300 transition-colors"
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
        </button>

        <div className="flex-1">
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Target Language</label>
          <select
            value={converterTargetLang}
            onChange={(e) => setConverterTargetLang(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            {CONVERTER_LANGUAGES.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Source Code Area */}
      <div className="flex flex-col mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-semibold text-slate-300">Source Code ({converterSourceLang}):</label>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePaste}
              title="Paste from Clipboard"
              className="px-2 py-0.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-slate-300 hover:text-white rounded text-[11px] font-medium flex items-center gap-1 transition-colors"
            >
              {pasteNotice ? <Check className="w-3 h-3 text-emerald-400" /> : <ClipboardPaste className="w-3 h-3 text-indigo-400" />}
              <span>{pasteNotice ? 'Pasted!' : 'Paste'}</span>
            </button>
            <button
              onClick={handleLoadActiveFile}
              title="Load active editor file into source"
              className="px-2 py-0.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-slate-300 hover:text-white rounded text-[11px] font-medium flex items-center gap-1 transition-colors"
            >
              <FileCode className="w-3 h-3 text-cyan-400" />
              <span>Load Active File</span>
            </button>
          </div>
        </div>
        <textarea
          value={converterSourceCode}
          onChange={(e) => setConverterSourceCode(e.target.value)}
          placeholder="Paste or write source code to transpile..."
          rows={6}
          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-y"
        />
      </div>

      {/* Convert Trigger Button */}
      <button
        onClick={runCodeConversion}
        disabled={converterLoading || !converterSourceCode.trim()}
        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-600/30 transition-all mb-3"
      >
        {converterLoading ? (
          <>
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>Transpiling AST & Syntax...</span>
          </>
        ) : (
          <>
            <Zap className="w-4 h-4" />
            <span>Convert to {converterTargetLang.toUpperCase()}</span>
          </>
        )}
      </button>

      {/* Warnings & Notes */}
      {converterWarnings.length > 0 && (
        <div className="p-2.5 bg-amber-950/30 border border-amber-800/40 rounded-xl mb-3 text-xs text-amber-300 space-y-1">
          <div className="flex items-center gap-1 font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Transpilation Warnings:</span>
          </div>
          {converterWarnings.map((w, i) => (
            <p key={i} className="text-[11px] text-amber-200/90 pl-4">• {w}</p>
          ))}
        </div>
      )}

      {/* Converted Target Code */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-semibold text-slate-300">Converted Code ({converterTargetLang}):</label>
          {converterTargetCode && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopy}
                className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                title="Copy Converted Code"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Converted Code'}</span>
              </button>
              <button
                onClick={applyConvertedToProject}
                className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add to Project</span>
              </button>
            </div>
          )}
        </div>
        <textarea
          readOnly
          value={converterTargetCode || '// Click "Convert" above to generate target code'}
          rows={7}
          className="flex-1 w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 font-mono text-xs text-emerald-300 focus:outline-none resize-y"
        />
      </div>
    </div>
  );
};
