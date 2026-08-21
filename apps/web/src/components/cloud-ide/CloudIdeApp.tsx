'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Code2,
  Play,
  Square,
  Sparkles,
  Command,
  Share2,
  Settings,
  History,
  Terminal,
  Columns,
  Cpu,
  ShieldCheck,
  Zap,
  ArrowLeft,
  Lock,
  GitFork,
} from 'lucide-react';
import { useCloudIdeStore } from '../../store/useCloudIdeStore';
import { ActivityBar } from './ActivityBar';
import { ProjectExplorer } from './ProjectExplorer';
import { GlobalSearch } from './GlobalSearch';
import { GitPanel } from './GitPanel';
import { DebuggerPanel } from './DebuggerPanel';
import { AiAssistantPanel } from './AiAssistantPanel';
import { CodeConverterStudio } from './CodeConverterStudio';
import { ConfigStudio } from './ConfigStudio';
import { EditorPanel } from './EditorPanel';
import { TerminalPanel } from './TerminalPanel';
import { VersionHistoryModal } from './VersionHistoryModal';
import { ShareModal } from './ShareModal';
import { SettingsModal } from './SettingsModal';
import { CommandPalette } from './CommandPalette';
import { LANGUAGE_TEMPLATES } from '../../lib/templates';

export const CloudIdeApp: React.FC = () => {
  const {
    activeActivityPanel,
    isSidebarOpen,
    isBottomPanelOpen,
    currentLanguage,
    setLanguage,
    runCode,
    stopExecution,
    metrics,
    setCommandPaletteOpen,
    setShareModalOpen,
    setSettingsModalOpen,
    setVersionModalOpen,
    terminalPosition,
    setTerminalPosition,
    toggleBottomPanel,
    prewarmDaemon,
    isReadOnlyWorkspace,
    sharedWorkspaceInfo,
    loadSharedWorkspace,
    forkWorkspace,
  } = useCloudIdeStore();

  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [bottomHeight, setBottomHeight] = useState(240);
  const [rightTerminalWidth, setRightTerminalWidth] = useState(440);
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const [isDraggingBottom, setIsDraggingBottom] = useState(false);
  const [isDraggingRightTerminal, setIsDraggingRightTerminal] = useState(false);

  const currentTemplate =
    LANGUAGE_TEMPLATES.find((t) => t.id === currentLanguage) || LANGUAGE_TEMPLATES[0];

  // Load Shared Workspace if URL parameters are present
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const shareId = urlParams.get('shareId') || urlParams.get('share');
    const snapshotParam = urlParams.get('snapshot');

    if (snapshotParam) {
      try {
        const decoded = JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(snapshotParam)))));
        if (decoded && Array.isArray(decoded.f) && decoded.f.length > 0) {
          const projectFiles = decoded.f.map((item: any) => ({ name: item.n, content: item.c }));
          loadSharedWorkspace({
            files: projectFiles,
            language: decoded.l || 'javascript',
            activeFile: decoded.a || projectFiles[0]?.name,
            isReadOnly: decoded.r === 1,
            name: 'Shared Snapshot Workspace',
          });
        }
      } catch (e) {
        console.warn('Snapshot decode error:', e);
      }
    } else if (shareId) {
      fetch(`/api/sandbox/share/${shareId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.files && Array.isArray(data.files)) {
            loadSharedWorkspace({
              files: data.files,
              language: data.language || 'javascript',
              activeFile: data.activeFile || data.files[0]?.name,
              isReadOnly: data.isReadOnly,
              name: data.name,
              id: data.id,
            });
          }
        })
        .catch((err) => console.warn('Share fetch error:', err));
    }
  }, [loadSharedWorkspace]);

  useEffect(() => {
    let isMounted = true;
    if (isMounted) {
      prewarmDaemon();
    }
    return () => {
      isMounted = false;
    };
  }, [prewarmDaemon]);

  // When switching to Code Converter Studio or wide panels, auto-expand to wide capacity
  useEffect(() => {
    if (activeActivityPanel === 'converter') {
      setSidebarWidth((prev) => Math.max(prev, 580));
    } else if (activeActivityPanel === 'ai') {
      setSidebarWidth((prev) => Math.max(prev, 440));
    }
  }, [activeActivityPanel]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingSidebar) {
        const minAllowed = activeActivityPanel === 'converter' ? 380 : 280;
        const maxAllowed = Math.min(900, window.innerWidth - 320);
        const newWidth = Math.max(minAllowed, Math.min(maxAllowed, e.clientX - 56));
        setSidebarWidth(newWidth);
      }
      if (isDraggingBottom) {
        const newHeight = Math.max(100, Math.min(600, window.innerHeight - e.clientY - 24));
        setBottomHeight(newHeight);
      }
      if (isDraggingRightTerminal) {
        const newWidth = Math.max(280, Math.min(900, window.innerWidth - e.clientX));
        setRightTerminalWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingSidebar(false);
      setIsDraggingBottom(false);
      setIsDraggingRightTerminal(false);
    };

    if (isDraggingSidebar || isDraggingBottom || isDraggingRightTerminal) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = isDraggingBottom ? 'row-resize' : 'col-resize';
    } else {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDraggingSidebar, isDraggingBottom, isDraggingRightTerminal, activeActivityPanel]);

  const renderActiveSidebar = () => {
    switch (activeActivityPanel) {
      case 'explorer':
        return <ProjectExplorer />;
      case 'search':
        return <GlobalSearch />;
      case 'git':
        return <GitPanel />;
      case 'debug':
        return <DebuggerPanel />;
      case 'ai':
        return <AiAssistantPanel />;
      case 'converter':
        return <CodeConverterStudio />;
      case 'config':
        return <ConfigStudio />;
      default:
        return <ProjectExplorer />;
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-black text-slate-100 overflow-hidden font-sans select-none">
      {/* Top IDE Header / Title Bar */}
      <header className="h-11 bg-black border-b border-neutral-800 px-3 flex items-center justify-between shrink-0 z-30">
        {/* Left: Back Button & Brand & Project Info */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            title="Back to DevKits Tools"
            className="flex items-center gap-1.5 px-2 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-lg text-xs text-slate-300 hover:text-white transition-all group shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-400 group-hover:-translate-x-0.5 transition-transform" />
            <span className="font-medium">Back</span>
          </Link>

          <Link
            href="/"
            title="Return to DevKits Home"
            className="flex items-center gap-2 hover:opacity-90 transition-opacity group"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Code2 className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-tight text-white group-hover:text-indigo-300 transition-colors hidden sm:inline">
                DevKits
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                CODE STUDIO
              </span>
            </div>
          </Link>

          <div className="h-4 w-px bg-neutral-800 hidden sm:block" />

          {/* Quick Language Badge */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300 bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-lg">
            <span>{currentTemplate.icon}</span>
            <span className="font-semibold text-slate-100">{currentTemplate.name}</span>
            <span className="text-[10px] text-slate-400">({currentTemplate.version})</span>
          </div>
        </div>

        {/* Center: Command Palette Trigger Bar */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-2 px-3 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-xl text-xs text-slate-400 hover:text-slate-200 transition-all w-64 md:w-80 justify-between shadow-inner"
        >
          <div className="flex items-center gap-2 truncate">
            <Command className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">Search commands & files...</span>
          </div>
          <kbd className="hidden sm:inline px-1.5 py-0.5 text-[10px] bg-black rounded border border-neutral-800 text-slate-400 font-mono">
            Ctrl+K
          </kbd>
        </button>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Run / Stop */}
          {metrics.status === 'running' ? (
            <button
              onClick={stopExecution}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-rose-600/30 transition-all"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              onClick={runCode}
              className="px-3.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-600/30 transition-all hover:scale-105"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run</span>
            </button>
          )}

          {/* Dedicated Hide / Show Terminal / Output Button (Right of Run) */}
          <button
            onClick={() => toggleBottomPanel()}
            title={isBottomPanelOpen ? 'Hide Terminal / Output' : 'Show Terminal / Output'}
            className={`px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all ${
              isBottomPanelOpen
                ? 'bg-slate-900 text-indigo-300 border-indigo-500/40 hover:bg-slate-800'
                : 'bg-neutral-900 hover:bg-neutral-800 text-slate-300 border-neutral-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">
              {isBottomPanelOpen ? 'Hide Terminal / Output' : 'Show Terminal / Output'}
            </span>
          </button>

          <div className="h-4 w-px bg-neutral-800 hidden sm:block" />

          {/* Share */}
          <button
            onClick={() => setShareModalOpen(true)}
            className="p-1.5 hover:bg-neutral-900 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
            title="Share Workspace"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Version History */}
          <button
            onClick={() => setVersionModalOpen(true)}
            className="p-1.5 hover:bg-neutral-900 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
            title="Version Checkpoints"
          >
            <History className="w-4 h-4" />
          </button>

          {/* Settings */}
          <button
            onClick={() => setSettingsModalOpen(true)}
            className="p-1.5 hover:bg-neutral-900 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* VSCode-Grade Read-Only Shared Workspace Banner */}
      {isReadOnlyWorkspace && (
        <div className="h-9 bg-gradient-to-r from-amber-950/90 via-slate-900 to-indigo-950/90 border-b border-amber-500/40 px-3 flex items-center justify-between text-xs text-amber-200 z-20 shrink-0 select-none animate-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Lock className="w-3.5 h-3.5" />
            </span>
            <span className="font-semibold text-amber-100">
              Read-Only Workspace: <span className="text-white font-mono">{sharedWorkspaceInfo?.name || `${currentLanguage.toUpperCase()} Project`}</span>
            </span>
            <span className="text-[11px] text-amber-300/80 hidden md:inline">
              — You are viewing a shared live session. You can run code or fork to edit.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={forkWorkspace}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-amber-500/20 hover:scale-105"
              title="Create your own editable copy"
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Fork to Edit</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace Area (Activity Bar + Sidebar + Resizer + Editor + Terminal) */}
      <div className="flex-1 flex overflow-hidden relative bg-black">
        {/* Left Activity Bar */}
        <ActivityBar />

        {/* Collapsible Tool Sidebar */}
        {isSidebarOpen && (
          <>
            <aside
              style={{ width: `${sidebarWidth}px` }}
              className="h-full border-r border-neutral-800 shrink-0 flex flex-col overflow-hidden bg-neutral-950 z-10"
            >
              {renderActiveSidebar()}
            </aside>

            {/* Draggable Sidebar Resizer Handle */}
            <div
              onMouseDown={() => setIsDraggingSidebar(true)}
              className="w-1.5 hover:w-2 hover:bg-indigo-500 cursor-col-resize transition-all bg-transparent z-20 shrink-0 select-none group flex items-center justify-center -ml-0.5"
              title="Drag to resize sidebar"
            >
              <div className="w-0.5 h-8 rounded-full bg-neutral-700 group-hover:bg-indigo-400 transition-colors" />
            </div>
          </>
        )}

        {/* Editor & Dynamic Terminal Layout (Bottom vs Right Dock) */}
        {terminalPosition === 'right' ? (
          <main className="flex-1 flex flex-row h-full overflow-hidden relative bg-black">
            {/* Editor Canvas */}
            <div className="flex-1 flex overflow-hidden bg-black">
              <EditorPanel />
            </div>

            {/* Collapsible Right Terminal Panel & Resizer */}
            {isBottomPanelOpen && (
              <>
                {/* Draggable Right Resizer Handle */}
                <div
                  onMouseDown={() => setIsDraggingRightTerminal(true)}
                  className="w-1.5 hover:w-2 hover:bg-indigo-500 cursor-col-resize transition-all bg-neutral-900 border-l border-neutral-800 z-20 shrink-0 select-none group flex items-center justify-center -mr-0.5"
                  title="Drag to resize terminal panel"
                >
                  <div className="w-0.5 h-12 rounded-full bg-neutral-600 group-hover:bg-indigo-400 transition-colors" />
                </div>

                <div
                  style={{ width: `${rightTerminalWidth}px` }}
                  className="shrink-0 flex flex-col overflow-hidden bg-black border-l border-neutral-800"
                >
                  <TerminalPanel />
                </div>
              </>
            )}
          </main>
        ) : (
          <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-black">
            {/* Editor Canvas */}
            <div className="flex-1 flex overflow-hidden bg-black">
              <EditorPanel />
            </div>

            {/* Collapsible Bottom Terminal Panel & Resizer */}
            {isBottomPanelOpen && (
              <>
                {/* Draggable Bottom Resizer Handle */}
                <div
                  onMouseDown={() => setIsDraggingBottom(true)}
                  className="h-1.5 hover:h-2 hover:bg-indigo-500 cursor-row-resize transition-all bg-neutral-900 border-t border-neutral-800 z-20 shrink-0 select-none group flex items-center justify-center"
                  title="Drag to resize terminal panel"
                >
                  <div className="h-0.5 w-12 rounded-full bg-neutral-600 group-hover:bg-indigo-400 transition-colors" />
                </div>

                <div style={{ height: `${bottomHeight}px` }} className="shrink-0 flex flex-col overflow-hidden bg-black">
                  <TerminalPanel />
                </div>
              </>
            )}
          </main>
        )}
      </div>

      {/* Status Bar */}
      <footer className="h-6 bg-black border-t border-neutral-800 px-3 flex items-center justify-between text-[11px] text-slate-400 shrink-0 select-none z-30">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            Isolated Sandbox
          </span>
          <span className="text-neutral-700">|</span>
          <span className="text-slate-400">Upstash Box v1 Runtime</span>
        </div>

        <div className="flex items-center gap-4 text-slate-400">
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3 text-cyan-400" />
            2 vCPU • 256MB RAM Cap
          </span>
          <button onClick={() => toggleBottomPanel()} className="hover:text-white flex items-center gap-1">
            <Terminal className="w-3 h-3" />
            {isBottomPanelOpen ? 'Hide Terminal' : 'Show Terminal'}
          </button>
        </div>
      </footer>

      {/* Global Modals */}
      <CommandPalette />
      <VersionHistoryModal />
      <ShareModal />
      <SettingsModal />
    </div>
  );
};
