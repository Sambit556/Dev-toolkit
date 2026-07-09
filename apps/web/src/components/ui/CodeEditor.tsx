'use client';

import React, { useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { Monaco, OnMount } from '@monaco-editor/react';
import { useTheme } from 'next-themes';
import { Loader2 } from 'lucide-react';

const MonacoEditor = dynamic(
  () =>
    import('@monaco-editor/react').then(async (mod) => {
      // Import editor core + JSON and basic languages (YAML, XML, Markdown, HTML, CSS, JS)
      const [monaco] = await Promise.all([
        import('monaco-editor/esm/vs/editor/editor.api'),
        import('monaco-editor/esm/vs/language/json/monaco.contribution'),
        import('monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution').catch(() => null),
        import('monaco-editor/esm/vs/basic-languages/xml/xml.contribution').catch(() => null),
        import('monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution').catch(() => null),
        import('monaco-editor/esm/vs/basic-languages/html/html.contribution').catch(() => null),
        import('monaco-editor/esm/vs/basic-languages/css/css.contribution').catch(() => null),
        import('monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution').catch(() => null),
      ]);
      mod.loader.config({ monaco });

      (self as unknown as { MonacoEnvironment: unknown }).MonacoEnvironment = {
        getWorker(_workerId: string, label: string) {
          if (label === 'json') {
            return new Worker(
              new URL('monaco-editor/esm/vs/language/json/json.worker', import.meta.url),
              { type: 'module' },
            );
          }
          return new Worker(
            new URL('monaco-editor/esm/vs/editor/editor.worker', import.meta.url),
            { type: 'module' },
          );
        },
      };

      return mod;
    }),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-muted/20 min-h-[150px] border rounded-md">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  },
);

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: 'json' | 'yaml' | 'xml' | 'markdown' | 'plaintext' | 'html' | 'css' | 'javascript';
  readOnly?: boolean;
  minimap?: boolean;
  height?: string;
  className?: string;
}

export function CodeEditor({
  value,
  onChange,
  language = 'plaintext',
  readOnly = false,
  minimap = false,
  height = '100%',
  className = '',
}: CodeEditorProps) {
  const { resolvedTheme } = useTheme();
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoRef = useRef<Monaco | null>(null);

  const handleMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Configure JSON settings if needed
    if (language === 'json') {
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        allowComments: false,
        schemas: [],
      });
    }
  }, [language]);

  return (
    <div className={`w-full overflow-hidden border rounded-md bg-card ${className}`} style={{ height }}>
      <MonacoEditor
        height="100%"
        language={language}
        value={value}
        theme={resolvedTheme === 'dark' ? 'vs-dark' : 'vs-light'}
        onChange={(v) => onChange?.(v ?? '')}
        onMount={handleMount}
        options={{
          readOnly,
          minimap: { enabled: minimap },
          fontSize: 13,
          lineNumbers: 'on',
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          folding: true,
          renderWhitespace: 'selection',
          tabSize: 2,
          automaticLayout: true,
          padding: { top: 8, bottom: 8 },
          scrollbar: {
            vertical: 'auto',
            horizontal: 'auto',
          },
        }}
      />
    </div>
  );
}
