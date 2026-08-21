'use client';

import React, { useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { Monaco, OnMount } from '@monaco-editor/react';
import {
  X,
  Play,
  Square,
  Columns,
  Maximize2,
  Minimize2,
  Sparkles,
  FileCode,
  Check,
  RotateCcw,
  Bug,
  Loader2,
  Terminal,
  Lock,
  Globe,
  Radio,
} from 'lucide-react';
import { useCloudIdeStore } from '../../store/useCloudIdeStore';
import { TerminalPanel } from './TerminalPanel';
import { LiveBrowserPreview } from './LiveBrowserPreview';

const MonacoEditor = dynamic(
  () =>
    import('@monaco-editor/react').then(async (mod) => {
      try {
        if (typeof window !== 'undefined') {
          (window as any).MonacoEnvironment = {
            getWorkerUrl: function (_moduleId: string, label: string) {
              if (label === 'json') {
                return `data:text/javascript;charset=utf-8,${encodeURIComponent(`
                  self.MonacoEnvironment = { baseUrl: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/' };
                  importScripts('https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/language/json/json.worker.js');
                `)}`;
              }
              if (label === 'typescript' || label === 'javascript') {
                return `data:text/javascript;charset=utf-8,${encodeURIComponent(`
                  self.MonacoEnvironment = { baseUrl: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/' };
                  importScripts('https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/language/typescript/ts.worker.js');
                `)}`;
              }
              return `data:text/javascript;charset=utf-8,${encodeURIComponent(`
                self.MonacoEnvironment = { baseUrl: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/' };
                importScripts('https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/editor/editor.worker.js');
              `)}`;
            },
          };
        }
      } catch (err) {
        console.warn('Monaco worker notice:', err);
      }
      return mod;
    }),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex flex-col items-center justify-center bg-black min-h-[300px] text-slate-400 gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
        <span className="text-xs">Initializing Workspace...</span>
      </div>
    ),
  },
);

export const EditorPanel: React.FC = () => {
  const {
    currentLanguage,
    files,
    activeFile,
    openTabs,
    selectFile,
    closeTab,
    updateFileContent,
    splitFile,
    setSplitFile,
    runCode,
    stopExecution,
    metrics,
    settings,
    breakpoints,
    toggleBreakpoint,
    currentDebugLine,
    isDebugging,
    runAiAssist,
    aiDiffCode,
    aiDiffOriginal,
    acceptAiDiff,
    rejectAiDiff,
    aiDiffFile,
    aiAppliedNotification,
    dismissAiNotification,
    revertAiApplied,
    isReadOnlyWorkspace,
    forkWorkspace,
    isLivePreviewOpen,
    toggleLivePreview,
  } = useCloudIdeStore();

  const isFrontendRuntime = ['html', 'react', 'vue', 'angular', 'svelte'].includes(
    currentLanguage.toLowerCase(),
  );

  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [showFullscreenTerminal, setShowFullscreenTerminal] = useState(false);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);

  const currentFile = files.find((f) => f.name === activeFile) || files[0];
  const splitCurrentFile = splitFile ? files.find((f) => f.name === splitFile) : null;

  // Listen for Escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        setShowFullscreenTerminal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Synchronize Monaco editor content with external state (e.g. AI diff accept, template change, snapshot restore)
  useEffect(() => {
    if (editorRef.current && currentFile) {
      const currentEditorValue = editorRef.current.getValue();
      if (currentEditorValue !== currentFile.content) {
        editorRef.current.setValue(currentFile.content);
      }
    }
  }, [currentFile?.content, activeFile]);

  const getMonacoLanguage = (fileName: string) => {
    if (fileName.endsWith('.ts') || fileName.endsWith('.tsx')) return 'typescript';
    if (fileName.endsWith('.js') || fileName.endsWith('.jsx')) return 'javascript';
    if (fileName.endsWith('.py')) return 'python';
    if (fileName.endsWith('.go')) return 'go';
    if (fileName.endsWith('.rs')) return 'rust';
    if (fileName.endsWith('.cpp') || fileName.endsWith('.h')) return 'cpp';
    if (fileName.endsWith('.java')) return 'java';
    if (fileName.endsWith('.sql')) return 'sql';
    if (fileName.endsWith('.json')) return 'json';
    if (fileName.endsWith('.yaml') || fileName.endsWith('.yml')) return 'yaml';
    if (fileName.endsWith('.html')) return 'html';
    if (fileName.endsWith('.css')) return 'css';
    if (fileName.endsWith('.md')) return 'markdown';
    return 'plaintext';
  };

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Define Custom Themes
    monaco.editor.defineTheme('tokyo-night', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '565f89', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'bb9af7' },
        { token: 'string', foreground: '9ece6a' },
        { token: 'number', foreground: 'ff9e64' },
        { token: 'type', foreground: '7aa2f7' },
      ],
      colors: {
        'editor.background': '#1a1b26',
        'editor.foreground': '#a9b1d6',
        'editor.lineHighlightBackground': '#24283b',
        'editorCursor.foreground': '#c0caf5',
      },
    });

    monaco.editor.defineTheme('oled-black', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#000000',
        'editor.foreground': '#f8fafc',
        'editor.lineHighlightBackground': '#111111',
        'editorCursor.foreground': '#6366f1',
      },
    });

    // Add keyboard shortcut for Run: Cmd+Enter or Ctrl+Enter
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      runCode();
    });

    // Breakpoint gutter click listener
    editor.onMouseDown((e) => {
      if (e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
        const line = e.target.position?.lineNumber;
        if (line && activeFile) {
          toggleBreakpoint(activeFile, line);
        }
      }
    });
  };

  const handleFormatCode = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
    }
  };

  return (
    <div className={`flex flex-col h-full w-full bg-black select-none ${isFullscreen ? 'fixed inset-0 z-50' : 'relative'}`}>
      {/* Top Tabs Bar */}
      <div className="flex items-center justify-between bg-black border-b border-neutral-800 px-2 select-none overflow-x-auto shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto py-1">
          {openTabs.map((tab) => {
            const isActive = tab === activeFile;
            return (
              <div
                key={tab}
                onClick={() => selectFile(tab)}
                className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs cursor-pointer border transition-all duration-150 ${
                  isActive
                    ? 'bg-neutral-900 text-indigo-300 border-neutral-700 shadow-sm'
                    : 'bg-black text-slate-400 border-transparent hover:bg-neutral-900/60 hover:text-slate-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span className="font-medium">{tab}</span>
                {isReadOnlyWorkspace && (
                  <Lock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                )}
                {openTabs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab);
                    }}
                    className="p-0.5 rounded hover:bg-slate-800 hover:text-rose-400 opacity-60 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Controls on Top Right */}
        <div className="flex items-center gap-1.5 py-1 shrink-0">
          {/* Go Live Web Preview Button */}
          <button
            onClick={() => toggleLivePreview()}
            title={isLivePreviewOpen ? 'Close Live Web Preview' : 'Launch Go Live Browser Sandbox (Port 3000)'}
            className={`px-2.5 py-1 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
              isLivePreviewOpen
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60 shadow-emerald-500/10'
                : isFrontendRuntime
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400/50 shadow-indigo-500/20'
                : 'bg-neutral-900 hover:bg-neutral-800 text-slate-300 border-neutral-700'
            }`}
          >
            {isLivePreviewOpen ? (
              <>
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="flex items-center gap-1">
                  <span>● LIVE</span>
                  <span className="text-[10px] text-emerald-400/80 font-mono hidden sm:inline">:3000</span>
                </span>
              </>
            ) : (
              <>
                <Globe className={`w-3.5 h-3.5 ${isFrontendRuntime ? 'text-indigo-200' : 'text-emerald-400'}`} />
                <span>Go Live</span>
              </>
            )}
          </button>

          {/* AI Quick Explain */}
          <button
            onClick={() => runAiAssist('explain')}
            title="Explain with AI"
            className="px-2.5 py-1 bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">AI Assist</span>
          </button>

          {/* Split Screen Toggle */}
          <button
            onClick={() => {
              if (splitFile) setSplitFile(null);
              else {
                const second = files.find((f) => f.name !== activeFile);
                if (second) setSplitFile(second.name);
              }
            }}
            title={splitFile ? 'Close Split Editor' : 'Split Editor Side-by-Side'}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              splitFile
                ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/40'
                : 'text-slate-400 hover:text-slate-200 border-slate-800 hover:bg-slate-900'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Terminal Button */}
          {isFullscreen && (
            <button
              onClick={() => setShowFullscreenTerminal(!showFullscreenTerminal)}
              title={showFullscreenTerminal ? 'Hide Terminal (Fullscreen)' : 'Open Terminal (Fullscreen)'}
              className={`px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
                showFullscreenTerminal
                  ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50 font-semibold'
                  : 'text-slate-300 hover:text-white border-neutral-800 hover:bg-neutral-900 bg-neutral-950'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              <span>Terminal</span>
            </button>
          )}

          {/* Fullscreen Toggle */}
          <button
            onClick={() => {
              setIsFullscreen(!isFullscreen);
              if (isFullscreen) setShowFullscreenTerminal(false);
            }}
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Enter Fullscreen'}
            className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900 text-xs transition-colors flex items-center gap-1.5"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <kbd className="text-[9px] bg-neutral-800 px-1 py-0.2 rounded text-slate-400 font-mono">Esc</kbd>
              </>
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* AI Diff Suggestion Banner */}
      {aiDiffCode && (
        <div className="bg-indigo-950/95 border-b border-indigo-500/50 px-3 py-1.5 flex items-center justify-between text-xs text-indigo-100 z-10 animate-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span className="font-semibold text-indigo-200">
              AI Solution Ready for <span className="text-white font-mono bg-indigo-900/60 px-1.5 py-0.5 rounded border border-indigo-700/50">{aiDiffFile || activeFile}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => acceptAiDiff()}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-bold text-[11px] flex items-center gap-1.5 transition-colors shadow-sm"
              title="Apply AI changes to active editor"
            >
              <Check className="w-3.5 h-3.5" />
              Apply to IDE
            </button>
            <button
              onClick={rejectAiDiff}
              className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-slate-300 rounded-md font-semibold text-[11px] flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Discard
            </button>
          </div>
        </div>
      )}

      {/* AI Solution Applied Success Banner */}
      {aiAppliedNotification && (
        <div className="bg-emerald-950/95 border-b border-emerald-500/50 px-3 py-1.5 flex items-center justify-between text-xs text-emerald-100 z-10 animate-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-emerald-200">
              {aiAppliedNotification.message}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={revertAiApplied}
              className="px-2.5 py-1 bg-amber-700/80 hover:bg-amber-600 text-amber-100 rounded-md font-bold text-[11px] flex items-center gap-1 transition-colors"
              title="Revert back to original code"
            >
              <RotateCcw className="w-3 h-3" />
              Revert
            </button>
            <button
              onClick={dismissAiNotification}
              className="p-1 hover:bg-emerald-900 rounded text-emerald-300 hover:text-white transition-colors"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Execution Lock Banner */}
      {metrics.status === 'running' && (
        <div className="px-4 py-1.5 bg-indigo-950/80 border-b border-indigo-500/50 text-indigo-200 text-xs font-semibold flex items-center justify-between animate-pulse">
          <span className="flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            Executing in isolated sandbox... Editor locked to prevent race conditions.
          </span>
          <span className="text-[10px] bg-indigo-900/80 px-2 py-0.5 rounded text-indigo-300 uppercase font-mono font-bold">
            Locked (Running)
          </span>
        </div>
      )}

      {/* Breadcrumbs Path */}
      <div className="px-4 py-1 bg-black text-[11px] text-slate-400 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5 truncate">
          <span className="text-slate-400">workspace</span>
          <span>/</span>
          <span className="text-slate-200 font-semibold">{currentFile?.name}</span>
          {isReadOnlyWorkspace && (
            <span className="ml-2 px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" />
              Read-Only
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-slate-400">
          {breakpoints.filter((b) => b.file === activeFile).length > 0 && (
            <span className="text-rose-400 flex items-center gap-1">
              <Bug className="w-3 h-3" />
              {breakpoints.filter((b) => b.file === activeFile).length} breakpoint(s)
            </span>
          )}
          <span className="uppercase">{getMonacoLanguage(currentFile?.name || '')}</span>
          <span>UTF-8</span>
        </div>
      </div>

      {/* Monaco Editor Container / Split View */}
      <div className="flex-1 flex overflow-hidden relative bg-black">
        {/* Main Editor */}
        <div className="flex-1 h-full bg-black">
          {currentFile && (
            <MonacoEditor
              key={`editor-${currentLanguage}-${currentFile.name}`}
              path={`/${currentLanguage}/${currentFile.name}`}
              height="100%"
              theme={settings.theme}
              language={getMonacoLanguage(currentFile.name)}
              value={currentFile.content}
              onChange={(value) => updateFileContent(currentFile.name, value || '')}
              onMount={handleEditorMount}
              options={{
                fontFamily: settings.fontFamily,
                fontSize: settings.fontSize,
                lineHeight: settings.lineHeight,
                tabSize: settings.tabSize,
                minimap: { enabled: settings.minimap },
                wordWrap: settings.wordWrap,
                cursorBlinking: settings.cursorBlinking,
                cursorStyle: settings.cursorStyle,
                renderWhitespace: settings.renderWhitespace,
                bracketPairColorization: { enabled: settings.bracketPairColorization },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                glyphMargin: true,
                padding: { top: 12, bottom: 12 },
                readOnly: isReadOnlyWorkspace || metrics.status === 'running',
                domReadOnly: isReadOnlyWorkspace || metrics.status === 'running',
              }}
            />
          )}
        </div>

        {/* Split Editor (if enabled) */}
        {splitCurrentFile && (
          <div className="flex-1 h-full border-l border-neutral-800 bg-black">
            <div className="px-3 py-1 bg-neutral-900 text-[11px] text-slate-300 font-semibold border-b border-neutral-800 flex items-center justify-between">
              <span>{splitCurrentFile.name} (Split View)</span>
              <button onClick={() => setSplitFile(null)} className="hover:text-rose-400">
                <X className="w-3 h-3" />
              </button>
            </div>
            <MonacoEditor
              key={`split-${currentLanguage}-${splitCurrentFile.name}`}
              path={`/split/${currentLanguage}/${splitCurrentFile.name}`}
              height="100%"
              theme={settings.theme}
              language={getMonacoLanguage(splitCurrentFile.name)}
              value={splitCurrentFile.content}
              onChange={(value) => updateFileContent(splitCurrentFile.name, value || '')}
              options={{
                fontFamily: settings.fontFamily,
                fontSize: settings.fontSize,
                lineHeight: settings.lineHeight,
                tabSize: settings.tabSize,
                minimap: { enabled: false },
                wordWrap: settings.wordWrap,
                automaticLayout: true,
                padding: { top: 12, bottom: 12 },
                readOnly: isReadOnlyWorkspace || metrics.status === 'running',
                domReadOnly: isReadOnlyWorkspace || metrics.status === 'running',
              }}
            />
          </div>
        )}

        {/* Live Browser Preview Split Studio (if open) */}
        {isLivePreviewOpen && (
          <div className="flex-1 h-full min-w-[340px] border-l border-neutral-800 flex flex-col bg-slate-950">
            <LiveBrowserPreview onClose={() => toggleLivePreview(false)} />
          </div>
        )}
      </div>

      {/* Fullscreen Embedded Terminal Drawer */}
      {isFullscreen && showFullscreenTerminal && (
        <div className="h-64 border-t border-neutral-800 flex flex-col bg-black z-30 shrink-0 animate-in slide-in-from-bottom-2">
          <TerminalPanel />
        </div>
      )}
    </div>
  );
};
