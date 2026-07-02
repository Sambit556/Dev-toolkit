'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, Braces, Trash2, History } from 'lucide-react';
import { useHistoryStore } from '@/store/history';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { truncate } from '@/lib/utils';

export function RecentHistory() {
  const { entries, removeEntry, clearAll } = useHistoryStore();
  // The store rehydrates from localStorage synchronously on the client, before
  // the server (which always sees an empty store) ever could. Deferring real
  // entries to after mount keeps the first client render matching the server.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || entries.length === 0) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">Recent Activity</h2>
          <Badge variant="secondary" className="text-xs">{entries.length}</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs text-muted-foreground h-7">
          <Trash2 className="h-3 w-3 mr-1" />
          Clear all
        </Button>
      </div>

      <div className="space-y-2">
        {entries.slice(0, 8).map((entry) => {
          const Icon = entry.tool === 'epoch' ? Clock : Braces;
          const href = entry.tool === 'epoch' ? '/epoch' : '/json';
          const time = new Date(entry.timestamp);
          const timeAgo = formatTimeAgo(time);

          return (
            <div
              key={entry.id}
              className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm hover:bg-muted/40 transition-colors group"
            >
              <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-mono text-xs">{truncate(entry.input, 40)}</span>
                {entry.output && (
                  <span className="text-muted-foreground ml-2">→ {truncate(entry.output, 30)}</span>
                )}
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{timeAgo}</span>
              <Link href={href} className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                Open →
              </Link>
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeEntry(entry.id)}
              >
                <Trash2 className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
