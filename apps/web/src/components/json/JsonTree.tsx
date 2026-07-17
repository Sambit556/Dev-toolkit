'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { CopyButton } from '@/components/ui/copy-button';
import { flattenJson, type FlatNode } from '@/lib/json-utils';
import { cn } from '@/lib/utils';
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
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="json-string font-mono text-sm">
            &quot;{truncated}&quot;
          </span>
        </TooltipTrigger>
        <TooltipContent>{str.length > 100 ? str : undefined}</TooltipContent>
      </Tooltip>
    );
  }
  return null;
}

// Objects/arrays copy their full (pretty-printed) subtree; scalars copy the
// raw value itself (a string copies its bare content, no surrounding quotes).
function getCopyText(type: JsonNodeType, value: unknown): string {
  if (type === 'object' || type === 'array') return JSON.stringify(value, null, 2);
  if (type === 'null') return 'null';
  if (type === 'string') return value as string;
  return String(value);
}

function ValueCopyButton({ type, value }: { type: JsonNodeType; value: unknown }) {
  return (
    <CopyButton
      value={getCopyText(type, value)}
      tooltip="Copy value"
      toastMessage="Value copied"
      className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
      iconClassName="h-2.5 w-2.5"
    />
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

// Parent of "$.a.b[2].c" is "$.a.b[2]"; parent of "$.a" is "$".
function getParentPath(path: string): string {
  const match = path.match(/^(.*)(\.[^.[\]]+|\[\d+\])$/);
  return match ? match[1] : '$';
}

function nodeMatches(n: FlatNode, query: string): boolean {
  const keyMatch = n.key?.toLowerCase().includes(query);
  const valueMatch =
    n.type !== 'object' && n.type !== 'array' && String(n.value).toLowerCase().includes(query);
  return Boolean(keyMatch || valueMatch);
}

export function JsonTree({ data, searchQuery = '', collapsed = new Set(), onToggle }: JsonTreeProps) {
  const [visibleCount, setVisibleCount] = useState(VISIBLE_ROWS);

  const nodes = useMemo(() => {
    return flattenJson(data, collapsed);
  }, [data, collapsed]);

  // While searching, matches must be discoverable even inside collapsed
  // branches, and the tree hierarchy around a match must stay visible so the
  // result isn't a disconnected line with no context — so this flattens with
  // nothing collapsed and keeps each match plus its ancestor chain and (for
  // container matches) its full subtree, instead of filtering `nodes` (which
  // already has collapsed branches pruned out).
  const filteredNodes = useMemo(() => {
    if (!searchQuery) return nodes;
    const q = searchQuery.toLowerCase();
    const full = flattenJson(data, new Set());
    const visible = new Set<string>();

    full.forEach((n, i) => {
      if (!nodeMatches(n, q)) return;
      let p = n.id;
      visible.add(p);
      while (p !== '$') {
        p = getParentPath(p);
        visible.add(p);
      }
      if (n.type === 'object' || n.type === 'array') {
        for (let j = i + 1; j < full.length && full[j].depth > n.depth; j++) {
          visible.add(full[j].id);
        }
      }
    });

    return full.filter((n) => visible.has(n.id));
  }, [nodes, data, searchQuery]);

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
    const q = searchQuery.toLowerCase();
    const lower = text.toLowerCase();
    const parts: React.ReactNode[] = [];
    let i = 0;
    while (i < text.length) {
      const idx = lower.indexOf(q, i);
      if (idx === -1) {
        parts.push(text.slice(i));
        break;
      }
      if (idx > i) parts.push(text.slice(i, idx));
      parts.push(
        <mark key={idx} className="bg-yellow-200 dark:bg-yellow-800 rounded-sm">
          {text.slice(idx, idx + q.length)}
        </mark>,
      );
      i = idx + q.length;
    }
    return <>{parts}</>;
  };

  return (
    <div
      className="flex items-start min-w-0 py-0.5 group rounded hover:bg-muted/40 transition-colors cursor-pointer"
      style={{ paddingLeft: indent + 4 }}
      onClick={() => isContainer && onToggle(node.id)}
    >
      {/* Toggle arrow */}
      <div className="w-5 shrink-0 flex items-center justify-center mt-0.5">
        {isContainer ? (
          node.isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
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

        {/* Value copy */}
        <ValueCopyButton type={node.type} value={node.value} />
      </div>
    </div>
  );
}
