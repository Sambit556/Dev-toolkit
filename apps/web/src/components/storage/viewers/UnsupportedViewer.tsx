'use client';

import React from 'react';
import { FileIcon, Download } from 'lucide-react';

interface UnsupportedViewerProps {
  name: string;
  mimeType: string;
  size: number;
  color: string;
  reason?: string;
  onDownload: () => void;
}

function formatSize(bytes: number) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function UnsupportedViewer({ name, mimeType, size, color, reason, onDownload }: UnsupportedViewerProps) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-5 bg-slate-950/40 p-8">
      <div className="h-24 w-24 rounded-3xl flex items-center justify-center border" style={{ backgroundColor: `${color}1a`, borderColor: `${color}40`, color }}>
        <FileIcon className="h-10 w-10" />
      </div>
      <div className="text-center">
        <div className="text-slate-100 font-bold text-sm max-w-md truncate px-4">{name}</div>
        <div className="text-slate-500 text-xs mt-1">{mimeType} · {formatSize(size)}</div>
        <div className="text-slate-500 text-[11px] mt-2 max-w-xs">
          {reason === 'FILE_TOO_LARGE_FOR_PREVIEW' ? 'This file is too large to preview.' : 'Preview isn’t available for this file type.'}
        </div>
      </div>
      <button
        onClick={onDownload}
        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs transition-all cursor-pointer shadow-lg shadow-blue-900/30"
      >
        <Download className="h-3.5 w-3.5" /> Download
      </button>
    </div>
  );
}
