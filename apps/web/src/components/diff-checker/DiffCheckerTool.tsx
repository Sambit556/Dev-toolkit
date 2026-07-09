'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { GitCompare, ArrowLeftRight, Trash2, SlidersHorizontal, Upload, FileCode } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

// Dynamically import Monaco Diff Editor to bypass SSR
const MonacoDiffEditor = dynamic(
  () =>
    import('@monaco-editor/react').then(async (mod) => {
      // Import editor core + JSON and basic languages
      const [monaco] = await Promise.all([
        import('monaco-editor/esm/vs/editor/editor.api'),
        import('monaco-editor/esm/vs/language/json/monaco.contribution').catch(() => null),
        import('monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution').catch(() => null),
        import('monaco-editor/esm/vs/basic-languages/xml/xml.contribution').catch(() => null),
        import('monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution').catch(() => null),
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

      return mod.DiffEditor;
    }),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] items-center justify-center bg-muted/20 border rounded-md border-dashed">
        <div className="flex flex-col items-center gap-2">
          <GitCompare className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Loading Local Diff Editor...</span>
        </div>
      </div>
    ),
  }
);

export function DiffCheckerTool() {
  const { resolvedTheme } = useTheme();
  const [originalText, setOriginalText] = useState('{\n  "name": "DevToolkit",\n  "version": "1.0.0",\n  "description": "Fast & secure client-side developer utilities",\n  "private": true\n}');
  const [modifiedText, setModifiedText] = useState('{\n  "name": "DevToolkit - Advanced",\n  "version": "1.2.0",\n  "description": "Blazing fast client-side developer utilities",\n  "private": false,\n  "license": "MIT"\n}');
  
  const [showDiff, setShowDiff] = useState(false);
  const [sideBySide, setSideBySide] = useState(true);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [lang, setLang] = useState('json');

  const handleSwap = () => {
    const temp = originalText;
    setOriginalText(modifiedText);
    setModifiedText(temp);
    toast.success('Swapped inputs');
  };

  const handleClear = () => {
    setOriginalText('');
    setModifiedText('');
    setShowDiff(false);
    toast.success('Cleared inputs');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'original' | 'modified') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (type === 'original') setOriginalText(text);
      else setModifiedText(text);
      toast.success(`Loaded ${file.name}`);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <Card className="border bg-card/60 backdrop-blur-sm shadow-sm">
        <CardContent className="p-4 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              <span className="font-bold">Settings:</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <Label htmlFor="layout-mode" className="cursor-pointer">Side-by-side</Label>
              <Switch
                id="layout-mode"
                checked={sideBySide}
                onCheckedChange={setSideBySide}
              />
            </div>

            <div className="flex items-center gap-1.5">
              <Label htmlFor="whitespace-mode" className="cursor-pointer">Ignore Whitespace</Label>
              <Switch
                id="whitespace-mode"
                checked={ignoreWhitespace}
                onCheckedChange={setIgnoreWhitespace}
              />
            </div>

            <div className="flex items-center gap-2">
              <Label>Language</Label>
              <Select value={lang} onValueChange={setLang}>
                <SelectTrigger className="h-8 w-32 bg-background">
                  <SelectValue placeholder="Plaintext" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plaintext">Plain Text</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="html">HTML</SelectItem>
                  <SelectItem value="css">CSS</SelectItem>
                  <SelectItem value="typescript">TypeScript</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="yaml">YAML</SelectItem>
                  <SelectItem value="xml">XML</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSwap} className="h-8 gap-1.5 text-xs">
              <ArrowLeftRight className="h-3.5 w-3.5" />
              Swap
            </Button>
            <Button variant="outline" size="sm" onClick={handleClear} className="h-8 gap-1.5 text-xs text-red-500 hover:bg-red-500/10">
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </Button>
            <Button 
              size="sm" 
              onClick={() => setShowDiff(!showDiff)} 
              className="h-8 gap-1.5 text-xs font-bold"
            >
              <GitCompare className="h-3.5 w-3.5" />
              {showDiff ? 'Edit Inputs' : 'Compare Text'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {!showDiff ? (
        /* Edit Mode inputs */
        <div className="grid gap-6 md:grid-cols-2">
          {/* Original Text Pane */}
          <Card className="border bg-card/40 shadow-sm relative">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b">
                <Label className="font-bold text-sm flex items-center gap-1.5">
                  <FileCode className="h-4 w-4 text-primary" />
                  Original (Left / Old)
                </Label>
                <label className="flex items-center gap-1 cursor-pointer text-[10px] font-semibold text-primary hover:underline">
                  <Upload className="h-3 w-3" />
                  Upload File
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'original')}
                  />
                </label>
              </div>
              <Textarea
                value={originalText}
                onChange={(e) => setOriginalText(e.target.value)}
                placeholder="Paste original text content here..."
                className="min-h-[420px] text-xs font-mono leading-relaxed"
              />
            </CardContent>
          </Card>

          {/* Modified Text Pane */}
          <Card className="border bg-card/40 shadow-sm relative">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b">
                <Label className="font-bold text-sm flex items-center gap-1.5">
                  <FileCode className="h-4 w-4 text-primary" />
                  Modified (Right / New)
                </Label>
                <label className="flex items-center gap-1 cursor-pointer text-[10px] font-semibold text-primary hover:underline">
                  <Upload className="h-3 w-3" />
                  Upload File
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'modified')}
                  />
                </label>
              </div>
              <Textarea
                value={modifiedText}
                onChange={(e) => setModifiedText(e.target.value)}
                placeholder="Paste modified text content here..."
                className="min-h-[420px] text-xs font-mono leading-relaxed"
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Diff Mode Monaco Viewer */
        <Card className="border shadow-lg overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-muted/40 px-4 py-2 text-xs flex justify-between items-center border-b font-mono">
              <span className="text-muted-foreground">Original ↔ Modified comparison ({lang})</span>
              <Button variant="ghost" size="sm" onClick={() => setShowDiff(false)} className="text-primary hover:underline text-[10px] h-6 py-0">
                Back to Edit
              </Button>
            </div>
            <div className="h-[480px] w-full">
              <MonacoDiffEditor
                original={originalText}
                modified={modifiedText}
                language={lang}
                theme={resolvedTheme === 'dark' ? 'vs-dark' : 'vs-light'}
                options={{
                  renderSideBySide: sideBySide,
                  ignoreTrimWhitespace: ignoreWhitespace,
                  fontSize: 13,
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                  minimap: { enabled: false },
                  scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
                  readOnly: true,
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
