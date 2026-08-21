'use client';

import React from 'react';
import { RotateCcw, AlertTriangle, X, Sparkles, Trash2, ShieldAlert } from 'lucide-react';
import { useCloudIdeStore } from '../../store/useCloudIdeStore';

interface ResetWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResetWorkspaceModal: React.FC<ResetWorkspaceModalProps> = ({ isOpen, onClose }) => {
  const { resetEntireWorkspaceToBrandNew } = useCloudIdeStore();

  if (!isOpen) return null;

  const handleConfirmReset = () => {
    resetEntireWorkspaceToBrandNew();
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150 select-none cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-950 border border-purple-500/30 rounded-2xl shadow-2xl shadow-purple-950/40 overflow-hidden cursor-default animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-start justify-between bg-purple-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-md shadow-purple-600/20">
              <RotateCcw className="w-5 h-5 animate-spin-hover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">Reset Workspace</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full font-mono">
                  Brand New User
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">Start completely fresh from default state</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Are you sure you want to reset your workspace? This will clear all changes and restore the Cloud IDE back to its brand-new initial state.
          </p>

          <div className="bg-black/60 rounded-xl p-3.5 border border-neutral-800 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>Restores default <strong>TypeScript</strong> starter project</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Trash2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>Clears all custom files, edits, tabs & terminal logs</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Wipes local browser storage cache</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-950/20 border border-amber-500/30 text-[11px] text-amber-300/90">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>This action is immediate and cannot be undone.</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmReset}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Yes, Reset Everything</span>
          </button>
        </div>
      </div>
    </div>
  );
};
