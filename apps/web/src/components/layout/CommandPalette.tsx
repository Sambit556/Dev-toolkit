'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, CornerDownLeft, ArrowUp, ArrowDown, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toolCategories } from '@/lib/tools';
import { cn } from '@/lib/utils';

// Flattened list of tools for easy searching
const ALL_TOOLS = toolCategories.flatMap((cat) =>
  cat.items.map((item) => ({
    ...item,
    categoryName: cat.name,
  }))
);

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const listRef = useRef<HTMLDivElement>(null);

  // Toggle listeners
  useEffect(() => {
    const handleToggle = () => setIsOpen((prev) => !prev);
    const handleOpen = () => setIsOpen(true);
    const handleClose = () => setIsOpen(false);

    window.addEventListener('open-command-palette', handleOpen);
    window.addEventListener('close-command-palette', handleClose);
    window.addEventListener('toggle-command-palette', handleToggle);

    return () => {
      window.removeEventListener('open-command-palette', handleOpen);
      window.removeEventListener('close-command-palette', handleClose);
      window.removeEventListener('toggle-command-palette', handleToggle);
    };
  }, []);

  // Keyboard shortcut listener (Ctrl+S, Cmd+S, /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }

      // '/' shortcut if not focusing an input/textarea
      if (e.key === '/') {
        const target = e.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return;
        }
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Filter tools based on search query
  const filteredTools = ALL_TOOLS.filter((tool) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      tool.label.toLowerCase().includes(q) ||
      tool.desc.toLowerCase().includes(q) ||
      tool.categoryName.toLowerCase().includes(q)
    );
  });

  // Handle keyboard navigation within the list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filteredTools.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredTools.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredTools.length) % filteredTools.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      navigateToTool(filteredTools[selectedIndex].href);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const navigateToTool = (href: string) => {
    router.push(href);
    setIsOpen(false);
    setSearch('');
  };

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent hideClose className="max-w-xl p-0 overflow-hidden border border-primary/20 bg-background/95 backdrop-blur-md shadow-2xl rounded-xl">
        <div className="flex flex-col h-[400px]" onKeyDown={handleKeyDown}>
          {/* Header Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border/80">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search features (e.g. JSON, Epoch, Base64...)"
              className="flex-1 bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground/75 text-foreground"
              autoFocus
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <div className="flex-1 overflow-y-auto p-2" ref={listRef}>
            {filteredTools.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
                <p className="text-sm">No results found for &ldquo;{search}&rdquo;</p>
              </div>
            ) : (
              filteredTools.map((tool, idx) => {
                const Icon = tool.icon;
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={tool.href}
                    onClick={() => navigateToTool(tool.href)}
                    className={cn(
                      "w-full flex items-center justify-between text-left px-3 py-2.5 rounded-lg transition-all border border-transparent",
                      isSelected
                        ? "bg-primary/10 border-primary/20 text-primary shadow-sm"
                        : "hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                          isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold block leading-normal text-foreground">{tool.label}</span>
                        <span className="text-[10px] text-muted-foreground block truncate max-w-sm sm:max-w-md">
                          {tool.desc}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground/60 bg-muted/60 px-1.5 py-0.5 rounded border border-border/50">
                        {tool.categoryName}
                      </span>
                      {isSelected && (
                        <CornerDownLeft className="h-3 w-3 text-primary animate-pulse shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Shortcuts Info */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-border/80 bg-muted/30 text-[10px] text-muted-foreground shrink-0 select-none">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <ArrowUp className="h-3 w-3" />
                <ArrowDown className="h-3 w-3" /> Navigate
              </span>
              <span className="flex items-center gap-1">
                <CornerDownLeft className="h-2.5 w-2.5" /> Select
              </span>
            </div>
            <span>Press Win/Cmd key or Ctrl+S / '/' key anytime</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
