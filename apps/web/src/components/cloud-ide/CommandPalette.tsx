'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Play,
  Bug,
  Sparkles,
  ArrowRightLeft,
  Sliders,
  History,
  Share2,
  Settings,
  FileCode,
  Layers,
  Terminal,
  Globe,
} from 'lucide-react';
import { useCloudIdeStore } from '../../store/useCloudIdeStore';
import { LANGUAGE_TEMPLATES } from '../../lib/templates';

interface CommandItem {
  id: string;
  title: string;
  category: string;
  icon: React.ElementType;
  action: () => void;
  shortcut?: string;
}

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    runCode,
    startDebugger,
    runAiAssist,
    setActiveActivityPanel,
    setLanguage,
    setShareModalOpen,
    setSettingsModalOpen,
    setVersionModalOpen,
    toggleBottomPanel,
    toggleLivePreview,
  } = useCloudIdeStore();

  const [query, setQuery] = useState('');
  const modalRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      }
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setCommandPaletteOpen(false);
      }
    };

    if (isCommandPaletteOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const commands: CommandItem[] = [
    {
      id: 'run',
      title: 'Run Program in Isolated Sandbox',
      category: 'Execution',
      icon: Play,
      action: () => runCode(),
      shortcut: 'Ctrl+Enter',
    },
    {
      id: 'ai-explain',
      title: 'AI: Explain Architecture & Code',
      category: 'AI Assistant',
      icon: Sparkles,
      action: () => runAiAssist('explain'),
    },
    {
      id: 'ai-fix',
      title: 'AI: Diagnose and Fix Runtime Errors',
      category: 'AI Assistant',
      icon: Sparkles,
      action: () => runAiAssist('fix'),
    },
    {
      id: 'ai-refactor',
      title: 'AI: Refactor Clean Code',
      category: 'AI Assistant',
      icon: Sparkles,
      action: () => runAiAssist('refactor'),
    },
    {
      id: 'ai-test',
      title: 'AI: Generate Automated Unit Tests',
      category: 'AI Assistant',
      icon: Sparkles,
      action: () => runAiAssist('test'),
    },
    {
      id: 'debug-start',
      title: 'Debug: Start Runtime Inspector',
      category: 'Debugger',
      icon: Bug,
      action: () => startDebugger(),
    },
    {
      id: 'nav-converter',
      title: 'Open Code Converter Studio',
      category: 'Tools',
      icon: ArrowRightLeft,
      action: () => setActiveActivityPanel('converter'),
    },
    {
      id: 'nav-config',
      title: 'Open Config Editor Studio (JSON/YAML/K8s)',
      category: 'Tools',
      icon: Sliders,
      action: () => setActiveActivityPanel('config'),
    },
    {
      id: 'modal-history',
      title: 'View Version History & Snapshots',
      category: 'Workspace',
      icon: History,
      action: () => setVersionModalOpen(true),
    },
    {
      id: 'modal-share',
      title: 'Share Workspace or Export ZIP',
      category: 'Workspace',
      icon: Share2,
      action: () => setShareModalOpen(true),
    },
    {
      id: 'modal-settings',
      title: 'Open Editor & Theme Settings',
      category: 'Preferences',
      icon: Settings,
      action: () => setSettingsModalOpen(true),
    },
    {
      id: 'toggle-terminal',
      title: 'Toggle Integrated Terminal Panel',
      category: 'View',
      icon: Terminal,
      action: () => toggleBottomPanel(),
    },
    {
      id: 'toggle-golive',
      title: 'Toggle Go Live Browser Sandbox (Port 3000)',
      category: 'Frontend & Preview',
      icon: Globe,
      action: () => toggleLivePreview(),
    },
    // Add language template switchers
    ...LANGUAGE_TEMPLATES.map((tpl) => ({
      id: `lang-${tpl.id}`,
      title: `Switch Language: ${tpl.name} (${tpl.version})`,
      category: 'Languages',
      icon: FileCode,
      action: () => setLanguage(tpl.id),
    })),
  ];

  const filteredCommands = commands.filter(
    (c) =>
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.category.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) setCommandPaletteOpen(false);
      }}
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-100 select-none cursor-pointer"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh] cursor-default"
      >
        {/* Search Bar */}
        <div className="p-3 border-b border-slate-800 flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Type a command or search actions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none"
            autoFocus
          />
          <kbd className="px-2 py-0.5 bg-slate-800 rounded text-[10px] text-slate-400 border border-slate-700 font-mono">
            ESC
          </kbd>
        </div>

        {/* Command Results */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredCommands.map((cmd) => {
            const Icon = cmd.icon;
            return (
              <button
                key={cmd.id}
                onClick={() => {
                  cmd.action();
                  setCommandPaletteOpen(false);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-indigo-600/20 hover:border-indigo-500/30 border border-transparent text-left text-xs transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1 rounded-lg bg-slate-800 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-200 group-hover:text-white">
                      {cmd.title}
                    </span>
                    <span className="ml-2 text-[10px] text-slate-400">[{cmd.category}]</span>
                  </div>
                </div>
                {cmd.shortcut && (
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    {cmd.shortcut}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
