'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { Braces, SplitSquareHorizontal, TreePine, Wrench, AlertCircle, Info } from 'lucide-react';
import { JsonEditor } from './JsonEditor';
import { JsonTree } from './JsonTree';
import { JsonToolbar } from './JsonToolbar';
import { JsonAdvancedTools } from './JsonAdvancedTools';
import { JsonHistoryPanel } from './JsonHistoryPanel';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { copyToClipboard, downloadFile } from '@/lib/utils';
import { parseJsonSafe, formatJson, minifyJson, countNodes } from '@/lib/json-utils';
import { tryRepairJson } from '@/lib/json-repair';
import { useHistoryStore } from '@/store/history';

export function JsonViewerPage() {
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [rightTab, setRightTab] = useState<'tree' | 'advanced'>('tree');
  const [errorLine, setErrorLine] = useState<number | undefined>();
  const [historyOpen, setHistoryOpen] = useState(false);
  const addHistoryEntry = useHistoryStore((s) => s.addEntry);
  const lastHistoryEntry = useHistoryStore((s) => s.entries.find((e) => e.tool === 'json'));

  // Parse result
  const parseResult = useMemo(() => {
    if (!input.trim()) return null;
    return parseJsonSafe(input);
  }, [input]);

  const isValid = useMemo(() => {
    if (!input.trim()) return null;
    return parseResult?.error === null;
  }, [input, parseResult]);

  const nodeCount = useMemo(() => {
    if (!parseResult?.value) return 0;
    return countNodes(parseResult.value);
  }, [parseResult]);

  const inputSize = useMemo(() => new TextEncoder().encode(input).length, [input]);

  // Update error line when parse result changes
  React.useEffect(() => {
    if (parseResult?.error?.line) {
      setErrorLine(parseResult.error.line);
    } else {
      setErrorLine(undefined);
    }
  }, [parseResult]);

  const saveJsonToHistory = useCallback((value: string) => {
    if (!value.trim() || value === lastHistoryEntry?.input) return;
    const parsed = parseJsonSafe(value);
    if (parsed.error || parsed.value === undefined) return;
    const count = countNodes(parsed.value);
    const bytes = new TextEncoder().encode(value).length;
    const sizeLabel = bytes > 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${bytes} B`;
    addHistoryEntry({ tool: 'json', input: value, output: `${count.toLocaleString()} nodes · ${sizeLabel}` });
  }, [addHistoryEntry, lastHistoryEntry]);

  const handleFormat = useCallback(() => {
    try {
      const formatted = formatJson(input);
      setInput(formatted);
      saveJsonToHistory(formatted);
      toast.success('JSON formatted');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Invalid JSON');
    }
  }, [input, saveJsonToHistory]);

  const handleMinify = useCallback(() => {
    try {
      const minified = minifyJson(input);
      setInput(minified);
      saveJsonToHistory(minified);
      toast.success('JSON minified');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Invalid JSON');
    }
  }, [input, saveJsonToHistory]);

  const handleValidate = useCallback(() => {
    if (!input.trim()) {
      toast.info('Please enter some JSON to validate');
      return;
    }
    const result = parseJsonSafe(input);
    if (!result.error) {
      saveJsonToHistory(input);
      toast.success(`Valid JSON · ${nodeCount.toLocaleString()} nodes · ${(inputSize / 1024).toFixed(1)} KB`);
      return;
    }

    const repaired = tryRepairJson(input);
    if (repaired) {
      setInput(repaired.fixed);
      saveJsonToHistory(repaired.fixed);
      toast.success('Found issues and fixed them automatically — review the updated JSON');
      return;
    }

    const loc = result.error.line ? ` (line ${result.error.line}, col ${result.error.column})` : '';
    toast.error(`Couldn't auto-fix this JSON${loc}: ${result.error.message}`);
  }, [input, nodeCount, inputSize, saveJsonToHistory]);

  const handleCopy = useCallback(async () => {
    if (!input) return;
    try {
      await copyToClipboard(input);
      toast.success('JSON copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
  }, [input]);

  const handleDownload = useCallback(() => {
    if (!input) return;
    downloadFile(input, 'data.json', 'application/json');
    toast.success('JSON downloaded');
  }, [input]);

  const handleClear = useCallback(() => {
    setInput('');
    setSearchQuery('');
    setCollapsed(new Set());
    setErrorLine(undefined);
    toast.info('Editor cleared');
  }, []);

  const handleExpandAll = useCallback(() => {
    setCollapsed(new Set());
    toast.success('All nodes expanded');
  }, []);

  const handleCollapseAll = useCallback(() => {
    if (!parseResult?.value) return;
    // Collect all container paths
    const paths = new Set<string>();
    const collectPaths = (val: unknown, path: string) => {
      if (Array.isArray(val)) {
        paths.add(path);
        val.forEach((v, i) => collectPaths(v, `${path}[${i}]`));
      } else if (val && typeof val === 'object') {
        paths.add(path);
        Object.entries(val as Record<string, unknown>).forEach(([k, v]) =>
          collectPaths(v, `${path}.${k}`)
        );
      }
    };
    collectPaths(parseResult.value, '$');
    setCollapsed(paths);
    toast.success('All nodes collapsed');
  }, [parseResult]);

  const handleToggle = useCallback((path: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Page header */}
      <div className="border-b px-4 py-3 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <Braces className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold">JSON Viewer</h1>
          {isValid !== null && (
            <Badge variant={isValid ? 'success' : 'destructive'} className="text-xs">
              {isValid ? 'Valid' : 'Invalid'}
            </Badge>
          )}
          {isValid && nodeCount > 0 && (
            <Badge variant="outline" className="text-xs">
              {nodeCount.toLocaleString()} nodes
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground hidden md:block">
          All processing is client-side. Your data never leaves your browser.
        </p>
      </div>

      {/* Toolbar */}
      <JsonToolbar
        onFormat={handleFormat}
        onMinify={handleMinify}
        onValidate={handleValidate}
        onClear={handleClear}
        onCopy={handleCopy}
        onDownload={handleDownload}
        onUpload={setInput}
        onExpandAll={handleExpandAll}
        onCollapseAll={handleCollapseAll}
        onOpenHistory={() => setHistoryOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isValid={isValid}
        inputSize={inputSize}
      />

      {/* Error banner */}
      {parseResult?.error && input.trim() && (
        <div className="flex items-center gap-2 px-4 py-2 bg-destructive/10 border-b text-sm text-destructive shrink-0">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="font-medium">JSON Error:</span>
          <span>{parseResult.error.message}</span>
          {parseResult.error.line && (
            <span className="ml-auto text-xs tabular-nums">
              Line {parseResult.error.line}, Col {parseResult.error.column}
            </span>
          )}
        </div>
      )}

      {/* Main split layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: Editor */}
        <div className="flex flex-col w-1/2 border-r min-h-0">
          <div className="flex items-center gap-2 px-3 py-1.5 border-b bg-muted/20 shrink-0">
            <SplitSquareHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Input</span>
            {input.trim() && (
              <span className="text-xs text-muted-foreground ml-auto tabular-nums">
                {input.split('\n').length} lines
              </span>
            )}
          </div>
          <JsonEditor
            value={input}
            onChange={setInput}
            errorLine={errorLine}
          />
        </div>

        {/* Right: Tree + Advanced */}
        <div className="flex flex-col w-1/2 min-h-0">
          <div className="shrink-0 px-3 py-1.5 border-b bg-muted/20 flex items-center gap-2">
            <Tabs value={rightTab} onValueChange={(v) => setRightTab(v as 'tree' | 'advanced')}>
              <TabsList className="h-7 p-0.5">
                <TabsTrigger value="tree" className="h-6 text-xs gap-1">
                  <TreePine className="h-3 w-3" />
                  Tree View
                </TabsTrigger>
                <TabsTrigger value="advanced" className="h-6 text-xs gap-1">
                  <Wrench className="h-3 w-3" />
                  Tools
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden p-2">
            {rightTab === 'tree' ? (
              !input.trim() ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-2">
                  <Braces className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">Enter JSON in the editor to see the tree view</p>
                </div>
              ) : parseResult?.error ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-2">
                  <AlertCircle className="h-8 w-8 text-destructive/50" />
                  <p className="text-sm text-muted-foreground">Fix the JSON error to see the tree view</p>
                </div>
              ) : parseResult?.value !== undefined ? (
                <JsonTree
                  data={parseResult.value}
                  searchQuery={searchQuery}
                  collapsed={collapsed}
                  onToggle={handleToggle}
                />
              ) : null
            ) : (
              <JsonAdvancedTools jsonInput={input} onJsonChange={setInput} />
            )}
          </div>
        </div>
      </div>

      <JsonHistoryPanel
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        onLoad={(value) => {
          setInput(value);
          toast.success('Loaded from history');
        }}
      />
    </div>
  );
}
