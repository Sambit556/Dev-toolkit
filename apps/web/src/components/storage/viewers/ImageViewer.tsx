'use client';

import React from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { useZoomPan } from '../hooks/useZoomPan';

export function ImageViewer({ src, alt }: { src: string; alt: string }) {
  const { zoom, zoomIn, zoomOut, reset, handlers, style } = useZoomPan();

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black/20">
      <div
        className="w-full h-full flex items-center justify-center select-none"
        {...handlers}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-full object-contain transition-transform duration-75"
          style={style}
          draggable={false}
        />
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-full px-2 py-1.5 shadow-xl">
        <button onClick={zoomOut} className="p-1.5 rounded-full text-slate-300 hover:bg-slate-700/60 hover:text-white transition-colors cursor-pointer" title="Zoom out">
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
        <span className="text-[10px] font-bold text-slate-300 w-10 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
        <button onClick={zoomIn} className="p-1.5 rounded-full text-slate-300 hover:bg-slate-700/60 hover:text-white transition-colors cursor-pointer" title="Zoom in">
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
        <div className="w-px h-4 bg-slate-700 mx-1" />
        <button onClick={reset} className="p-1.5 rounded-full text-slate-300 hover:bg-slate-700/60 hover:text-white transition-colors cursor-pointer" title="Reset zoom">
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
