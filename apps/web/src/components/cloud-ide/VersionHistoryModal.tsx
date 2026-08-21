'use client';

import React from 'react';
import {
  History,
  X,
  RotateCcw,
  Clock,
  FileCode,
  Check,
  Camera,
} from 'lucide-react';
import { useCloudIdeStore } from '../../store/useCloudIdeStore';

export const VersionHistoryModal: React.FC = () => {
  const {
    isVersionModalOpen,
    setVersionModalOpen,
    snapshots,
    restoreSnapshot,
    createSnapshot,
  } = useCloudIdeStore();

  const [snapshotMsg, setSnapshotMsg] = React.useState('');
  const modalRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVersionModalOpen) {
        setVersionModalOpen(false);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setVersionModalOpen(false);
      }
    };

    if (isVersionModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVersionModalOpen, setVersionModalOpen]);

  if (!isVersionModalOpen) return null;

  const handleManualSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    if (snapshotMsg.trim()) {
      createSnapshot(snapshotMsg.trim());
      setSnapshotMsg('');
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) setVersionModalOpen(false);
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none cursor-pointer"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">Version History & Checkpoints</h2>
              <p className="text-xs text-slate-400">Restore or rollback to any previous workspace state</p>
            </div>
          </div>
          <button
            onClick={() => setVersionModalOpen(false)}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Create Checkpoint Bar */}
        <form onSubmit={handleManualSnapshot} className="p-4 bg-slate-950/60 border-b border-slate-800 flex gap-2">
          <input
            type="text"
            placeholder="Checkpoint message (e.g. before major refactoring)..."
            value={snapshotMsg}
            onChange={(e) => setSnapshotMsg(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={!snapshotMsg.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Camera className="w-4 h-4" />
            <span>Create Snapshot</span>
          </button>
        </form>

        {/* Timeline List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {snapshots.map((snap, idx) => (
            <div
              key={snap.id}
              className="p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-xl hover:border-indigo-500/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-white">{snap.message}</span>
                  {idx === 0 && (
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/30">
                      CURRENT
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1" suppressHydrationWarning>
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(snap.timestamp).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileCode className="w-3.5 h-3.5" />
                    {snap.files.length} files ({snap.language})
                  </span>
                </div>
              </div>

              {idx !== 0 && (
                <button
                  onClick={() => {
                    restoreSnapshot(snap.id);
                    setVersionModalOpen(false);
                  }}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-indigo-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors self-start sm:self-center"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Snapshot</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
