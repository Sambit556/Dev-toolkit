'use client';

import React, { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { X, Download, Maximize, Minimize, ChevronLeft, ChevronRight, Info, Loader2 } from 'lucide-react';
import { getFileColor } from '@/lib/fileColor';
import { ImageViewer } from './viewers/ImageViewer';
import { VideoViewer } from './viewers/VideoViewer';
import { AudioViewer } from './viewers/AudioViewer';
import { TextCodeViewer } from './viewers/TextCodeViewer';
import { UnsupportedViewer } from './viewers/UnsupportedViewer';
import type { FilePreviewData } from './types';

// pdfjs touches DOM/worker APIs at module scope — never render it during SSR,
// same pattern CodeEditor.tsx already uses for Monaco.
const PdfViewer = dynamic(() => import('./viewers/PdfViewer').then((m) => m.PdfViewer), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>,
});

export interface FileViewerItem {
  id: string;
  name: string;
  mime_type: string;
  size: number | null;
}

interface FileViewerModalProps {
  item: FileViewerItem;
  siblingFiles: FileViewerItem[];
  apiBase: string;
  getHeaders: () => Record<string, string>;
  onClose: () => void;
  onNavigate: (item: FileViewerItem) => void;
}

function formatSize(bytes: number) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function FileViewerModal({ item, siblingFiles, apiBase, getHeaders, onClose, onNavigate }: FileViewerModalProps) {
  const [preview, setPreview] = useState<FilePreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentIndex = siblingFiles.findIndex((f) => f.id === item.id);
  const prevFile = currentIndex > 0 ? siblingFiles[currentIndex - 1] : null;
  const nextFile = currentIndex >= 0 && currentIndex < siblingFiles.length - 1 ? siblingFiles[currentIndex + 1] : null;

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError('');
    setPreview(null);

    fetch(`${apiBase}/api/storage/preview/${item.id}`, { headers: getHeaders() })
      .then(async (res) => {
        const json = await res.json();
        if (cancelled) return;
        if (res.ok && json.success) {
          setPreview(json.data);
        } else {
          setError(json.message || 'Failed to load preview');
        }
      })
      .catch(() => { if (!cancelled) setError('Failed to load preview'); })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  const handleDownload = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/api/storage/download/${item.id}`, { headers: getHeaders() });
      const json = await res.json();
      if (!json.success) return;
      const link = document.createElement('a');
      link.href = json.data.downloadUrl;
      link.download = item.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch { /* silent — matches existing download button behavior elsewhere */ }
  }, [apiBase, getHeaders, item.id, item.name]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft' && prevFile) onNavigate(prevFile);
      else if (e.key === 'ArrowRight' && nextFile) onNavigate(nextFile);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, onNavigate, prevFile, nextFile]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  const color = getFileColor(item.mime_type);

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/85 backdrop-blur-md" onClick={onClose}>
      <div
        className="w-[92vw] h-[88vh] max-w-6xl bg-slate-950/95 border border-slate-800/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 h-14 px-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center border shrink-0" style={{ backgroundColor: `${color}1a`, borderColor: `${color}40`, color }}>
              <Info className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-slate-100 font-bold text-xs truncate max-w-md">{item.name}</div>
              <div className="text-slate-500 text-[10px]">{item.mime_type}{item.size ? ` · ${formatSize(item.size)}` : ''}</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {siblingFiles.length > 1 && (
              <>
                <button
                  onClick={() => prevFile && onNavigate(prevFile)}
                  disabled={!prevFile}
                  className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Previous file"
                ><ChevronLeft className="h-4 w-4" /></button>
                <button
                  onClick={() => nextFile && onNavigate(nextFile)}
                  disabled={!nextFile}
                  className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Next file"
                ><ChevronRight className="h-4 w-4" /></button>
                <div className="w-px h-4 bg-slate-800 mx-1" />
              </>
            )}
            <button onClick={toggleFullscreen} className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer" title="Fullscreen">
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </button>
            <button onClick={handleDownload} className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer" title="Download">
              <Download className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer" title="Close (Esc)">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : error || !preview ? (
            <UnsupportedViewer name={item.name} mimeType={item.mime_type} size={item.size || 0} color={color} onDownload={handleDownload} />
          ) : preview.kind === 'media' && preview.mimeType.startsWith('image/') ? (
            <ImageViewer src={preview.previewUrl} alt={preview.name} />
          ) : preview.kind === 'media' && preview.mimeType.startsWith('video/') ? (
            <VideoViewer src={preview.previewUrl} />
          ) : preview.kind === 'media' && preview.mimeType.startsWith('audio/') ? (
            <AudioViewer src={preview.previewUrl} name={preview.name} />
          ) : preview.kind === 'media' && preview.mimeType === 'application/pdf' ? (
            <PdfViewer src={preview.previewUrl} />
          ) : preview.kind === 'text' ? (
            <TextCodeViewer content={preview.content} mimeType={preview.mimeType} />
          ) : (
            <UnsupportedViewer name={preview.name} mimeType={preview.mimeType} size={preview.size} color={color} reason={preview.kind === 'unsupported' ? preview.reason : undefined} onDownload={handleDownload} />
          )}
        </div>
      </div>
    </div>
  );
}
