'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Calculator, Clock, Braces, X, Play, RotateCcw, Copy, Check, GripHorizontal, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { toolCategories } from '@/lib/tools';
import { QuickAccessManager } from './QuickAccessManager';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

type ActiveTool = 'calc' | 'epoch' | 'json' | null;

interface PanelPos {
  x: number;
  y: number;
}

interface PanelSize {
  width: number;
  height: number;
}

const MIN_PANEL_WIDTH = 220;
const MAX_PANEL_WIDTH = 560;
const MIN_PANEL_HEIGHT = 200;
const MAX_PANEL_HEIGHT = 720;
const clampPanelDim = (v: number, min: number, max: number) => Math.max(min, Math.min(v, max));

// The 3 tools below have a built-in embedded mini panel (see MiniCalculator/
// MiniEpochConverter/MiniJsonViewer). Any other pinned tool just navigates to
// its full page instead — building a mini widget for all ~30 platform tools
// is out of scope for this quick-launch dock.
const WIDGET_HREFS: Record<string, Exclude<ActiveTool, null>> = {
  '/calculator': 'calc',
  '/epoch': 'epoch',
  '/json': 'json',
};

const DEFAULT_PINNED = ['/calculator', '/epoch', '/json'];
const PINNED_STORAGE_KEY = 'devkits-quick-tools';

const ALL_TOOLS = toolCategories.flatMap((cat) => cat.items.map((item) => ({ ...item, categoryName: cat.name })));

