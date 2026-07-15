'use client';

import React from 'react';
import { Trash2, History as HistoryIcon } from 'lucide-react';
import { useHistoryStore } from '@/store/history';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';

interface CalculatorHistoryPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoad: (equation: string) => void;
}

export function CalculatorHistoryPanel({ open, onOpenChange, onLoad }: CalculatorHistoryPanelProps) {
  const { entries, removeEntry, clearByTool } = useHistoryStore();
  const calcEntries = entries.filter((e) => e.tool === 'calculator');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HistoryIcon className="h-4 w-4" />
            Calculation History
          </DialogTitle>
          <DialogDescription>
            Your last {calcEntries.length} calculations.
          </DialogDescription>
        </DialogHeader>

        {calcEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No calculations yet <br /> press &quot;=&quot; to save one here.
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {calcEntries.map((entry) => (
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
                  <div className="font-mono text-xs truncate">
                    {entry.input} <span className="text-muted-foreground">=</span>{' '}
                    <span className="font-bold text-primary">{entry.output}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {formatTimeAgo(new Date(entry.timestamp))}
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

        {calcEntries.length > 0 && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => clearByTool('calculator')}
              className="text-xs text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Clear calculation history
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
