'use client';

import React, { useState } from 'react';
import { Search, Replace, CaseSensitive, Regex, Check } from 'lucide-react';
import { useCloudIdeStore } from '../../store/useCloudIdeStore';

export const GlobalSearch: React.FC = () => {
  const { files, selectFile, updateFileContent } = useCloudIdeStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [isRegex, setIsRegex] = useState(false);
  const [isReplaceOpen, setIsReplaceOpen] = useState(false);

  const getMatches = () => {
    if (!searchQuery) return [];
    const results: Array<{ file: string; line: number; text: string; fullContent: string }> = [];

    files.forEach((f) => {
      const lines = f.content.split('\n');
      lines.forEach((line, idx) => {
        let isMatch = false;
        if (isRegex) {
          try {
            const regex = new RegExp(searchQuery, matchCase ? 'g' : 'gi');
            isMatch = regex.test(line);
          } catch {
            isMatch = false;
          }
        } else {
          isMatch = matchCase
            ? line.includes(searchQuery)
            : line.toLowerCase().includes(searchQuery.toLowerCase());
        }

        if (isMatch) {
          results.push({
            file: f.name,
            line: idx + 1,
            text: line.trim(),
            fullContent: f.content,
          });
        }
      });
    });

    return results;
  };

  const matches = getMatches();

  const handleReplaceAll = () => {
    if (!searchQuery) return;
    files.forEach((f) => {
      let newContent = f.content;
      if (isRegex) {
        try {
          const regex = new RegExp(searchQuery, matchCase ? 'g' : 'gi');
          newContent = newContent.replace(regex, replaceQuery);
        } catch {}
      } else {
        const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), matchCase ? 'g' : 'gi');
        newContent = newContent.replace(regex, replaceQuery);
      }
      if (newContent !== f.content) {
        updateFileContent(f.name, newContent);
      }
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60 text-slate-200 select-none text-sm p-3">
      <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">Search Workspace</div>

      {/* Search Input Box */}
      <div className="space-y-2">
        <div className="relative flex items-center bg-slate-800/80 border border-slate-700/80 rounded-lg px-2 py-1.5 focus-within:border-indigo-500">
          <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search across all files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-400 focus:outline-none"
          />
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setMatchCase(!matchCase)}
              title="Match Case"
              className={`p-1 rounded text-xs ${matchCase ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <CaseSensitive className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsRegex(!isRegex)}
              title="Use Regular Expression"
              className={`p-1 rounded text-xs ${isRegex ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Regex className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Toggle Replace */}
        <button
          onClick={() => setIsReplaceOpen(!isReplaceOpen)}
          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
        >
          <Replace className="w-3.5 h-3.5" />
          <span>{isReplaceOpen ? 'Hide Replace' : 'Toggle Replace'}</span>
        </button>

        {/* Replace Input Box */}
        {isReplaceOpen && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center bg-slate-800/80 border border-slate-700/80 rounded-lg px-2 py-1.5 focus-within:border-indigo-500">
              <input
                type="text"
                placeholder="Replace with..."
                value={replaceQuery}
                onChange={(e) => setReplaceQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-400 focus:outline-none"
              />
            </div>
            <button
              onClick={handleReplaceAll}
              disabled={matches.length === 0}
              className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Replace All ({matches.length} matches)</span>
            </button>
          </div>
        )}
      </div>

      {/* Results Header */}
      <div className="text-xs text-slate-400 mt-4 mb-2">
        {searchQuery ? `${matches.length} results found` : 'Type a query to search'}
      </div>

      {/* Results List */}
      <div className="flex-1 overflow-y-auto space-y-1">
        {matches.map((m, idx) => (
          <div
            key={idx}
            onClick={() => selectFile(m.file)}
            className="p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800/80 cursor-pointer transition-colors border border-slate-800"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-indigo-400 mb-1">
              <span>{m.file}</span>
              <span className="text-[10px] text-slate-400">Line {m.line}</span>
            </div>
            <p className="text-xs text-slate-300 font-mono truncate">{m.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
