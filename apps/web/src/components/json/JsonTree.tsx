'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { ChevronRight, ChevronDown, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { flattenJson, type FlatNode } from '@/lib/json-utils';
import { copyToClipboard, cn } from '@/lib/utils';
import type { JsonNodeType } from '@devchrono/shared';

function TypeBadge({ type }: { type: JsonNodeType }) {
  const variants: Record<JsonNodeType, string> = {
    string: 'text-green-600 dark:text-green-400',
    number: 'text-blue-600 dark:text-blue-400',
    boolean: 'text-purple-600 dark:text-purple-400',
    null: 'text-red-500 dark:text-red-400',
    object: 'text-yellow-600 dark:text-yellow-400',
    array: 'text-orange-600 dark:text-orange-400',
  };

  return (
    <span className={cn('text-[10px] font-medium opacity-60', variants[type])}>
      {type}
    </span>
  );
}

function ValueDisplay({ type, value }: { type: JsonNodeType; value: unknown }) {
  if (type === 'null') return <span className="json-null font-mono text-sm">null</span>;
  if (type === 'boolean') return <span className="json-boolean font-mono text-sm">{String(value)}</span>;
  if (type === 'number') return <span className="json-number font-mono text-sm">{String(value)}</span>;
  if (type === 'string') {
    const str = value as string;
    const truncated = str.length > 100 ? str.slice(0, 100) + '…' : str;
    return (
      <span className="json-string font-mono text-sm" title={str.length > 100 ? str : undefined}>
        &quot;{truncated}&quot;
      </span>
    );
  }
  return null;
}

function PathCopyButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
      onClick={async (e) => {
        e.stopPropagation();
        await copyToClipboard(path);
        toast.success('Path copied');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      title={`Copy path: ${path}`}
    >
      {copied ? <Check className="h-2.5 w-2.5 text-green-500" /> : <Copy className="h-2.5 w-2.5" />}
    </Button>
  );
}

interface JsonTreeProps {
  data: unknown;
  searchQuery?: string;
  collapsed?: Set<string>;
  onToggle?: (path: string) => void;
  onCollapseAll?: () => void;
  onExpandAll?: () => void;
}

const VIRTUALIZE_THRESHOLD = 500;
const VISIBLE_ROWS = 100;

export function JsonTree({ data, searchQuery = '', collapsed = new Set(), onToggle }: JsonTreeProps) {
  const [visibleCount, setVisibleCount] = useState(VISIBLE_ROWS);

  const nodes = useMemo(() => {
    return flattenJson(data, collapsed);
  }, [data, collapsed]);

  const filteredNodes = useMemo(() => {
    if (!searchQuery) return nodes;
    const q = searchQuery.toLowerCase();
    return nodes.filter((n) => {
      const keyMatch = n.key?.toLowerCase().includes(q);
      const valueMatch =
        n.type !== 'object' && n.type !== 'array' && String(n.value).toLowerCase().includes(q);
      return keyMatch || valueMatch;
    });
  }, [nodes, searchQuery]);

  const displayNodes = filteredNodes.slice(0, visibleCount);
  const hasMore = filteredNodes.length > visibleCount;

  const handleToggle = useCallback(
    (path: string) => {
      onToggle?.(path);
    },
    [onToggle],
  );

  if (filteredNodes.length === 0 && searchQuery) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
        No results for &quot;{searchQuery}&quot;
      </div>
    );
  }

  return (
    <div className="font-mono text-sm overflow-auto h-full">
      <div className="p-2 min-w-0">
        {displayNodes.map((node) => (
          <TreeNode key={node.id} node={node} onToggle={handleToggle} searchQuery={searchQuery} />
        ))}

        {hasMore && (
          <button
            className="mt-2 w-full text-center text-xs text-muted-foreground hover:text-foreground py-2 border rounded transition-colors"
            onClick={() => setVisibleCount((c) => c + VISIBLE_ROWS)}
          >
            Show more ({filteredNodes.length - visibleCount} remaining)
          </button>
        )}
      </div>
    </div>
  );
}

function TreeNode({
  node,
  onToggle,
  searchQuery,
}: {
  node: FlatNode;
  onToggle: (path: string) => void;
  searchQuery: string;
}) {
  const indent = node.depth * 16;
  const isContainer = node.type === 'object' || node.type === 'array';

  const highlightMatch = (text: string) => {
    if (!searchQuery) return text;
    const idx = text.toLowerCase().indexOf(searchQuery.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-yellow-200 dark:bg-yellow-800 rounded-sm">{text.slice(idx, idx + searchQuery.length)}</mark>
        {text.slice(idx + searchQuery.length)}
      </>
    );
  };

  return (
    <div
      className="flex items-start min-w-0 py-0.5 group rounded hover:bg-muted/40 transition-colors cursor-pointer"
      style={{ paddingLeft: indent + 4 }}
      onClick={() => isContainer && onToggle(node.id)}
    >
      {/* Toggle arrow */}
      <div className="w-4 shrink-0 flex items-center justify-center mt-0.5">
        {isContainer ? (
          node.isCollapsed ? (
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          )
        ) : null}
      </div>

      {/* Content */}
      <div className="flex items-start flex-wrap gap-x-1 min-w-0 flex-1">
        {/* Key */}
        {node.key !== null && (
          <span className="json-key shrink-0">
            {highlightMatch(node.type === 'array' || isNaN(Number(node.key)) ? `"${node.key}"` : node.key)}
            <span className="text-muted-foreground">:</span>
          </span>
        )}

        {/* Value or container summary */}
        {isContainer ? (
          <span className="text-muted-foreground text-xs">
            {node.type === 'array' ? '[' : '{'}
            {node.isCollapsed && (
              <span className="text-foreground">
                {node.type === 'array'
                  ? `${node.childCount} items`
                  : `${node.childCount} keys`}
              </span>
            )}
            {node.isCollapsed && (node.type === 'array' ? ']' : '}')}
          </span>
        ) : (
          <ValueDisplay type={node.type} value={node.value} />
        )}

        {/* Type badge */}
        <TypeBadge type={node.type} />

        {/* Path copy */}
        <PathCopyButton path={node.path} />
      </div>
    </div>
  );
}
