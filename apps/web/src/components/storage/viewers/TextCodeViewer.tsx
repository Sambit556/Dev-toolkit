'use client';

import React from 'react';
import { CodeEditor } from '@/components/ui/CodeEditor';

type SupportedLanguage = 'json' | 'yaml' | 'xml' | 'markdown' | 'plaintext' | 'html' | 'css' | 'javascript';

function languageForMime(mimeType: string): SupportedLanguage {
  if (mimeType.includes('json')) return 'json';
  if (mimeType.includes('xml')) return 'xml';
  if (mimeType.includes('markdown')) return 'markdown';
  if (mimeType.includes('html')) return 'html';
  if (mimeType.includes('css')) return 'css';
  if (mimeType.includes('javascript')) return 'javascript';
  return 'plaintext';
}

export function TextCodeViewer({ content, mimeType }: { content: string; mimeType: string }) {
  return (
    <div className="w-full h-full p-3">
      <CodeEditor value={content} language={languageForMime(mimeType)} readOnly height="100%" />
    </div>
  );
}
