'use client';

import React from 'react';
import {
  Files,
  Search,
  GitBranch,
  Bug,
  Sparkles,
  ArrowRightLeft,
  Sliders,
  Settings,
  History,
  Share2,
  Terminal,
  Globe,
} from 'lucide-react';
import { useCloudIdeStore, ActivityPanel } from '../../store/useCloudIdeStore';

interface NavItem {
  id: ActivityPanel;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
  disabled?: boolean;
}

export const ActivityBar: React.FC = () => {
  const {
    activeActivityPanel,
    setActiveActivityPanel,
    isSidebarOpen,
    toggleSidebar,
    diagnostics,
    breakpoints,
    setShareModalOpen,
    setSettingsModalOpen,
    setVersionModalOpen,
    toggleBottomPanel,
    isBottomPanelOpen,
    isLivePreviewOpen,
    toggleLivePreview,
  } = useCloudIdeStore();

  const navItems: NavItem[] = [
    { id: 'explorer', label: 'Project Explorer', icon: Files },
    { id: 'search', label: 'Search Workspace', icon: Search },
    { id: 'git', label: 'Source Control (Git) - Disabled', icon: GitBranch, disabled: true },
    { id: 'debug', label: 'Debugger & Breakpoints', icon: Bug, badge: breakpoints.length > 0 ? breakpoints.length : undefined },
    { id: 'ai', label: 'AI Coding Workspace', icon: Sparkles, badge: diagnostics.hasError ? '!' : undefined },
    { id: 'converter', label: 'Code Converter Studio', icon: ArrowRightLeft },
    { id: 'config', label: 'Config Editor Studio', icon: Sliders },
  ];

  const handlePanelClick = (id: ActivityPanel, disabled?: boolean) => {
    if (disabled) return;
    if (activeActivityPanel === id && isSidebarOpen) {
      toggleSidebar(false);
    } else {
      setActiveActivityPanel(id);
      if (!isSidebarOpen) toggleSidebar(true);
    }
  };

  return (
    <aside className="w-14 bg-black border-r border-neutral-800 flex flex-col justify-between items-center py-3 select-none z-20 shrink-0">
      {/* Top Nav Icons */}
      <div className="flex flex-col items-center gap-1.5 w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeActivityPanel === item.id && isSidebarOpen && !item.disabled;

          return (
            <button
              key={item.id}
              disabled={item.disabled}
              onClick={() => handlePanelClick(item.id, item.disabled)}
              title={item.disabled ? `${item.label} in Cloud Sandbox` : item.label}
              className={`relative p-2.5 rounded-xl transition-all duration-150 group flex items-center justify-center ${
                item.disabled
                  ? 'opacity-25 cursor-not-allowed text-neutral-500 hover:bg-transparent'
                  : isActive
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 shadow-sm shadow-indigo-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform duration-150 ${item.disabled ? '' : isActive ? 'scale-110' : 'group-hover:scale-105'}`} />

              {/* Active indicator bar */}
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-indigo-500 rounded-r shadow-sm shadow-indigo-400" />
              )}

              {/* Badge */}
              {!item.disabled && item.badge !== undefined && (
                <span
                  className={`absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
                    item.badge === '!'
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-indigo-500 text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Utility Icons */}
      <div className="flex flex-col items-center gap-1.5 w-full pt-3 border-t border-slate-800/60">
        <button
          onClick={() => toggleLivePreview()}
          title={isLivePreviewOpen ? 'Hide Go Live Browser Preview' : 'Open Go Live Browser Preview'}
          className={`p-2.5 rounded-xl transition-colors ${
            isLivePreviewOpen
              ? 'text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Globe className="w-5 h-5" />
        </button>

        <button
          onClick={() => toggleBottomPanel()}
          title={isBottomPanelOpen ? 'Hide Terminal / Output' : 'Show Terminal / Output'}
          className={`p-2.5 rounded-xl transition-colors ${
            isBottomPanelOpen
              ? 'text-emerald-400 bg-emerald-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Terminal className="w-5 h-5" />
        </button>

        <button
          onClick={() => setVersionModalOpen(true)}
          title="Version History & Snapshots"
          className="p-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
        >
          <History className="w-5 h-5" />
        </button>

        <button
          onClick={() => setShareModalOpen(true)}
          title="Share Project / Export ZIP"
          className="p-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
        >
          <Share2 className="w-5 h-5" />
        </button>

        <button
          onClick={() => setSettingsModalOpen(true)}
          title="IDE & Editor Settings"
          className="p-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
};
