'use client';

import { useState, useMemo, useCallback } from 'react';
import { ArrowRight, Pencil, TreePine } from 'lucide-react';
import { toast } from 'sonner';
import { CopyButton } from '@/components/ui/copy-button';
import { formatJson as formatJsonLib, minifyJson as minifyJsonLib, parseJsonSafe } from '@/lib/json-utils';
import { tryRepairJson } from '@/lib/json-repair';
import { JsonTree } from '@/components/json/JsonTree';
import { JsonEditor } from '@/components/json/JsonEditor';

export function MiniJsonViewer() {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [showTree, setShowTree] = useState(false);

  const getJsonSizeString = (str: string): string => {
    const bytes = new Blob([str]).size;
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(2)} KB`;
  };

  // Tree view stays in sync with whatever valid JSON currently sits in the
  // textarea — not just right after a button click — so it's still there
  // if the user then edits, minifies, or reformats.
  const parsed = useMemo(() => {
    if (!input.trim()) return null;
    return parseJsonSafe(input);
  }, [input]);

  const handleToggle = useCallback((path: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  // Shared with the full JSON Viewer's "Validate & Fix" button: try a
  // straight parse first, and only fall back to the auto-repair engine
  // (unquoted keys, trailing commas, JS-only literals, ...) when the input
  // isn't valid JSON as typed.
  const formatJson = () => {
    if (!input.trim()) {
      setError(null);
      toast.info('Please enter some JSON to format');
      return;
    }
    try {
      setInput(formatJsonLib(input));
      setError(null);
      setShowTree(false);
      toast.success('Valid JSON formatted successfully');
      return;
    } catch {
      // not valid as-is — fall through to auto-repair below
    }
    const repaired = tryRepairJson(input);
    if (repaired) {
      setInput(repaired.fixed);
      setError(null);
      setShowTree(false);
      toast.success(`Auto-fixed ${repaired.fixCount} issue${repaired.fixCount === 1 ? '' : 's'}`);
      return;
    }
    setError('Could not auto-fix this JSON');
  };

  const minifyJson = () => {
    if (!input.trim()) {
      setError(null);
      toast.info('Please enter some JSON to minify');
      return;
    }
    try {
      setInput(minifyJsonLib(input));
      setError(null);
      setShowTree(false);
      toast.success('Valid JSON minified successfully');
      return;
    } catch {
      // not valid as-is — fall through to auto-repair below
    }
    const repaired = tryRepairJson(input);
    if (repaired) {
      setInput(JSON.stringify(JSON.parse(repaired.fixed)));
      setError(null);
      setShowTree(false);
      toast.success(`Auto-fixed ${repaired.fixCount} issue${repaired.fixCount === 1 ? '' : 's'}`);
      return;
    }
    setError('Could not auto-fix this JSON');
  };

  return (
    <div className="flex flex-col h-full p-3 bg-card space-y-2.5 text-xs select-none" onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
      {/* Single input/output surface, not two stacked sections: the raw
          textarea by default (Format/Minify always land back here), swapped
          in-place for the tree view when "View Tree" (in the header, same
          spot as "Edit") is clicked; "Edit" flips back to text. */}
      {showTree && parsed?.error == null && parsed?.value !== undefined ? (
        <div className="w-full flex-1 min-h-48 flex flex-col overflow-hidden rounded-lg border bg-muted/20 dark:bg-black">
          <div className="flex items-center justify-between px-2 py-1.5 border-b shrink-0">
            <span className="text-[10px] font-bold text-muted-foreground">Tree View</span>
            <button
              onClick={() => setShowTree(false)}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary text-primary-foreground hover:opacity-90 text-[11px] font-bold transition-opacity shrink-0"
            >
              <Pencil className="h-3 w-3" />
              Edit
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-auto">
            <JsonTree data={parsed.value} collapsed={collapsed} onToggle={handleToggle} />
          </div>
        </div>
      ) : (
        <div className="w-full flex-1 min-h-48 flex flex-col overflow-hidden rounded-lg border bg-muted/40 dark:bg-black">
          <div className="flex items-center justify-between px-2 py-1.5 border-b shrink-0">
            <span className="text-[10px] font-bold text-muted-foreground">Input</span>
            {parsed?.error == null && parsed?.value !== undefined && (
              <button
                onClick={() => setShowTree(true)}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary text-primary-foreground hover:opacity-90 text-[11px] font-bold transition-opacity shrink-0"
              >
                <TreePine className="h-3 w-3" />
                View Tree
              </button>
            )}
          </div>
          {/* Same Monaco-based editor as the full JSON Viewer page — syntax
              highlighting and code folding for free, instead of a plain
              textarea. Fixed height, and — importantly — `flex flex-col`:
              JsonEditor's own root is `flex-1 min-h-0`, which only does
              anything as a flex *child*; without a flex parent here it's a
              plain block with no explicit height, so Monaco's `height: 100%`
              has nothing definite to resolve against and locks in at ~0px on
              mount (automaticLayout never gets a resize to fire on after).
              Wrapped to stop the panel's own drag handling from intercepting
              clicks meant for the editor. */}
          <div className="flex-1 min-h-0 flex flex-col" onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
            <JsonEditor value={input} onChange={setInput} />
          </div>
        </div>
      )}

      <div className="flex gap-2 justify-between items-center">
        {input.trim() && (
          <span className="text-[10px] text-muted-foreground font-mono">
            Size: <span className="font-bold text-foreground">{getJsonSizeString(input)}</span>
          </span>
        )}
        <div className="flex gap-2 ml-auto">
          <button
            onClick={minifyJson}
            className="px-2.5 py-1.5 bg-muted/75 hover:bg-muted text-foreground rounded-lg font-bold text-xs transition-colors shrink-0"
          >
            Minify
          </button>
          <button
            onClick={formatJson}
            className="px-3.5 py-1.5 bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 text-white hover:opacity-90 rounded-lg font-bold text-xs transition-opacity shrink-0 flex items-center gap-1"
          >
            Validate
            <ArrowRight className="h-3 w-3 animate-arrow-loop" />
            Format
          </button>
        </div>
      </div>

      {input.trim() && (
        <CopyButton
          value={input}
          label="Copy JSON"
          toastMessage="Copied JSON content!"
          variant="ghost"
          className="w-full py-1.5 bg-muted hover:bg-muted-foreground/10 border rounded-lg text-foreground font-bold text-xs justify-center"
        />
      )}

      {error && (
        <div className="text-[10px] text-destructive bg-destructive/10 border border-destructive/20 p-2 rounded-lg font-mono leading-normal select-text max-h-20 overflow-y-auto">
          {error}
        </div>
      )}
    </div>
  );
}
