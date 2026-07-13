'use client';

import React, { useState, useMemo } from 'react';
import { Search, Pin, PinOff } from 'lucide-react';
import { toolCategories } from '@/lib/tools';
import { cn } from '@/lib/utils';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface QuickAccessManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pinned: string[];
  onTogglePinned: (href: string) => void;
}

const ALL_TOOLS = toolCategories.flatMap((cat) =>
  cat.items.map((item) => ({ ...item, categoryName: cat.name }))
);

export function QuickAccessManager({ open, onOpenChange, pinned, onTogglePinned }: QuickAccessManagerProps) {
  const [search, setSearch] = useState('');

  const filteredTools = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return ALL_TOOLS;
    return ALL_TOOLS.filter((tool) =>
      tool.label.toLowerCase().includes(q) ||
      tool.desc.toLowerCase().includes(q) ||
      tool.categoryName.toLowerCase().includes(q) ||
      (tool as { keywords?: string[] }).keywords?.some((k) => k.toLowerCase().includes(q))
    );
  }, [search]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pin className="h-4 w-4" />
            Manage Quick Access
          </DialogTitle>
          <DialogDescription>
            Pin any tool to the floating dock. Calculator, Epoch Converter, and JSON Viewer open as
            an embedded mini panel; everything else opens its full page.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tools..."
            className="pl-8 h-9 text-xs"
            autoFocus
          />
        </div>

        <div className="space-y-1 max-h-96 overflow-y-auto">
          {filteredTools.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No tools match your search.</p>
          ) : (
            filteredTools.map((tool) => {
              const Icon = tool.icon;
              const isPinned = pinned.includes(tool.href);
              return (
                <button
                  key={tool.href}
                  type="button"
                  onClick={() => onTogglePinned(tool.href)}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                    isPinned ? 'bg-primary/5 border-primary/30' : 'hover:bg-muted/40'
                  )}
                >
                  <div
                    className={cn(
                      'h-8 w-8 rounded-lg flex items-center justify-center shrink-0',
                      isPinned ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-xs truncate">{tool.label}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{tool.categoryName}</div>
                  </div>
                  {isPinned ? (
                    <PinOff className="h-3.5 w-3.5 text-primary shrink-0" />
                  ) : (
                    <Pin className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
          <span>{pinned.length} tool{pinned.length === 1 ? '' : 's'} pinned</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
