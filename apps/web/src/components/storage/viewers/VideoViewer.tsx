'use client';

import React from 'react';

export function VideoViewer({ src }: { src: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <video src={src} controls autoPlay className="max-w-full max-h-full" />
    </div>
  );
}
