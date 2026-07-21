'use client';

import React from 'react';
import { Music } from 'lucide-react';

export function AudioViewer({ src, name }: { src: string; name: string }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-8 bg-gradient-to-br from-indigo-950 via-slate-950 to-violet-950 p-8">
      <div className="h-32 w-32 rounded-3xl bg-gradient-to-br from-indigo-500/30 to-violet-600/30 border border-indigo-400/20 flex items-center justify-center shadow-[0_0_60px_rgba(99,102,241,0.25)]">
        <Music className="h-12 w-12 text-indigo-300" />
      </div>
      <div className="text-slate-200 font-semibold text-sm text-center max-w-md truncate px-4">{name}</div>
      <audio src={src} controls autoPlay className="w-full max-w-md" />
    </div>
  );
}
