'use client';

import React, { useState, useEffect, useRef } from 'react';
import { StickyNote, Plus, Trash2, Minimize2, Maximize2, Palette, Copy, Check, Search, GripHorizontal, Pin, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

export interface StickyNoteData {
  id: string;
  text: string;
  color: string; // Tailwind bg class
  priority: 'high' | 'medium' | 'low' | 'todo';
  x: number;
  y: number;
  w?: number;
  h?: number;
  isMinimized: boolean;
  createdAt: string;
}

const PASTEL_COLORS = [
  { name: 'Yellow', bg: 'bg-amber-100 dark:bg-amber-950/80', border: 'border-amber-200 dark:border-amber-900/50', text: 'text-amber-900 dark:text-amber-200' },
  { name: 'Red', bg: 'bg-rose-100 dark:bg-rose-950/80', border: 'border-rose-200 dark:border-rose-900/50', text: 'text-rose-900 dark:text-rose-200' },
  { name: 'Green', bg: 'bg-emerald-100 dark:bg-emerald-950/80', border: 'border-emerald-200 dark:border-emerald-900/50', text: 'text-emerald-900 dark:text-emerald-200' },
  { name: 'Blue', bg: 'bg-sky-100 dark:bg-sky-950/80', border: 'border-sky-200 dark:border-sky-900/50', text: 'text-sky-900 dark:text-sky-200' },
  { name: 'Purple', bg: 'bg-purple-100 dark:bg-purple-950/80', border: 'border-purple-200 dark:border-purple-900/50', text: 'text-purple-900 dark:text-purple-200' },
];

const PRIORITY_BADGES = {
  high: { label: 'High', class: 'bg-red-500 text-white dark:bg-red-600' },
  medium: { label: 'Medium', class: 'bg-amber-500 text-black dark:bg-amber-600 dark:text-white' },
  low: { label: 'Low', class: 'bg-blue-500 text-white dark:bg-blue-600' },
  todo: { label: 'Todo', class: 'bg-slate-500 text-white dark:bg-slate-600' },
};

export function StickyNotes() {
  const [notes, setNotes] = useState<StickyNoteData[]>([]);
  const [isOpen, setIsOpen] = useState(false); // Controls Sticky Notes Hub sidebar
  const [search, setSearch] = useState('');
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // Floating trigger Y position state
  const [triggerY, setTriggerY] = useState(250);
  const [isDraggingTrigger, setIsDraggingTrigger] = useState(false);
  const triggerDragStartRef = useRef<{ y: number; triggerY: number } | null>(null);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('devkits-sticky-notes');
    if (saved) {
      try {
        setNotes(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse sticky notes', e);
      }
    }
    const savedY = localStorage.getItem('devkits-sticky-trigger-y');
    if (savedY) {
      setTriggerY(Number(savedY));
    }
  }, []);

  // Draggable Sticky notes trigger handlers
  const startDragTrigger = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingTrigger(true);
    triggerDragStartRef.current = {
      y: e.clientY,
      triggerY: triggerY
    };
  };

  const startTouchDragTrigger = (e: React.TouchEvent) => {
    if (e.touches.length === 0) return;
    setIsDraggingTrigger(true);
    triggerDragStartRef.current = {
      y: e.touches[0].clientY,
      triggerY: triggerY
    };
  };

  useEffect(() => {
    if (!isDraggingTrigger) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!triggerDragStartRef.current) return;
      const deltaY = e.clientY - triggerDragStartRef.current.y;
      let newY = triggerDragStartRef.current.triggerY + deltaY;
      
      const screenHeight = window.innerHeight;
      newY = Math.max(50, Math.min(newY, screenHeight - 100));
      setTriggerY(newY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0 || !triggerDragStartRef.current) return;
      const deltaY = e.touches[0].clientY - triggerDragStartRef.current.y;
      let newY = triggerDragStartRef.current.triggerY + deltaY;
      
      const screenHeight = window.innerHeight;
      newY = Math.max(50, Math.min(newY, screenHeight - 100));
      setTriggerY(newY);
    };

    const handleDragEnd = (e: MouseEvent) => {
      setIsDraggingTrigger(false);
      if (triggerDragStartRef.current) {
        const deltaY = Math.abs(e.clientY - triggerDragStartRef.current.y);
        if (deltaY < 5) {
          setIsOpen((prev) => !prev);
        }
      }
      triggerDragStartRef.current = null;
      localStorage.setItem('devkits-sticky-trigger-y', String(triggerY));
    };

    const handleTouchEnd = (e: TouchEvent) => {
      setIsDraggingTrigger(false);
      if (triggerDragStartRef.current && e.changedTouches.length > 0) {
        const deltaY = Math.abs(e.changedTouches[0].clientY - triggerDragStartRef.current.y);
        if (deltaY < 5) {
          setIsOpen((prev) => !prev);
        }
      }
      triggerDragStartRef.current = null;
      localStorage.setItem('devkits-sticky-trigger-y', String(triggerY));
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDraggingTrigger, triggerY]);

  // Save to local storage
  const saveNotes = (updatedNotes: StickyNoteData[]) => {
    setNotes(updatedNotes);
    localStorage.setItem('devkits-sticky-notes', JSON.stringify(updatedNotes));
  };

  const addNote = () => {
    // Default coordinates placed right side
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;
    const defaultX = screenWidth - 320 - (notes.length * 15) % 150;
    const defaultY = 120 + (notes.length * 25) % 250;

    const newNote: StickyNoteData = {
      id: `note-${Date.now()}`,
      text: '',
      color: PASTEL_COLORS[0].bg,
      priority: 'todo',
      x: defaultX,
      y: defaultY,
      w: 256,
      h: 170,
      isMinimized: false,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    saveNotes([...notes, newNote]);
    setIsOpen(false); // Close sidebar so user can focus on editing the note
  };

  const updateNoteSize = (id: string, w: number, h: number) => {
    saveNotes(notes.map((n) => (n.id === id ? { ...n, w, h } : n)));
  };

  const updateNoteText = (id: string, text: string) => {
    saveNotes(notes.map((n) => (n.id === id ? { ...n, text } : n)));
  };

  const updateNoteColor = (id: string, color: string) => {
    saveNotes(notes.map((n) => (n.id === id ? { ...n, color } : n)));
  };

  const updateNotePriority = (id: string, priority: StickyNoteData['priority']) => {
    saveNotes(notes.map((n) => (n.id === id ? { ...n, priority } : n)));
  };

  const toggleMinimize = (id: string) => {
    saveNotes(notes.map((n) => (n.id === id ? { ...n, isMinimized: !n.isMinimized } : n)));
  };

  const deleteNote = (id: string) => {
    saveNotes(notes.filter((n) => n.id !== id));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Dragging logic
  const startDrag = (id: string, clientX: number, clientY: number, noteEl: HTMLElement) => {
    setActiveDragId(id);
    const rect = noteEl.getBoundingClientRect();
    dragOffsetRef.current = {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  useEffect(() => {
    if (!activeDragId) return;

    const handleMouseMove = (e: MouseEvent) => {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      // Calculate new coords
      let newX = e.clientX - dragOffsetRef.current.x;
      let newY = e.clientY - dragOffsetRef.current.y;

      // Keep inside viewport bounds
      newX = Math.max(10, Math.min(newX, screenWidth - 280));
      newY = Math.max(10, Math.min(newY, screenHeight - 80));

      setNotes((prev) =>
        prev.map((n) => (n.id === activeDragId ? { ...n, x: newX, y: newY } : n))
      );
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      let newX = touch.clientX - dragOffsetRef.current.x;
      let newY = touch.clientY - dragOffsetRef.current.y;

      newX = Math.max(10, Math.min(newX, screenWidth - 280));
      newY = Math.max(10, Math.min(newY, screenHeight - 80));

      setNotes((prev) =>
        prev.map((n) => (n.id === activeDragId ? { ...n, x: newX, y: newY } : n))
      );
    };

    const handleDragEnd = () => {
      setActiveDragId(null);
      // Persist the coordinates state
      localStorage.setItem('devkits-sticky-notes', JSON.stringify(notes));
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleDragEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [activeDragId, notes]);

  const filteredNotes = notes.filter((n) =>
    n.text.toLowerCase().includes(search.toLowerCase()) ||
    n.priority.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <TooltipProvider>
      {/* Floating Collapsible Stickies Dock - Placed defaultly on Right Side */}
      <div 
        style={{
          position: 'fixed',
          right: 0,
          top: `${triggerY}px`,
          zIndex: 40
        }}
        className="flex flex-col items-end"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onMouseDown={startDragTrigger}
              onTouchStart={startTouchDragTrigger}
              className={cn(
                "flex items-center gap-2 pl-2 pr-3 py-2 bg-primary text-primary-foreground font-semibold rounded-l-xl shadow-2xl transition-all duration-300 border-y border-l border-primary/20 cursor-ns-resize select-none",
                isOpen ? "translate-x-0" : "hover:-translate-x-1"
              )}
            >
              {/* Drag handles indicator */}
              <div className="flex flex-col gap-0.5 opacity-60">
                <span className="h-0.5 w-0.5 bg-white rounded-full" />
                <span className="h-0.5 w-0.5 bg-white rounded-full" />
                <span className="h-0.5 w-0.5 bg-white rounded-full" />
              </div>
              <StickyNote className="h-4 w-4 shrink-0" />
              <span className="text-xs hidden sm:inline">Sticky Notes</span>
              {notes.length > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-black text-white shrink-0">
                  {notes.length}
                </span>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="text-xs">Toggle / Drag Sticky Notes Manager</TooltipContent>
        </Tooltip>
      </div>

      {/* Slide-out Notes Manager Panel */}
      {isOpen && (
        <div className="fixed right-0 top-0 bottom-0 w-80 bg-background/95 backdrop-blur-md border-l border-border/80 shadow-2xl z-50 flex flex-col p-4 animate-slide-in-right">
          <div className="flex items-center justify-between pb-3 border-b">
            <div className="flex items-center gap-2">
              <StickyNote className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-sm">Sticky Notes Manager</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground p-1 hover:bg-muted/80 rounded-md transition-colors"
              title="Close Sidebar"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="py-3 flex gap-2">
            <button
              onClick={addNote}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-primary/10 hover:bg-primary/15 text-primary text-xs font-bold rounded-lg border border-primary/20 transition-all"
            >
              <Plus className="h-3.5 w-3.5" /> Add New Note
            </button>
          </div>

          {/* Search bar inside hub */}
          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes / priority..."
              className="w-full pl-8 pr-3 py-1.5 bg-muted/40 border rounded-lg text-xs outline-none focus:border-primary/40 text-foreground"
            />
          </div>

          {/* List of notes */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {filteredNotes.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-10">
                No notes found. Create one to get started!
              </div>
            ) : (
              filteredNotes.map((note) => {
                const colorObj = PASTEL_COLORS.find((c) => c.bg === note.color) || PASTEL_COLORS[0];
                return (
                  <div
                    key={note.id}
                    className={cn(
                      "p-3 rounded-lg border flex flex-col gap-2 transition-all",
                      colorObj.bg,
                      colorObj.border
                    )}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className={cn("text-[9px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider shadow-sm", PRIORITY_BADGES[note.priority].class)}>
                        {PRIORITY_BADGES[note.priority].label}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">{note.createdAt}</span>
                      <div className="flex items-center gap-1.5 ml-auto">
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded p-0.5 transition-colors"
                          title="Delete note"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <p className={cn("text-xs line-clamp-2 italic", colorObj.text)}>
                      {note.text || 'Empty note... click drag notes on screen to edit.'}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Floating Draggable Notes on Viewport */}
      {notes.map((note) => {
        const colorObj = PASTEL_COLORS.find((c) => c.bg === note.color) || PASTEL_COLORS[0];
        const isDragging = activeDragId === note.id;

        // Calculate a stable slight rotation tilt for corkboard look based on the ID timestamp
        const timestamp = parseInt(note.id.split('-')[1]) || Date.now();
        const tiltDeg = ((timestamp % 5) - 2) * 0.9; // yields -1.8deg to +1.8deg

        return (
          <div
            key={note.id}
            style={{
              position: 'fixed',
              left: `${note.x}px`,
              top: `${note.y}px`,
              width: note.isMinimized ? '170px' : `${note.w ?? 256}px`,
              height: note.isMinimized ? '34px' : `${note.h ?? 170}px`,
              zIndex: isDragging ? 60 : 30,
              transform: isDragging ? 'scale(1.02)' : `rotate(${tiltDeg}deg)`,
              transition: isDragging ? 'none' : 'transform 0.15s ease-out, shadow 0.15s ease-out',
              resize: note.isMinimized ? 'none' : 'both',
              overflow: 'hidden',
              minWidth: note.isMinimized ? '160px' : '200px',
              minHeight: note.isMinimized ? '34px' : '130px',
            }}
            onMouseUp={(e) => {
              if (activeDragId) return; // ignore sizes updating during drags
              const el = e.currentTarget;
              const newW = el.offsetWidth;
              const newH = el.offsetHeight;
              if (newW !== note.w || newH !== note.h) {
                updateNoteSize(note.id, newW, newH);
              }
            }}
            className={cn(
              "rounded-xl border shadow-2xl flex flex-col backdrop-blur-sm relative",
              colorObj.bg,
              colorObj.border,
              isDragging ? "shadow-primary/30 ring-2 ring-primary/20" : "hover:shadow-primary/10"
            )}
          >
            {/* 3D Push Pin Decoration on Header */}
            {!note.isMinimized && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]">
                <Pin className="h-4.5 w-4.5 text-rose-500 fill-rose-500 rotate-45 transform" />
              </div>
            )}

            {/* Draggable Note Header */}
            <div
              onMouseDown={(e) => startDrag(note.id, e.clientX, e.clientY, e.currentTarget.parentElement!)}
              onTouchStart={(e) => {
                if (e.touches.length > 0) {
                  startDrag(note.id, e.touches[0].clientX, e.touches[0].clientY, e.currentTarget.parentElement!);
                }
              }}
              className="flex items-center justify-between px-2.5 py-1.5 cursor-move bg-muted/40 dark:bg-muted/10 border-b border-border/10 select-none shrink-0"
            >
              <div className="flex items-center gap-1.5">
                <GripHorizontal className="h-3.5 w-3.5 text-muted-foreground/75 shrink-0" />
                {/* Clickable Badge to cycle priority */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const priorities: StickyNoteData['priority'][] = ['high', 'medium', 'low', 'todo'];
                        const nextIdx = (priorities.indexOf(note.priority) + 1) % priorities.length;
                        updateNotePriority(note.id, priorities[nextIdx]);
                      }}
                      className={cn("text-[9px] font-black uppercase px-1.5 py-0.5 rounded tracking-widest shadow-sm transition-transform active:scale-95", PRIORITY_BADGES[note.priority].class)}
                    >
                      {PRIORITY_BADGES[note.priority].label}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-[10px] py-1 px-2">Cycle priority tag</TooltipContent>
                </Tooltip>
              </div>

              {/* Note actions */}
              <div className="flex items-center gap-1 ml-auto" onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
                {/* Color Cycle Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        const colors = PASTEL_COLORS.map((c) => c.bg);
                        const nextIdx = (colors.indexOf(note.color) + 1) % colors.length;
                        updateNoteColor(note.id, colors[nextIdx]);
                      }}
                      className="text-muted-foreground/80 hover:text-foreground p-1 rounded transition-colors"
                    >
                      <Palette className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-[10px] py-1 px-2">Change note color</TooltipContent>
                </Tooltip>

                {/* Copy content */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => copyToClipboard(note.text)}
                      className="text-muted-foreground/80 hover:text-foreground p-1 rounded transition-colors"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-[10px] py-1 px-2">Copy content</TooltipContent>
                </Tooltip>

                {/* Minimize toggle */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => toggleMinimize(note.id)}
                      className="text-muted-foreground/80 hover:text-foreground p-1 rounded transition-colors"
                    >
                      {note.isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-[10px] py-1 px-2">
                    {note.isMinimized ? 'Expand note' : 'Minimize note'}
                  </TooltipContent>
                </Tooltip>

                {/* Delete button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-500/10 p-1 rounded transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-[10px] py-1 px-2">Delete note</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Note text content with College Ruled Notebook Lines */}
            {!note.isMinimized && (
              <div className="p-3 flex-1 flex flex-col min-h-0">
                <textarea
                  value={note.text}
                  onChange={(e) => updateNoteText(note.id, e.target.value)}
                  placeholder="Type notes / clipboard history..."
                  className={cn(
                    "w-full flex-1 bg-transparent resize-none border-0 outline-none text-xs font-semibold leading-relaxed placeholder:text-muted-foreground/50",
                    colorObj.text
                  )}
                  style={{
                    backgroundImage: 'linear-gradient(rgba(156, 163, 175, 0.15) 1px, transparent 1px)',
                    backgroundSize: '100% 1.5rem',
                    lineHeight: '1.5rem',
                    paddingTop: '0.1rem',
                  }}
                  onMouseDown={(e) => e.stopPropagation()} // Don't drag while editing
                  onTouchStart={(e) => e.stopPropagation()}
                />
                <span className="text-[8px] text-muted-foreground/50 text-right font-mono mt-1 block select-none shrink-0">
                  Created {note.createdAt}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </TooltipProvider>
  );
}
