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
    toggleBottomPanel,
    prewarmDaemon,
  } = useCloudIdeStore();

  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [bottomHeight, setBottomHeight] = useState(240);
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const [isDraggingBottom, setIsDraggingBottom] = useState(false);

  const currentTemplate =
    LANGUAGE_TEMPLATES.find((t) => t.id === currentLanguage) || LANGUAGE_TEMPLATES[0];

  useEffect(() => {
    // Daemon background pre-warm container during page load
    prewarmDaemon();
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
        // Activity bar width is 56px (w-14)
        // Enforce strict minimum width so icons & text are NEVER clipped or hidden
        const minAllowed = activeActivityPanel === 'converter' ? 380 : 280;
        const maxAllowed = Math.min(900, window.innerWidth - 320);
        const newWidth = Math.max(minAllowed, Math.min(maxAllowed, e.clientX - 56));
        setSidebarWidth(newWidth);
      }
      if (isDraggingBottom) {
        const newHeight = Math.max(100, Math.min(600, window.innerHeight - e.clientY - 24));
        setBottomHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingSidebar(false);
      setIsDraggingBottom(false);
    };

    if (isDraggingSidebar || isDraggingBottom) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = isDraggingSidebar ? 'col-resize' : 'row-resize';
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
  }, [isDraggingSidebar, isDraggingBottom, activeActivityPanel]);

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

          <div className="h-4 w-px bg-neutral-800" />

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Code2 className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-tight text-white hidden sm:inline">DevKits</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                CLOUD IDE
              </span>
            </div>
          </div>

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

        {/* Editor & Bottom Terminal Stack */}
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
