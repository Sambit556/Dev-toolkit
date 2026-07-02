'use client';

import React, { useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { Monaco, OnMount } from '@monaco-editor/react';
import { useTheme } from 'next-themes';
import { Loader2 } from 'lucide-react';

const MonacoEditor = dynamic(
  () =>
    import('@monaco-editor/react').then(async (mod) => {
      // Point the loader at the locally bundled monaco-editor package instead of
      // its default CDN (cdn.jsdelivr.net), which our CSP blocks and would leave
      // the editor stuck on the loading spinner forever.
      //
      // Import only the editor core + the JSON language contribution, not the
      // full `monaco-editor` barrel — that barrel also pulls in ~50 basic
      // languages plus full CSS/HTML/TypeScript language services we never use,
      // which is what made the very first compile of this route take ~30s in
      // dev and bloated the shipped bundle. This editor only ever needs JSON.
      const [monaco] = await Promise.all([
        import('monaco-editor/esm/vs/editor/editor.api'),
        import('monaco-editor/esm/vs/language/json/monaco.contribution'),
      ]);
      mod.loader.config({ monaco });

      // Without a MonacoEnvironment, Monaco can't spin up its language
      // workers and throws repeated "Unexpected usage" errors in the console.
      //
      // `type: 'module'` is required here: these worker chunks are genuine
      // ESM (they use `import`/`export`). Webpack silently rewrites worker
      // entry chunks into a classic-script-compatible bundle so this works
      // even without the option, but Turbopack serves the raw ESM chunk as-is
      // — without `type: 'module'` the browser tries to run it as a classic
      // script and throws "Cannot use import statement outside a module".
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
      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  },
);

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  onError?: (line: number, column: number) => void;
  errorLine?: number;
  readOnly?: boolean;
}

export function JsonEditor({ value, onChange, onError, errorLine, readOnly = false }: JsonEditorProps) {
  const { resolvedTheme } = useTheme();
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const decorationsRef = useRef<string[]>([]);

  const handleMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Configure JSON language settings
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: false,
      schemas: [],
    });

    // Set focus
    editor.focus();
  }, []);

  // Highlight error line
  React.useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    // Clear previous decorations
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);

    if (errorLine && errorLine > 0) {
      decorationsRef.current = editor.deltaDecorations([], [
        {
          range: new monaco.Range(errorLine, 1, errorLine, 1),
          options: {
            isWholeLine: true,
            className: 'bg-destructive/20',
            glyphMarginClassName: 'bg-destructive',
            glyphMarginHoverMessage: { value: 'JSON error on this line' },
          },
        },
      ]);

      editor.revealLineInCenter(errorLine);
    }
  }, [errorLine]);

  return (
    <div className="flex-1 min-h-0 overflow-hidden">
      <MonacoEditor
        height="100%"
        language="json"
        value={value}
        theme={resolvedTheme === 'dark' ? 'vs-dark' : 'vs-light'}
        onChange={(v) => onChange(v ?? '')}
        onMount={handleMount}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: 'on',
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          folding: true,
          glyphMargin: true,
          renderWhitespace: 'selection',
          tabSize: 2,
          formatOnPaste: false,
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
