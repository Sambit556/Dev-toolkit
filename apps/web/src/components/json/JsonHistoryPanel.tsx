'use client';

import React from 'react';
import { Trash2, History as HistoryIcon } from 'lucide-react';
import { useHistoryStore } from '@/store/history';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { truncate } from '@/lib/utils';

interface JsonHistoryPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoad: (input: string) => void;
}

export function JsonHistoryPanel({ open, onOpenChange, onLoad }: JsonHistoryPanelProps) {
  const { entries, removeEntry, clearByTool } = useHistoryStore();
  const jsonEntries = entries.filter((e) => e.tool === 'json');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HistoryIcon className="h-4 w-4" />
            JSON History
          </DialogTitle>
          <DialogDescription>
            Your last {jsonEntries.length} saved JSON snippets.
          </DialogDescription>
        </DialogHeader>

        {jsonEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No JSON history yet. Format, minify, or validate some JSON to save it here.
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {jsonEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm hover:bg-muted/40 transition-colors group"
              >
                <button
                  type="button"
                  className="flex-1 min-w-0 text-left"
                  onClick={() => {
                    onLoad(entry.input);
                    onOpenChange(false);
                  }}
                >
                  <div className="font-mono text-xs truncate">{truncate(entry.input, 60)}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {entry.output} · {formatTimeAgo(new Date(entry.timestamp))}
                  </div>
                </button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 hover:bg-destructive/10"
                  onClick={() => removeEntry(entry.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {jsonEntries.length > 0 && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => clearByTool('json')}
              className="text-xs text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Clear JSON history
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
