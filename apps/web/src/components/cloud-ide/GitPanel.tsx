'use client';

import React, { useState } from 'react';
import {
  GitBranch,
  GitCommit,
  GitPullRequest,
  Check,
  Plus,
  Minus,
  RotateCcw,
  Clock,
  User,
} from 'lucide-react';
import { useCloudIdeStore } from '../../store/useCloudIdeStore';

export const GitPanel: React.FC = () => {
  const {
    files,
    stagedFiles,
    stageFile,
    unstageFile,
    commitHistory,
    createCommit,
    currentBranch,
    createBranch,
  } = useCloudIdeStore();

  const [commitMessage, setCommitMessage] = useState('');
  const [newBranchInput, setNewBranchInput] = useState('');
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);

  const unstagedFiles = files
    .filter((f) => !f.name.endsWith('/.gitkeep'))
    .map((f) => f.name)
    .filter((name) => !stagedFiles.includes(name));

  const handleCommitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commitMessage.trim()) {
      createCommit(commitMessage.trim());
      setCommitMessage('');
    }
  };

  const handleStageAll = () => {
    unstagedFiles.forEach((f) => stageFile(f));
  };

  const handleUnstageAll = () => {
    stagedFiles.forEach((f) => unstageFile(f));
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60 text-slate-200 select-none text-sm p-3">
      {/* Header & Branch Switcher */}
      <div className="border-b border-slate-800/80 pb-2 mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-orange-600/20 text-orange-400 border border-orange-500/30">
              <GitBranch className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-white">Source Control (Git)</h3>
              <p className="text-[10px] text-slate-400">Branch: {currentBranch}</p>
            </div>
          </div>
          <button
            onClick={() => setIsCreatingBranch(!isCreatingBranch)}
            className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Branch</span>
          </button>
        </div>

        {isCreatingBranch && (
          <div className="flex items-center gap-1 mt-2">
            <input
              type="text"
              placeholder="feature/new-branch..."
              value={newBranchInput}
              onChange={(e) => setNewBranchInput(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none"
            />
            <button
              onClick={() => {
                if (newBranchInput.trim()) {
                  createBranch(newBranchInput.trim());
                  setNewBranchInput('');
                  setIsCreatingBranch(false);
                }
              }}
              className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold"
            >
              Create
            </button>
          </div>
        )}
      </div>

      {/* Commit Input Box */}
      <form onSubmit={handleCommitSubmit} className="space-y-2 mb-3">
        <textarea
          rows={2}
          placeholder="Commit message (e.g. feat: add isolated execution pipeline)..."
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 resize-none"
        />
        <button
          type="submit"
          disabled={!commitMessage.trim()}
          className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-600/30 transition-all"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Commit ({stagedFiles.length || unstagedFiles.length} files)</span>
        </button>
      </form>

      <div className="flex-1 overflow-y-auto space-y-3">
        {/* Staged Changes */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
            <span>Staged Changes ({stagedFiles.length})</span>
            {stagedFiles.length > 0 && (
              <button onClick={handleUnstageAll} className="text-[11px] text-slate-400 hover:text-slate-200">
                Unstage All
              </button>
            )}
          </div>
          {stagedFiles.length > 0 ? (
            <div className="space-y-1">
              {stagedFiles.map((file) => (
                <div key={file} className="flex items-center justify-between p-1.5 bg-slate-900/60 rounded text-xs">
                  <span className="text-emerald-400 truncate">{file}</span>
                  <button
                    onClick={() => unstageFile(file)}
                    className="p-0.5 hover:text-rose-400 text-slate-400 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-400">No staged files.</p>
          )}
        </div>

        {/* Changes (Working Tree) */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
            <span>Changes ({unstagedFiles.length})</span>
            {unstagedFiles.length > 0 && (
              <button onClick={handleStageAll} className="text-[11px] text-indigo-400 hover:text-indigo-300">
                Stage All
              </button>
            )}
          </div>
          <div className="space-y-1">
            {unstagedFiles.map((file) => (
              <div key={file} className="flex items-center justify-between p-1.5 bg-slate-900/60 rounded text-xs">
                <span className="text-amber-400 truncate">{file}</span>
                <button
                  onClick={() => stageFile(file)}
                  className="p-0.5 hover:text-emerald-400 text-slate-400 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Commit Log History */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5">
          <div className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Commit History</span>
          </div>
          <div className="space-y-2">
            {commitHistory.map((c) => (
              <div key={c.id} className="p-2 bg-slate-900/80 rounded-lg text-xs space-y-1">
                <div className="flex items-center justify-between font-semibold text-slate-200">
                  <span className="truncate">{c.message}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{c.id.substring(0, 7)}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {c.author}
                  </span>
                  <span suppressHydrationWarning>{new Date(c.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
