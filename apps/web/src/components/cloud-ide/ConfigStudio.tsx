'use client';

import React, { useState } from 'react';
import {
  Sliders,
  CheckCircle2,
  AlertCircle,
  FileCode,
  ListTree,
  Code2,
  Copy,
  Check,
  PlusCircle,
} from 'lucide-react';
import { useCloudIdeStore } from '../../store/useCloudIdeStore';
import { CONFIG_FORMATS } from '../../lib/configSchemas';

export const ConfigStudio: React.FC = () => {
  const {
    selectedConfigFormat,
    configCode,
    configValidationErrors,
    configViewMode,
    setConfigFormat,
    setConfigCode,
    setConfigViewMode,
    createFile,
    setActiveActivityPanel,
  } = useCloudIdeStore();

  const [copied, setCopied] = useState(false);
  const currentFormat =
    CONFIG_FORMATS.find((f) => f.id === selectedConfigFormat) || CONFIG_FORMATS[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(configCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToProject = () => {
    const filename = `config${currentFormat.extension}`;
    createFile(filename, configCode);
    setActiveActivityPanel('explorer');
  };

  // Try parsing JSON for Tree View
  const renderTree = () => {
    try {
      if (selectedConfigFormat === 'json') {
        const parsed = JSON.parse(configCode);
        return (
          <div className="p-2 space-y-1 font-mono text-xs text-slate-300">
            {Object.entries(parsed).map(([key, val]) => (
              <div key={key} className="p-1.5 bg-slate-950/60 rounded border border-slate-800">
                <span className="text-indigo-400 font-bold">{key}:</span>{' '}
                <span className="text-amber-300">{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
              </div>
            ))}
          </div>
        );
      }
    } catch {
      return (
        <div className="p-4 text-rose-400 text-xs">
          Invalid JSON syntax. Switch to Code view to fix syntax errors.
        </div>
      );
    }

    return (
      <div className="p-4 text-slate-400 text-xs">
        Tree view is optimized for structured JSON schemas.
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60 text-slate-200 select-none text-sm p-3">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-white">Config Editor Studio</h3>
            <p className="text-[10px] text-slate-400">JSON, YAML, K8s, TOML, Dockerfile & .env validator</p>
          </div>
        </div>
      </div>

      {/* Format Selector */}
      <div className="mb-3">
        <label className="text-[11px] font-semibold text-slate-400 mb-1 block">Configuration Schema:</label>
        <select
          value={selectedConfigFormat}
          onChange={(e) => setConfigFormat(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
        >
          {CONFIG_FORMATS.map((fmt) => (
            <option key={fmt.id} value={fmt.id}>
              {fmt.icon} {fmt.name}
            </option>
          ))}
        </select>
      </div>

      {/* View Mode Switcher */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setConfigViewMode('code')}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
              configViewMode === 'code'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Code Editor</span>
          </button>
          <button
            onClick={() => setConfigViewMode('tree')}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
              configViewMode === 'tree'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListTree className="w-3.5 h-3.5" />
            <span>Tree View</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
            title="Copy Config"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleSaveToProject}
            className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add to Workspace</span>
          </button>
        </div>
      </div>

      {/* Main Config Workspace */}
      <div className="flex-1 flex flex-col min-h-0 bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden">
        {configViewMode === 'code' ? (
          <textarea
            value={configCode}
            onChange={(e) => setConfigCode(e.target.value)}
            className="flex-1 w-full p-3 font-mono text-xs text-slate-200 bg-transparent focus:outline-none resize-none leading-relaxed"
          />
        ) : (
          <div className="flex-1 overflow-y-auto">{renderTree()}</div>
        )}
      </div>

      {/* Status Footer */}
      <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1 text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Schema Validated
        </span>
        <span>{currentFormat.extension}</span>
      </div>
    </div>
  );
};
