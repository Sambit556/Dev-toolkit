'use client';

import React from 'react';
import { Settings, X, Palette, Type, Sliders, Check } from 'lucide-react';
import { useCloudIdeStore } from '../../store/useCloudIdeStore';

const THEMES = [
  { id: 'vs-dark', name: 'VS Code Dark Modern' },
  { id: 'tokyo-night', name: 'Tokyo Night' },
  { id: 'oled-black', name: 'OLED Pure Black' },
  { id: 'vs-light', name: 'VS Code Light' },
  { id: 'hc-black', name: 'High Contrast' },
];

const FONTS = [
  'Fira Code, monospace',
  'JetBrains Mono, monospace',
  'Cascadia Code, monospace',
  'Source Code Pro, monospace',
  'Menlo, monospace',
];

export const SettingsModal: React.FC = () => {
  const { isSettingsModalOpen, setSettingsModalOpen, settings, updateSettings } =
    useCloudIdeStore();

  if (!isSettingsModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">Editor & IDE Preferences</h2>
              <p className="text-xs text-slate-400">Themes, typography, and editor behaviors</p>
            </div>
          </div>
          <button
            onClick={() => setSettingsModalOpen(false)}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
          {/* Themes */}
          <div className="space-y-2">
            <label className="font-bold text-slate-200 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-indigo-400" />
              Editor Color Theme
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => updateSettings({ theme: theme.id })}
                  className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors ${
                    settings.theme === theme.id
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-semibold'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="truncate">{theme.name}</span>
                  {settings.theme === theme.id && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Typography */}
          <div className="space-y-2">
            <label className="font-bold text-slate-200 flex items-center gap-1.5">
              <Type className="w-4 h-4 text-cyan-400" />
              Font Family
            </label>
            <select
              value={settings.fontFamily}
              onChange={(e) => updateSettings({ fontFamily: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              {FONTS.map((f) => (
                <option key={f} value={f}>
                  {f.split(',')[0]}
                </option>
              ))}
            </select>
          </div>

          {/* Sizing & Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex justify-between font-semibold text-slate-300">
                <span>Font Size</span>
                <span className="text-indigo-400">{settings.fontSize}px</span>
              </div>
              <input
                type="range"
                min={11}
                max={22}
                value={settings.fontSize}
                onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between font-semibold text-slate-300">
                <span>Tab Spacing</span>
                <span className="text-indigo-400">{settings.tabSize} spaces</span>
              </div>
              <select
                value={settings.tabSize}
                onChange={(e) => updateSettings({ tabSize: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value={2}>2 Spaces</option>
                <option value={4}>4 Spaces</option>
              </select>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between p-2 bg-slate-800/40 rounded-xl">
              <div>
                <div className="font-semibold text-slate-200">Minimap Preview</div>
                <div className="text-[10px] text-slate-400">Show bird's eye code outline on right</div>
              </div>
              <input
                type="checkbox"
                checked={settings.minimap}
                onChange={(e) => updateSettings({ minimap: e.target.checked })}
                className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-2 bg-slate-800/40 rounded-xl">
              <div>
                <div className="font-semibold text-slate-200">Word Wrap</div>
                <div className="text-[10px] text-slate-400">Wrap long lines to fit editor viewport</div>
              </div>
              <input
                type="checkbox"
                checked={settings.wordWrap === 'on'}
                onChange={(e) => updateSettings({ wordWrap: e.target.checked ? 'on' : 'off' })}
                className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-2 bg-slate-800/40 rounded-xl">
              <div>
                <div className="font-semibold text-slate-200">Bracket Pair Colorization</div>
                <div className="text-[10px] text-slate-400">Match nested parentheses & brackets with colors</div>
              </div>
              <input
                type="checkbox"
                checked={settings.bracketPairColorization}
                onChange={(e) => updateSettings({ bracketPairColorization: e.target.checked })}
                className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