export function QuickAccess() {
  const router = useRouter();
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);
  const [pinned, setPinned] = useState<string[]>(DEFAULT_PINNED);
  const [manageOpen, setManageOpen] = useState(false);

  // Floating panel positions
  const [calcPos, setCalcPos] = useState<PanelPos>({ x: 80, y: 150 });
  const [epochPos, setEpochPos] = useState<PanelPos>({ x: 80, y: 150 });
  const [jsonPos, setJsonPos] = useState<PanelPos>({ x: 80, y: 150 });

  const [dragOffset, setDragOffset] = useState<PanelPos>({ x: 0, y: 0 });
  const [draggingTool, setDraggingTool] = useState<ActiveTool>(null);

  // Panel sizes (null = natural/default size until the user drags a resize handle)
  const [panelSizes, setPanelSizes] = useState<Record<Exclude<ActiveTool, null>, PanelSize | null>>({
    calc: null,
    epoch: null,
    json: null,
  });
  const [resizingTool, setResizingTool] = useState<ActiveTool>(null);
  const resizeStartRef = useRef<{ x: number; y: number; width: number; height: number; maxWidth: number; maxHeight: number }>({
    x: 0, y: 0, width: 0, height: 0, maxWidth: MAX_PANEL_WIDTH, maxHeight: MAX_PANEL_HEIGHT,
  });
  // Refs to each panel's scrollable content wrapper, so a resize can measure
  // how big the content actually is and stop growing there — otherwise
  // dragging past a panel's natural size (e.g. the calculator's fixed button
  // grid) just leaves dead empty space around the content.
  const calcContentRef = useRef<HTMLDivElement>(null);
  const epochContentRef = useRef<HTMLDivElement>(null);
  const jsonContentRef = useRef<HTMLDivElement>(null);
  const contentRefs: Record<Exclude<ActiveTool, null>, React.RefObject<HTMLDivElement | null>> = {
    calc: calcContentRef,
    epoch: epochContentRef,
    json: jsonContentRef,
  };

  // Quick Dock Pos state and dragging refs
  const [dockPos, setDockPos] = useState<PanelPos>({ x: 16, y: 250 });
  const [isDraggingDock, setIsDraggingDock] = useState(false);
  const dockDragOffsetRef = useRef<PanelPos>({ x: 0, y: 0 });
  const dockRef = useRef<HTMLDivElement>(null);

  // Reads localStorage, so this must run client-only: this page is statically prerendered,
  // and lazy useState initializers would run again (with real data) during the client's
  // first hydration render, mismatching the server-rendered (default) HTML for any returning user.
  useEffect(() => {
    const savedDock = localStorage.getItem('devkits-quick-dock-pos');
    if (savedDock) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDockPos(JSON.parse(savedDock));
      } catch {}
    }
    const savedPinned = localStorage.getItem(PINNED_STORAGE_KEY);
    if (savedPinned) {
      try {
        const parsed = JSON.parse(savedPinned);
        if (Array.isArray(parsed)) setPinned(parsed);
      } catch {}
    }
  }, []);

  const togglePinned = (href: string) => {
    setPinned((prev) => {
      const next = prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href];
      localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleLaunch = (href: string) => {
    const widgetKey = WIDGET_HREFS[href];
    if (widgetKey) {
      toggleTool(widgetKey);
    } else {
      router.push(href);
    }
  };

  const handleDockMouseDown = (e: React.MouseEvent, dockEl: HTMLElement) => {
    setIsDraggingDock(true);
    const rect = dockEl.getBoundingClientRect();
    dockDragOffsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleDockTouchStart = (e: React.TouchEvent, dockEl: HTMLElement) => {
    if (e.touches.length === 0) return;
    setIsDraggingDock(true);
    const touch = e.touches[0];
    const rect = dockEl.getBoundingClientRect();
    dockDragOffsetRef.current = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
  };

  // Dragging logic
  const handleMouseDown = (tool: ActiveTool, e: React.MouseEvent, panelEl: HTMLElement) => {
    setDraggingTool(tool);
    const rect = panelEl.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleTouchStart = (tool: ActiveTool, e: React.TouchEvent, panelEl: HTMLElement) => {
    if (e.touches.length === 0) return;
    setDraggingTool(tool);
    const touch = e.touches[0];
    const rect = panelEl.getBoundingClientRect();
    setDragOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    });
  };

  // Measures how tall a panel's content actually needs to be (scrollHeight,
  // which reflects full content height even while currently clipped/scrolled)
  // plus whatever chrome sits around it (header, resize-handle strip), so
  // resizing can be capped there instead of growing into empty dead space
  // below a fixed-height content block (e.g. the calculator's button grid).
  //
  // Width is never capped this way and always uses the flat MAX_PANEL_WIDTH
  // ceiling for every tool — Calculator/Epoch's rows are built from flexible
  // (`flex-1`/grid-fr) elements that stretch to fill whatever width they're
  // given with no dead space, so there's no "natural" width to measure
  // against; capping it to scrollWidth (which, for already-fluid content,
  // just equals the current width) doesn't bound growth to something
  // reasonable, it freezes width resizing entirely — every tool must stay
  // freely resizable in both directions, min and max, the same as JSON.
  const measureMaxHeight = (tool: ActiveTool, rect: DOMRect): number => {
    if (tool === 'json') return MAX_PANEL_HEIGHT;
    const contentEl = tool ? contentRefs[tool].current : null;
    if (!contentEl) return MAX_PANEL_HEIGHT;
    const chrome = rect.height - contentEl.clientHeight;
    return clampPanelDim(contentEl.scrollHeight + chrome, MIN_PANEL_HEIGHT, MAX_PANEL_HEIGHT);
  };

  // Resizing logic — grabs the panel's current rendered size as the baseline
  // (so a panel that's never been resized starts from its natural size,
  // rather than jumping to some fixed default) then grows/shrinks from there.
  const handleResizeStart = (tool: ActiveTool, e: React.MouseEvent, panelEl: HTMLElement) => {
    e.stopPropagation();
    const rect = panelEl.getBoundingClientRect();
    resizeStartRef.current = {
      x: e.clientX, y: e.clientY, width: rect.width, height: rect.height,
      maxWidth: MAX_PANEL_WIDTH, maxHeight: measureMaxHeight(tool, rect),
    };
    setResizingTool(tool);
  };

  const handleResizeTouchStart = (tool: ActiveTool, e: React.TouchEvent, panelEl: HTMLElement) => {
    if (e.touches.length === 0) return;
    e.stopPropagation();
    const touch = e.touches[0];
    const rect = panelEl.getBoundingClientRect();
    resizeStartRef.current = {
      x: touch.clientX, y: touch.clientY, width: rect.width, height: rect.height,
      maxWidth: MAX_PANEL_WIDTH, maxHeight: measureMaxHeight(tool, rect),
    };
    setResizingTool(tool);
  };

  // Dragging effect for individual panels, the dock, and panel resizing
  useEffect(() => {
    if (!draggingTool && !isDraggingDock && !resizingTool) return;

    // Force the cursor for the whole document (not just whatever element
    // happens to be under the pointer at each instant) and block text
    // selection while a drag/resize is in progress — without this, moving
    // the mouse fast off the tiny resize handle mid-drag left the cursor
    // looking "stuck" on whatever icon the pointer last crossed, and text
    // on the page would get selected as the mouse swept over it. The cleanup
    // below always resets both, so releasing the mouse anywhere clears it.
    document.body.style.cursor = resizingTool ? 'nwse-resize' : draggingTool || isDraggingDock ? 'grabbing' : '';
    document.body.style.userSelect = 'none';

    const applyResize = (tool: Exclude<ActiveTool, null>, clientX: number, clientY: number) => {
      const start = resizeStartRef.current;
      const width = clampPanelDim(start.width + (clientX - start.x), MIN_PANEL_WIDTH, start.maxWidth);
      const height = clampPanelDim(start.height + (clientY - start.y), MIN_PANEL_HEIGHT, start.maxHeight);
      setPanelSizes((prev) => ({ ...prev, [tool]: { width, height } }));
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (draggingTool) {
        let newX = e.clientX - dragOffset.x;
        let newY = e.clientY - dragOffset.y;

        newX = Math.max(10, Math.min(newX, window.innerWidth - 300));
        newY = Math.max(10, Math.min(newY, window.innerHeight - 300));

        if (draggingTool === 'calc') setCalcPos({ x: newX, y: newY });
        if (draggingTool === 'epoch') setEpochPos({ x: newX, y: newY });
        if (draggingTool === 'json') setJsonPos({ x: newX, y: newY });
      } else if (isDraggingDock) {
        let newX = e.clientX - dockDragOffsetRef.current.x;
        let newY = e.clientY - dockDragOffsetRef.current.y;

        newX = Math.max(5, Math.min(newX, window.innerWidth - 65));
        newY = Math.max(5, Math.min(newY, window.innerHeight - 200));

        setDockPos({ x: newX, y: newY });
      } else if (resizingTool) {
        applyResize(resizingTool, e.clientX, e.clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const touch = e.touches[0];

      if (draggingTool) {
        let newX = touch.clientX - dragOffset.x;
        let newY = touch.clientY - dragOffset.y;

        newX = Math.max(10, Math.min(newX, window.innerWidth - 300));
        newY = Math.max(10, Math.min(newY, window.innerHeight - 300));

        if (draggingTool === 'calc') setCalcPos({ x: newX, y: newY });
        if (draggingTool === 'epoch') setEpochPos({ x: newX, y: newY });
        if (draggingTool === 'json') setJsonPos({ x: newX, y: newY });
      } else if (isDraggingDock) {
        let newX = touch.clientX - dockDragOffsetRef.current.x;
        let newY = touch.clientY - dockDragOffsetRef.current.y;

        newX = Math.max(5, Math.min(newX, window.innerWidth - 65));
        newY = Math.max(5, Math.min(newY, window.innerHeight - 200));

        setDockPos({ x: newX, y: newY });
      } else if (resizingTool) {
        applyResize(resizingTool, touch.clientX, touch.clientY);
      }
    };

    const handleDragEnd = () => {
      if (isDraggingDock) {
        setIsDraggingDock(false);
        // Persist dock position
        localStorage.setItem('devkits-quick-dock-pos', JSON.stringify(dockPos));
      }
      setDraggingTool(null);
      setResizingTool(null);
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
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [draggingTool, dragOffset, isDraggingDock, dockPos, resizingTool]);

  const toggleTool = (tool: ActiveTool) => {
    setActiveTool((prev) => (prev === tool ? null : tool));
  };

  return (
    <TooltipProvider delayDuration={200}>
      {/* Floating Vertical Launch Dock (Draggable toolbar) */}
      <div
          ref={dockRef}
          style={{
            position: 'fixed',
            left: `${dockPos.x}px`,
            top: `${dockPos.y}px`,
            zIndex: 40
          }}
          className="flex flex-col gap-3.5 bg-background/70 dark:bg-slate-900/80 backdrop-blur-md border border-border/80 p-2 rounded-2xl shadow-2xl animate-fade-in select-none"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                onMouseDown={(e) => handleDockMouseDown(e, dockRef.current!)}
                onTouchStart={(e) => handleDockTouchStart(e, dockRef.current!)}
                className="cursor-move flex flex-col items-center gap-1 border-b pb-2 px-1 hover:text-primary transition-colors text-muted-foreground/80"
              >
                <GripHorizontal className="h-3.5 w-3.5" />
                <div className="text-[8px] uppercase tracking-widest font-black text-center">
                  Quick
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">Drag to reposition toolbar</TooltipContent>
          </Tooltip>

          {pinned.map((href) => {
            const tool = ALL_TOOLS.find((t) => t.href === href);
            if (!tool) return null;
            const Icon = tool.icon;
            const widgetKey = WIDGET_HREFS[href];
            const isActive = widgetKey !== undefined && activeTool === widgetKey;
            return (
              <Tooltip key={href}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleLaunch(href)}
                    className={cn(
                      "h-10 w-10 flex items-center justify-center rounded-xl transition-all shadow-sm active:scale-95",
                      isActive
                        ? "bg-primary text-primary-foreground scale-105"
                        : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">{tool.label}</TooltipContent>
              </Tooltip>
            );
          })}

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setManageOpen(true)}
                className="h-10 w-10 flex items-center justify-center rounded-xl transition-all shadow-sm active:scale-95 bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground border border-dashed border-border/80"
              >
                <Settings2 className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Manage Quick Access tools</TooltipContent>
          </Tooltip>
      </div>

      <QuickAccessManager
        open={manageOpen}
        onOpenChange={setManageOpen}
        pinned={pinned}
        onTogglePinned={togglePinned}
      />

      {/* Floating Mini Panels */}
      {activeTool === 'calc' && (
        <div
          style={{
            position: 'fixed', left: `${calcPos.x}px`, top: `${calcPos.y}px`, zIndex: 50,
            width: panelSizes.calc ? `${panelSizes.calc.width}px` : undefined,
            height: panelSizes.calc ? `${panelSizes.calc.height}px` : undefined,
          }}
          className={cn(
            'bg-background/95 border border-border/80 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-md animate-fade-in flex flex-col',
            !panelSizes.calc && 'w-64',
          )}
        >
          <MiniPanelHeader
            title="Calculator"
            icon={<Calculator className="h-4 w-4 text-primary" />}
            onClose={() => setActiveTool(null)}
            onMouseDown={(e) => handleMouseDown('calc', e, e.currentTarget.parentElement!)}
            onTouchStart={(e) => {
              if (e.touches.length > 0) {
                handleTouchStart('calc', e, e.currentTarget.parentElement!);
              }
            }}
          />
          <div ref={calcContentRef} className="flex-1 min-h-0 overflow-y-auto">
            <MiniCalculator />
          </div>
          <ResizeHandle
            onMouseDown={(e) => handleResizeStart('calc', e, e.currentTarget.parentElement!)}
            onTouchStart={(e) => handleResizeTouchStart('calc', e, e.currentTarget.parentElement!)}
          />
        </div>
      )}

      {activeTool === 'epoch' && (
        <div
          style={{
            position: 'fixed', left: `${epochPos.x}px`, top: `${epochPos.y}px`, zIndex: 50,
            width: panelSizes.epoch ? `${panelSizes.epoch.width}px` : undefined,
            height: panelSizes.epoch ? `${panelSizes.epoch.height}px` : undefined,
          }}
          className={cn(
            'bg-background/95 border border-border/80 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-md animate-fade-in flex flex-col',
            !panelSizes.epoch && 'w-72',
          )}
        >
          <MiniPanelHeader
            title="Epoch Converter"
            icon={<Clock className="h-4 w-4 text-primary" />}
            onClose={() => setActiveTool(null)}
            onMouseDown={(e) => handleMouseDown('epoch', e, e.currentTarget.parentElement!)}
            onTouchStart={(e) => {
              if (e.touches.length > 0) {
                handleTouchStart('epoch', e, e.currentTarget.parentElement!);
              }
            }}
          />
          <div ref={epochContentRef} className="flex-1 min-h-0 overflow-y-auto">
            <MiniEpochConverter />
          </div>
          <ResizeHandle
            onMouseDown={(e) => handleResizeStart('epoch', e, e.currentTarget.parentElement!)}
            onTouchStart={(e) => handleResizeTouchStart('epoch', e, e.currentTarget.parentElement!)}
          />
        </div>
      )}

      {activeTool === 'json' && (
        <div
          style={{
            position: 'fixed', left: `${jsonPos.x}px`, top: `${jsonPos.y}px`, zIndex: 50,
            width: panelSizes.json ? `${panelSizes.json.width}px` : undefined,
            height: panelSizes.json ? `${panelSizes.json.height}px` : undefined,
          }}
          className={cn(
            'bg-background/95 border border-border/80 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-md animate-fade-in flex flex-col',
            !panelSizes.json && 'w-80',
          )}
        >
          <MiniPanelHeader
            title="JSON Formatter"
            icon={<Braces className="h-4 w-4 text-primary" />}
            onClose={() => setActiveTool(null)}
            onMouseDown={(e) => handleMouseDown('json', e, e.currentTarget.parentElement!)}
            onTouchStart={(e) => {
              if (e.touches.length > 0) {
                handleTouchStart('json', e, e.currentTarget.parentElement!);
              }
            }}
          />
          <div ref={jsonContentRef} className="flex-1 min-h-0 overflow-y-auto">
            <MiniJsonViewer />
          </div>
          <ResizeHandle
            onMouseDown={(e) => handleResizeStart('json', e, e.currentTarget.parentElement!)}
            onTouchStart={(e) => handleResizeTouchStart('json', e, e.currentTarget.parentElement!)}
          />
        </div>
      )}
    </TooltipProvider>
  );
}

/* Header for all mini panels */
interface MiniHeaderProps {
  title: string;
  icon: React.ReactNode;
  onClose: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
}

function MiniPanelHeader({ title, icon, onClose, onMouseDown, onTouchStart }: MiniHeaderProps) {
  return (
    <div
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      className="flex items-center justify-between px-3.5 py-2.5 bg-muted/40 cursor-move border-b select-none font-bold text-xs"
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <GripHorizontal className="h-3.5 w-3.5 text-muted-foreground/75 shrink-0" />
        {icon}
        <span className="truncate text-foreground">{title}</span>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="text-muted-foreground hover:text-foreground p-0.5 rounded-md hover:bg-muted/80 ml-2"
        onMouseDown={(e) => e.stopPropagation()} // Don't trigger drag when clicking close
        onTouchStart={(e) => e.stopPropagation()}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* Bottom-right resize grip for a mini panel — lets the user grow/shrink the
   panel by dragging, independent of moving it (which the header handles). */
function ResizeHandle({
  onMouseDown,
  onTouchStart,
}: {
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize touch-none flex items-end justify-end p-0.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          <svg viewBox="0 0 10 10" className="h-2.5 w-2.5 fill-current">
            <circle cx="8" cy="2" r="1" />
            <circle cx="8" cy="5" r="1" />
            <circle cx="8" cy="8" r="1" />
            <circle cx="5" cy="8" r="1" />
            <circle cx="2" cy="8" r="1" />
          </svg>
        </div>
      </TooltipTrigger>
      <TooltipContent side="left">Drag to resize</TooltipContent>
    </Tooltip>
  );
}

/* Small copy-to-clipboard icon button used throughout the mini panels, with a styled tooltip instead of a native title attribute */
function CopyIconButton({ onCopy, label, className }: { onCopy: () => void; label: string; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onCopy}
          className={cn('p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors ml-2 shrink-0', className)}
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

// Evaluates a "num op num op num ..." chain (the only shape MiniCalculator
// ever produces) with standard * / before + - precedence. Tokenizes by
// scanning for digit runs and operator characters directly, rather than
// splitting on whitespace, so it works whether the user typed "5+3" or
// clicked buttons that insert " + " with spaces.
function evaluateArithmetic(expression: string): number {
  const tokens = expression.match(/\d+\.?\d*|[+\-*/]/g);
  if (!tokens || tokens.length === 0 || tokens.length % 2 === 0 || /^[+\-*/]$/.test(tokens[0])) {
    throw new Error('Invalid expression');
  }

  const stack: (number | string)[] = [Number(tokens[0])];
  for (let i = 1; i < tokens.length; i += 2) {
    const op = tokens[i];
    const num = Number(tokens[i + 1]);
    if (op === '*' || op === '/') {
      const prev = stack.pop() as number;
      stack.push(op === '*' ? prev * num : prev / num);
    } else {
      stack.push(op, num);
    }
  }

  let result = stack[0] as number;
  for (let i = 1; i < stack.length; i += 2) {
    const op = stack[i] as string;
    const num = stack[i + 1] as number;
    result = op === '+' ? result + num : result - num;
  }
  return result;
}

/* Mini Calculator Logic */
function MiniCalculator() {
  // A single freely-editable expression string, so the field behaves like a
  // normal text input: type digits/operators directly, click anywhere to
  // change a number, select-and-retype, etc. Starts empty (with a "0"
  // placeholder) rather than pre-filled with "0" — a pre-filled value means
  // typed digits land next to the leftover zero instead of replacing it
  // (e.g. typing "12+30" into a field that already contains "0" becomes
  // "12+300"), silently producing the wrong result.
  // `justCalculated` only affects button clicks (a digit button after "="
  // starts a fresh expression, matching standard calculator UX) — direct
  // typing always edits in place.
  const [expression, setExpression] = useState('');
  const [justCalculated, setJustCalculated] = useState(false);
  // The equation that produced the current result, shown small above the
  // input (e.g. "9 * 9 =") once you hit "=" — it's the only trace of what
  // you actually typed once the input itself gets replaced by the answer.
  const [lastEquation, setLastEquation] = useState('');

  const sanitize = (v: string) => v.replace(/[^0-9.+\-*/\s]/g, '');

  const handleNum = (num: string) => {
    setExpression((prev) => (justCalculated || !prev ? num : prev + num));
    setJustCalculated(false);
  };

  const handleOp = (op: string) => {
    // Ignore operator presses with nothing to operate on yet, rather than
    // producing a leading-operator expression like " + " that can't evaluate.
    setExpression((prev) => (prev.trim() ? `${prev.trim()} ${op} ` : prev));
    setJustCalculated(false);
  };

  const handleClear = () => {
    setExpression('');
    setJustCalculated(false);
    setLastEquation('');
  };

  const handleBackspace = () => {
    setExpression((prev) => prev.slice(0, -1));
    setJustCalculated(false);
  };

  const handleCalc = () => {
    const trimmed = expression.trim();
    if (!trimmed) return;
    try {
      const result = evaluateArithmetic(trimmed);
      setLastEquation(trimmed);
      setExpression(Number(result.toFixed(6)).toString());
    } catch {
      setLastEquation('');
      setExpression('Error');
    }
    setJustCalculated(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExpression(sanitize(e.target.value));
    setJustCalculated(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCalc();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleClear();
    }
  };

  return (
    <div className="p-3 bg-card space-y-2 select-none" onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
      <div className="bg-muted/50 rounded-lg p-2 border text-right">
        <div className="text-[10px] text-muted-foreground font-mono truncate h-4 leading-4">
          {lastEquation && `${lastEquation} =`}
        </div>
        <input
          type="text"
          inputMode="decimal"
          value={expression}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          placeholder="0"
          className="w-full bg-transparent text-right text-xl font-bold font-mono text-foreground outline-none truncate placeholder:text-foreground"
        />
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        <button onClick={handleClear} className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-lg font-bold text-xs">C</button>
        <button onClick={() => handleOp('/')} className="p-2 bg-muted/80 hover:bg-muted text-foreground rounded-lg font-bold text-xs">/</button>
        <button onClick={() => handleOp('*')} className="p-2 bg-muted/80 hover:bg-muted text-foreground rounded-lg font-bold text-xs">*</button>
        <button onClick={() => handleOp('-')} className="p-2 bg-muted/80 hover:bg-muted text-foreground rounded-lg font-bold text-xs">-</button>

        <button onClick={() => handleNum('7')} className="p-2 bg-muted/20 hover:bg-muted/30 text-foreground rounded-lg font-bold text-xs">7</button>
        <button onClick={() => handleNum('8')} className="p-2 bg-muted/20 hover:bg-muted/30 text-foreground rounded-lg font-bold text-xs">8</button>
        <button onClick={() => handleNum('9')} className="p-2 bg-muted/20 hover:bg-muted/30 text-foreground rounded-lg font-bold text-xs">9</button>
        <button onClick={() => handleOp('+')} className="p-2 bg-muted/80 hover:bg-muted text-foreground rounded-lg font-bold text-xs">+</button>

        <button onClick={() => handleNum('4')} className="p-2 bg-muted/20 hover:bg-muted/30 text-foreground rounded-lg font-bold text-xs">4</button>
        <button onClick={() => handleNum('5')} className="p-2 bg-muted/20 hover:bg-muted/30 text-foreground rounded-lg font-bold text-xs">5</button>
        <button onClick={() => handleNum('6')} className="p-2 bg-muted/20 hover:bg-muted/30 text-foreground rounded-lg font-bold text-xs">6</button>
        <button onClick={handleCalc} className="row-span-2 p-2 bg-primary text-primary-foreground rounded-lg font-bold text-xs flex items-center justify-center">=</button>

        <button onClick={() => handleNum('1')} className="p-2 bg-muted/20 hover:bg-muted/30 text-foreground rounded-lg font-bold text-xs">1</button>
        <button onClick={() => handleNum('2')} className="p-2 bg-muted/20 hover:bg-muted/30 text-foreground rounded-lg font-bold text-xs">2</button>
        <button onClick={() => handleNum('3')} className="p-2 bg-muted/20 hover:bg-muted/30 text-foreground rounded-lg font-bold text-xs">3</button>

        <button onClick={() => handleNum('0')} className="col-span-2 p-2 bg-muted/20 hover:bg-muted/30 text-foreground rounded-lg font-bold text-xs">0</button>
        <button onClick={() => handleNum('.')} className="p-2 bg-muted/20 hover:bg-muted/30 text-foreground rounded-lg font-bold text-xs">.</button>
        <button onClick={handleBackspace} aria-label="Backspace" className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-lg font-bold text-xs flex items-center justify-center">⌫</button>
      </div>
    </div>
  );
}
/* Mini Epoch Converter Logic */
function MiniEpochConverter() {
  const [liveEpoch, setLiveEpoch] = useState<number>(0);
  const [inputTs, setInputTs] = useState('');
  const [dateOutputLocal, setDateOutputLocal] = useState('');
  const [dateOutputUtc, setDateOutputUtc] = useState('');
  const [inputDate, setInputDate] = useState('');
  const [tsOutputSec, setTsOutputSec] = useState('');
  const [tsOutputMs, setTsOutputMs] = useState('');

  // Live timer clock: a genuine setInterval subscription to the passage of time.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLiveEpoch(Math.floor(Date.now() / 1000));
    const interval = setInterval(() => {
      setLiveEpoch(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const convertTs = () => {
    const clean = inputTs.trim();
    if (!clean) {
      setDateOutputLocal('');
      setDateOutputUtc('');
      return;
    }
    const val = Number(clean);
    if (isNaN(val) || val < 0) {
      setDateOutputLocal('Invalid Timestamp');
      setDateOutputUtc('Invalid Timestamp');
      return;
    }
    // Auto-detect seconds vs milliseconds
    const date = new Date(val > 99999999999 ? val : val * 1000);
    setDateOutputLocal(date.toLocaleString());
    setDateOutputUtc(date.toUTCString());
  };

  const convertDate = () => {
    if (!inputDate.trim()) {
      setTsOutputSec('');
      setTsOutputMs('');
      return;
    }
    const d = new Date(inputDate);
    if (isNaN(d.getTime())) {
      setTsOutputSec('Invalid Date');
      setTsOutputMs('Invalid Date');
      return;
    }
    setTsOutputSec(Math.floor(d.getTime() / 1000).toString());
    setTsOutputMs(d.getTime().toString());
  };

  return (
    <div className="p-3 bg-card space-y-3 font-medium text-xs leading-normal select-none" onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
      <div className="bg-muted/40 p-2.5 rounded-lg border flex flex-col gap-1">
        <span className="text-[10px] text-muted-foreground">Live Unix Epoch Time</span>
        <div className="flex items-center justify-between">
          <span className="font-mono text-base font-extrabold text-primary select-text">{liveEpoch}</span>
          <CopyIconButton
            onCopy={() => {
              navigator.clipboard.writeText(liveEpoch.toString());
              toast.success('Copied live timestamp!');
            }}
            label="Copy Live Timestamp"
          />
        </div>
      </div>

      {/* Timestamp -> Date */}
      <div className="space-y-1">
        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Timestamp → Date</span>
        <div className="flex gap-1.5">
          <input
            type="text"
            value={inputTs}
            onChange={(e) => setInputTs(e.target.value)}
            placeholder="e.g. 1719918233"
            className="flex-1 px-2.5 py-1.5 bg-muted/40 border rounded-lg text-xs outline-none text-foreground font-mono"
          />
          <button onClick={convertTs} className="px-2.5 bg-primary text-primary-foreground hover:opacity-90 rounded-lg text-xs font-bold shrink-0">
            Go
          </button>
        </div>
        {dateOutputLocal && (
          <div className="space-y-1 animate-fade-in">
            <div className="flex items-center justify-between bg-muted/30 p-2 rounded-lg border">
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className="text-[8px] text-muted-foreground uppercase font-bold">Local Time</span>
                <span className="text-[10px] font-semibold text-foreground font-mono select-text truncate">
                  {dateOutputLocal}
                </span>
              </div>
              {dateOutputLocal !== 'Invalid Timestamp' && (
                <CopyIconButton
                  onCopy={() => {
                    navigator.clipboard.writeText(dateOutputLocal);
                    toast.success('Copied local date!');
                  }}
                  label="Copy local date"
                />
              )}
            </div>
            {dateOutputUtc && dateOutputUtc !== 'Invalid Timestamp' && (
              <div className="flex items-center justify-between bg-muted/30 p-2 rounded-lg border">
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <span className="text-[8px] text-muted-foreground uppercase font-bold">UTC Time</span>
                  <span className="text-[10px] font-semibold text-foreground font-mono select-text truncate">
                    {dateOutputUtc}
                  </span>
                </div>
                <CopyIconButton
                  onCopy={() => {
                    navigator.clipboard.writeText(dateOutputUtc);
                    toast.success('Copied UTC date!');
                  }}
                  label="Copy UTC date"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Date -> Timestamp */}
      <div className="space-y-1 pt-1.5 border-t">
        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Date → Timestamp</span>
        <div className="flex gap-1.5">
          <input
            type="datetime-local"
            value={inputDate}
            onChange={(e) => setInputDate(e.target.value)}
            step="1"
            className="flex-1 px-2.5 py-1.5 bg-muted/40 border rounded-lg text-xs outline-none text-foreground"
          />
          <button onClick={convertDate} className="px-2.5 bg-primary text-primary-foreground hover:opacity-90 rounded-lg text-xs font-bold shrink-0">
            Go
          </button>
        </div>
        {tsOutputSec && (
          <div className="space-y-1 animate-fade-in">
            <div className="flex items-center justify-between bg-muted/30 p-2 rounded-lg border">
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className="text-[8px] text-muted-foreground uppercase font-bold">Seconds (s)</span>
                <span className="text-[10px] font-bold text-foreground font-mono select-text truncate">
                  {tsOutputSec}
                </span>
              </div>
              {tsOutputSec !== 'Invalid Date' && (
                <CopyIconButton
                  onCopy={() => {
                    navigator.clipboard.writeText(tsOutputSec);
                    toast.success('Copied seconds timestamp!');
                  }}
                  label="Copy seconds"
                />
              )}
            </div>
            {tsOutputMs && tsOutputMs !== 'Invalid Date' && (
              <div className="flex items-center justify-between bg-muted/30 p-2 rounded-lg border">
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <span className="text-[8px] text-muted-foreground uppercase font-bold">Milliseconds (ms)</span>
                  <span className="text-[10px] font-bold text-foreground font-mono select-text truncate">
                    {tsOutputMs}
                  </span>
                </div>
                <CopyIconButton
                  onCopy={() => {
                    navigator.clipboard.writeText(tsOutputMs);
                    toast.success('Copied milliseconds timestamp!');
                  }}
                  label="Copy milliseconds"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* Mini JSON Viewer/Formatter Logic */
function MiniJsonViewer() {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const getJsonSizeString = (str: string): string => {
    const bytes = new Blob([str]).size;
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(2)} KB`;
  };

  const formatJson = () => {
    if (!input.trim()) {
      setError(null);
      setSuccess(false);
      return;
    }
    try {
      const parsed = JSON.parse(input);
      setInput(JSON.stringify(parsed, null, 2));
      setError(null);
      setSuccess(true);
    } catch (e: any) {
      setError(e.message || 'Invalid JSON');
      setSuccess(false);
    }
  };

  const minifyJson = () => {
    if (!input.trim()) {
      setError(null);
      setSuccess(false);
      return;
    }
    try {
      const parsed = JSON.parse(input);
      setInput(JSON.stringify(parsed));
      setError(null);
      setSuccess(true);
    } catch (e: any) {
      setError(e.message || 'Invalid JSON');
      setSuccess(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-3 bg-card space-y-2.5 text-xs select-none" onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
      {/* `resize-none` turns off the textarea's own native resize grip —
          left on, it sat right next to (and fought with) the panel's own
          resize handle. `flex-1` instead ties the textarea's size to the
          panel's: growing/shrinking the outer panel (the one resize handle
          that's left) grows/shrinks this directly, padding staying constant. */}
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Paste raw JSON here..."
        className="w-full flex-1 min-h-32 p-2 bg-muted/40 border rounded-lg text-xs font-mono outline-none text-foreground leading-normal resize-none"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      />
      
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
            className="px-3.5 py-1.5 bg-primary text-primary-foreground hover:opacity-90 rounded-lg font-bold text-xs transition-colors shrink-0"
          >
            Format
          </button>
        </div>
      </div>

      {input.trim() && (
        <button
          onClick={() => {
            navigator.clipboard.writeText(input);
            toast.success('Copied JSON content!');
          }}
          className="w-full py-1.5 bg-muted hover:bg-muted-foreground/10 border rounded-lg transition-colors text-foreground font-bold text-xs flex items-center justify-center gap-1.5"
        >
          <Copy className="h-3 w-3" /> Copy JSON
        </button>
      )}

      {error && (
        <div className="text-[10px] text-destructive bg-destructive/10 border border-destructive/20 p-2 rounded-lg font-mono leading-normal select-text max-h-20 overflow-y-auto">
          {error}
        </div>
      )}
      {success && (
        <div className="text-[10px] text-green-600 dark:text-green-450 bg-green-500/10 border border-green-500/20 p-2 rounded-lg font-mono font-bold leading-normal select-none">
          ✓ Valid JSON Formatted Successfully
        </div>
      )}
    </div>
  );
}
