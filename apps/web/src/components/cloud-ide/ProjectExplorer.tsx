'use client';

import React, { useState } from 'react';
import {
  FilePlus,
  FolderPlus,
  Download,
  Upload,
  Trash2,
  Copy,
  Edit2,
  FileCode,
  FileText,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Sparkles,
  Code2,
  History,
  Maximize2,
  Minimize2,
  Plus,
  Clock,
  RotateCcw,
  Check,
  Lock,
  GitFork,
} from 'lucide-react';
import { useCloudIdeStore } from '../../store/useCloudIdeStore';
import { LANGUAGE_TEMPLATES } from '../../lib/templates';
import JSZip from 'jszip';

export const ProjectExplorer: React.FC = () => {
  const {
    files,
    activeFile,
    selectFile,
    createFile,
    createFolder,
    renameFile,
    deleteFile,
    duplicateFile,
    currentLanguage,
    setLanguage,
    snapshots,
    restoreSnapshot,
    createSnapshot,
    isReadOnlyWorkspace,
    forkWorkspace,
  } = useCloudIdeStore();

  const [isTimelineOpen, setIsTimelineOpen] = useState(true);
  const [timelineHeight, setTimelineHeight] = useState(160);
  const [isDraggingTimeline, setIsDraggingTimeline] = useState(false);
  const [newSnapshotInput, setNewSnapshotInput] = useState('');
  const [isAddingSnapshot, setIsAddingSnapshot] = useState(false);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingTimeline) {
        const newHeight = Math.max(70, Math.min(420, window.innerHeight - e.clientY - 38));
        setTimelineHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingTimeline(false);
    };

    if (isDraggingTimeline) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'row-resize';
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
  }, [isDraggingTimeline]);

  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [langSearch, setLangSearch] = useState('');
  const langDropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    };
    if (isLangDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isLangDropdownOpen]);

  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const currentTemplate =
    LANGUAGE_TEMPLATES.find((t) => t.id === currentLanguage) || LANGUAGE_TEMPLATES[0];

  const filteredTemplates = LANGUAGE_TEMPLATES.filter((t) =>
    t.name.toLowerCase().includes(langSearch.toLowerCase()) ||
    t.category.toLowerCase().includes(langSearch.toLowerCase())
  );

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.ts') || fileName.endsWith('.tsx')) return <span className="text-blue-400 font-bold text-xs">TS</span>;
    if (fileName.endsWith('.js') || fileName.endsWith('.jsx')) return <span className="text-amber-400 font-bold text-xs">JS</span>;
    if (fileName.endsWith('.py')) return <span className="text-emerald-400 font-bold text-xs">PY</span>;
    if (fileName.endsWith('.go')) return <span className="text-cyan-400 font-bold text-xs">GO</span>;
    if (fileName.endsWith('.rs')) return <span className="text-orange-400 font-bold text-xs">RS</span>;
    if (fileName.endsWith('.cpp') || fileName.endsWith('.h')) return <span className="text-blue-500 font-bold text-xs">C++</span>;
    if (fileName.endsWith('.java')) return <span className="text-red-400 font-bold text-xs">JV</span>;
    if (fileName.endsWith('.sql')) return <span className="text-indigo-400 font-bold text-xs">SQL</span>;
    if (fileName.endsWith('.json')) return <span className="text-amber-300 font-bold text-xs">{"{}"}</span>;
    if (fileName.endsWith('.md')) return <FileText className="w-4 h-4 text-slate-400" />;
    return <FileCode className="w-4 h-4 text-slate-400" />;
  };

  const handleCreateFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFileName.trim()) {
      createFile(newFileName.trim());
      setNewFileName('');
      setIsCreatingFile(false);
    }
  };

  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFileName.trim()) {
      createFolder(newFileName.trim());
      setNewFileName('');
      setIsCreatingFolder(false);
    }
  };

  const handleRenameSubmit = (oldName: string) => {
    if (renameValue.trim() && renameValue !== oldName) {
      renameFile(oldName, renameValue.trim());
    }
    setEditingFile(null);
  };

  const handleExportZip = async () => {
    const zip = new JSZip();
    files.forEach((f) => {
      if (!f.name.endsWith('/.gitkeep')) {
        zip.file(f.name, f.content);
      }
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devkits-${currentLanguage}-project.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportZip = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      if (buffer) {
        const zip = await JSZip.loadAsync(buffer);
        zip.forEach(async (relativePath, zipEntry) => {
          if (!zipEntry.dir) {
            const content = await zipEntry.async('string');
            createFile(relativePath, content);
          }
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="flex flex-col h-full bg-black text-slate-200 select-none text-sm">
      {/* Header & Language Switcher */}
      <div className="p-3 border-b border-neutral-800">
        <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2 flex items-center justify-between">
          <span>Language Runtime</span>
          <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
            {currentTemplate.version}
          </span>
        </div>

        {/* Language Selector Dropdown */}
        <div className="relative" ref={langDropdownRef}>
          <button
            onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-2 bg-neutral-900 hover:bg-neutral-800 rounded-xl border border-neutral-800 text-left transition-colors"
          >
            <div className="flex items-center gap-2 truncate">
              <span className="text-base">{currentTemplate.icon}</span>
              <span className="font-semibold text-slate-200">{currentTemplate.name}</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isLangDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl z-50 p-2 max-h-72 overflow-y-auto">
              <input
                type="text"
                placeholder="Search 15+ languages..."
                value={langSearch}
                onChange={(e) => setLangSearch(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-400 mb-2 focus:outline-none focus:border-indigo-500"
                autoFocus
              />
              <div className="space-y-1">
                {filteredTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => {
                      setLanguage(template.id);
                      setIsLangDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-xs transition-colors ${
                      currentLanguage === template.id
                        ? 'bg-indigo-600 text-white font-medium'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{template.icon}</span>
                      <span>{template.name}</span>
                    </div>
                    <span className="text-[10px] opacity-70">{template.category}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Explorer Actions Bar */}
      <div className="px-3 py-2 flex items-center justify-between border-b border-slate-800/60 text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Project Files</span>
          {isReadOnlyWorkspace && (
            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-bold flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" />
              Locked
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isReadOnlyWorkspace ? (
            <button
              onClick={forkWorkspace}
              title="Fork to Edit Files"
              className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 transition-colors"
            >
              <GitFork className="w-3 h-3" />
              <span>Fork</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  setIsCreatingFile(true);
                  setIsCreatingFolder(false);
                }}
                title="New File"
                className="p-1 hover:text-indigo-400 hover:bg-slate-800 rounded transition-colors"
              >
                <FilePlus className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setIsCreatingFolder(true);
                  setIsCreatingFile(false);
                }}
                title="New Folder"
                className="p-1 hover:text-indigo-400 hover:bg-slate-800 rounded transition-colors"
              >
                <FolderPlus className="w-4 h-4" />
              </button>
              <label
                title="Upload Files / ZIP"
                className="p-1 hover:text-indigo-400 hover:bg-slate-800 rounded cursor-pointer transition-colors"
              >
                <Upload className="w-4 h-4" />
                <input type="file" onChange={handleImportZip} className="hidden" accept=".zip,.js,.ts,.py,.go,.rs,.json" />
              </label>
            </>
          )}
          <button
            onClick={handleExportZip}
            title="Download Project ZIP"
            className="p-1 hover:text-indigo-400 hover:bg-slate-800 rounded transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* New File / Folder Input */}
      {(isCreatingFile || isCreatingFolder) && (
        <form
          onSubmit={isCreatingFile ? handleCreateFileSubmit : handleCreateFolderSubmit}
          className="p-2 border-b border-indigo-500/30 bg-indigo-950/20"
        >
          <input
            type="text"
            placeholder={isCreatingFile ? 'filename.ts' : 'foldername'}
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            className="w-full bg-slate-800 border border-indigo-500/50 rounded px-2 py-1 text-xs text-white focus:outline-none"
            autoFocus
            onBlur={() => {
              setIsCreatingFile(false);
              setIsCreatingFolder(false);
            }}
          />
        </form>
      )}

      {/* File Tree List */}
      <div className="flex-1 overflow-y-auto py-1 space-y-0.5">
        {files.map((file) => {
          if (file.name.endsWith('/.gitkeep')) {
            const folderName = file.name.replace('/.gitkeep', '');
            return (
              <div key={file.name} className="px-3 py-1 text-slate-400 flex items-center gap-2 text-xs">
                <FolderOpen className="w-4 h-4 text-amber-400" />
                <span>{folderName}</span>
              </div>
            );
          }

          const isActive = activeFile === file.name;
          const isEditing = editingFile === file.name;

          return (
            <div
              key={file.name}
              onClick={() => !isEditing && selectFile(file.name)}
              className={`group flex items-center justify-between px-3 py-1.5 cursor-pointer text-xs transition-colors ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-200 font-medium border-l-2 border-indigo-500'
                  : 'hover:bg-slate-800/60 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 truncate flex-1 mr-2">
                <span className="shrink-0">{getFileIcon(file.name)}</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameSubmit(file.name);
                      if (e.key === 'Escape') setEditingFile(null);
                    }}
                    onBlur={() => handleRenameSubmit(file.name)}
                    autoFocus
                    className="bg-slate-800 text-white px-1 py-0.5 rounded text-xs w-full outline-none border border-indigo-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="truncate">{file.name}</span>
                )}
              </div>

              {/* Action Buttons on Hover */}
              {!isEditing && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingFile(file.name);
                      setRenameValue(file.name);
                    }}
                    title="Rename"
                    className="p-1 hover:text-slate-100"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateFile(file.name);
                    }}
                    title="Duplicate"
                    className="p-1 hover:text-slate-100"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  {files.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFile(file.name);
                      }}
                      title="Delete"
                      className="p-1 hover:text-rose-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Draggable Timeline Top Resizer Handle */}
      {isTimelineOpen && (
        <div
          onMouseDown={() => setIsDraggingTimeline(true)}
          className="h-1.5 hover:h-2 hover:bg-indigo-500 cursor-row-resize transition-all bg-neutral-900 border-t border-neutral-800 z-20 shrink-0 select-none group flex items-center justify-center"
          title="Drag to resize Timeline height"
        >
          <div className="h-0.5 w-10 rounded-full bg-neutral-600 group-hover:bg-indigo-400 transition-colors" />
        </div>
      )}

      {/* VS Code Style Timeline Section */}
      <div
        style={{ height: isTimelineOpen ? `${timelineHeight}px` : '32px' }}
        className="bg-slate-950/60 flex flex-col shrink-0 overflow-hidden border-t border-slate-800/80"
      >
        {/* Timeline Section Header */}
        <div
          onClick={() => setIsTimelineOpen(!isTimelineOpen)}
          className="h-8 px-3 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 text-slate-400 select-none text-[11px] font-bold uppercase tracking-wider shrink-0"
        >
          <div className="flex items-center gap-1.5 text-slate-300">
            {isTimelineOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
            <History className="w-3.5 h-3.5 text-indigo-400" />
            <span>Timeline</span>
            <span className="text-[10px] text-slate-400 font-normal">({snapshots.length})</span>
          </div>

          <div className="flex items-center gap-1 opacity-80 hover:opacity-100" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsAddingSnapshot(!isAddingSnapshot)}
              title="Create Checkpoint Snapshot"
              className="p-1 hover:text-indigo-400 hover:bg-slate-800 rounded transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Timeline Content */}
        {isTimelineOpen && (
          <div className="flex-1 flex flex-col overflow-hidden px-2 pb-2">
            {isAddingSnapshot && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newSnapshotInput.trim()) {
                    createSnapshot(newSnapshotInput.trim());
                    setNewSnapshotInput('');
                    setIsAddingSnapshot(false);
                  }
                }}
                className="mb-2 flex items-center gap-1"
              >
                <input
                  type="text"
                  placeholder="Snapshot name..."
                  value={newSnapshotInput}
                  onChange={(e) => setNewSnapshotInput(e.target.value)}
                  className="flex-1 bg-slate-900 border border-indigo-500/60 rounded px-2 py-0.5 text-xs text-white focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] font-bold"
                >
                  Save
                </button>
              </form>
            )}

            <div className="flex-1 overflow-y-auto space-y-1 pr-1 font-sans">
              {snapshots.map((snap, idx) => (
                <div
                  key={snap.id}
                  className={`group flex items-center justify-between p-1.5 rounded-lg text-xs transition-colors ${
                    idx === 0
                      ? 'bg-indigo-600/15 border border-indigo-500/30 text-indigo-200'
                      : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${idx === 0 ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                    <div className="truncate flex-1 min-w-0">
                      <div className="truncate font-medium text-[11px] leading-tight text-slate-200">{snap.message}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        <span suppressHydrationWarning>
                          {mounted
                            ? new Date(snap.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '...'}
                        </span>
                        <span>•</span>
                        <span>{snap.files.length} files</span>
                      </div>
                    </div>
                  </div>

                  {idx !== 0 && (
                    <button
                      onClick={() => restoreSnapshot(snap.id)}
                      title="Rollback to this snapshot"
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-indigo-600 hover:text-white rounded text-slate-400 transition-all shrink-0 ml-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer / Isolation Badge */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-400 flex items-center justify-between shrink-0">
        <span className="flex items-center gap-1 text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Sandbox Active
        </span>
        <span className="text-slate-400">Upstash Box v1</span>
      </div>
    </div>
  );
};
