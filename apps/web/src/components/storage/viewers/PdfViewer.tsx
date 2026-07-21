'use client';

import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Same-origin worker URL — resolves as 'self' for CSP, already covered by the
// existing `worker-src 'self' blob:` directive (same pattern CodeEditor.tsx uses
// for Monaco's workers). This file is only ever loaded via next/dynamic(ssr:false),
// so it's safe to touch pdfjs/DOM APIs at module scope.
pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

export function PdfViewer({ src }: { src: string }) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);

  return (
    <div className="w-full h-full flex flex-col bg-slate-800/40">
      <div className="flex-1 overflow-auto flex items-start justify-center p-4">
        <Document
          file={src}
          onLoadSuccess={({ numPages: n }) => { setNumPages(n); setPageNumber(1); }}
          loading={<div className="flex items-center justify-center h-full py-20"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>}
          error={<div className="text-slate-400 text-sm py-20">Failed to load PDF.</div>}
        >
          <Page pageNumber={pageNumber} scale={scale} className="shadow-2xl" />
        </Document>
      </div>

      <div className="shrink-0 flex items-center justify-center gap-1.5 bg-slate-900/80 backdrop-blur-md border-t border-slate-700/50 py-2.5">
        <button
          onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
          disabled={pageNumber <= 1}
          className="p-1.5 rounded-full text-slate-300 hover:bg-slate-700/60 hover:text-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        ><ChevronLeft className="h-3.5 w-3.5" /></button>
        <span className="text-[10px] font-bold text-slate-300 w-16 text-center tabular-nums">{pageNumber} / {numPages || '…'}</span>
        <button
          onClick={() => setPageNumber((p) => Math.min(numPages || p, p + 1))}
          disabled={!numPages || pageNumber >= numPages}
          className="p-1.5 rounded-full text-slate-300 hover:bg-slate-700/60 hover:text-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        ><ChevronRight className="h-3.5 w-3.5" /></button>
        <div className="w-px h-4 bg-slate-700 mx-1.5" />
        <button onClick={() => setScale((s) => Math.max(0.5, Number((s - 0.25).toFixed(2))))} className="p-1.5 rounded-full text-slate-300 hover:bg-slate-700/60 hover:text-white transition-colors cursor-pointer">
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
        <span className="text-[10px] font-bold text-slate-300 w-10 text-center tabular-nums">{Math.round(scale * 100)}%</span>
        <button onClick={() => setScale((s) => Math.min(3, Number((s + 0.25).toFixed(2))))} className="p-1.5 rounded-full text-slate-300 hover:bg-slate-700/60 hover:text-white transition-colors cursor-pointer">
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
