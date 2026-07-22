'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Calculator, Clock, Braces, X, GripHorizontal, Settings2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toolCategories } from '@/lib/tools';
import { QuickAccessManager } from './QuickAccessManager';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

// Each mini panel's content is only ever needed once its dock icon is clicked
// (activeTool switches to it), so it's loaded on demand rather than bundled
// into every page's initial JS — the JSON panel in particular drags in
// Monaco, the JSON tree view, and the auto-repair engine, none of which a
// visitor who never opens the dock should have to download.
const MiniCalculator = dynamic(() => import('./quick-access/MiniCalculator').then((m) => m.MiniCalculator), {
  loading: () => <MiniPanelLoading />,
});
const MiniEpochConverter = dynamic(() => import('./quick-access/MiniEpochConverter').then((m) => m.MiniEpochConverter), {
  loading: () => <MiniPanelLoading />,
});
const MiniJsonViewer = dynamic(() => import('./quick-access/MiniJsonViewer').then((m) => m.MiniJsonViewer), {
  ssr: false,
  loading: () => <MiniPanelLoading />,
});

function MiniPanelLoading() {
  return <div className="flex-1 min-h-24 flex items-center justify-center text-xs text-muted-foreground">Loading…</div>;
}

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
const COLLAPSED_STORAGE_KEY = 'devkits-quick-dock-collapsed';

const ALL_TOOLS = toolCategories.flatMap((cat) => cat.items.map((item) => ({ ...item, categoryName: cat.name })));

export function QuickAccess() {
  const router = useRouter();
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);
  const [pinned, setPinned] = useState<string[]>(DEFAULT_PINNED);
  const [manageOpen, setManageOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

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
  // Refs to each panel's own outer (fixed-positioned) wrapper — used to read
  // its real on-screen width/height so drag bounds and the viewport-clamp
  // effect can keep the whole panel visible instead of assuming a fixed size.
  const calcPanelRef = useRef<HTMLDivElement>(null);
  const epochPanelRef = useRef<HTMLDivElement>(null);
  const jsonPanelRef = useRef<HTMLDivElement>(null);
  const panelRefs: Record<Exclude<ActiveTool, null>, React.RefObject<HTMLDivElement | null>> = {
    calc: calcPanelRef,
    epoch: epochPanelRef,
    json: jsonPanelRef,
  };

  // Quick Dock Pos state and dragging refs
  const [dockPos, setDockPos] = useState<PanelPos>({ x: 16, y: 250 });
  const [isDraggingDock, setIsDraggingDock] = useState(false);
  const dockDragOffsetRef = useRef<PanelPos>({ x: 0, y: 0 });
  const dockRef = useRef<HTMLDivElement>(null);
  // The glow handle at the top of the dock both drags (move) and clicks
  // (collapse/expand) — these track whether the pointer actually moved since
  // mousedown so a plain click doesn't get swallowed by the drag system, and
  // a real drag doesn't accidentally toggle collapse on release.
  const dockPointerStartRef = useRef<PanelPos>({ x: 0, y: 0 });
  const dockDidDragRef = useRef(false);

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCollapsed(localStorage.getItem(COLLAPSED_STORAGE_KEY) === 'true');
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSED_STORAGE_KEY, String(next));
      return next;
    });
  };

  // Re-pulls the dock and any open mini panel back inside the viewport
  // whenever it resizes, and once on mount — a position saved from a wider/
  // taller screen (or from before the window was resized) would otherwise
  // sit partly or fully off-screen with no way to drag it back into view.
  useEffect(() => {
    const clamp = () => {
      const dockRect = dockRef.current?.getBoundingClientRect();
      if (dockRect) {
        setDockPos((prev) => {
          const maxX = Math.max(4, window.innerWidth - dockRect.width - 4);
          const maxY = Math.max(4, window.innerHeight - dockRect.height - 4);
          const x = Math.max(4, Math.min(prev.x, maxX));
          const y = Math.max(4, Math.min(prev.y, maxY));
          if (x !== prev.x || y !== prev.y) {
            localStorage.setItem('devkits-quick-dock-pos', JSON.stringify({ x, y }));
            return { x, y };
          }
          return prev;
        });
      }

      const panelSetters = { calc: setCalcPos, epoch: setEpochPos, json: setJsonPos } as const;
      (Object.keys(panelRefs) as Exclude<ActiveTool, null>[]).forEach((tool) => {
        const rect = panelRefs[tool].current?.getBoundingClientRect();
        if (!rect) return;
        const maxX = Math.max(4, window.innerWidth - rect.width - 4);
        const maxY = Math.max(4, window.innerHeight - rect.height - 4);
        panelSetters[tool]((prev) => ({
          x: Math.max(4, Math.min(prev.x, maxX)),
          y: Math.max(4, Math.min(prev.y, maxY)),
        }));
      });
    };

    clamp();
    window.addEventListener('resize', clamp);
    return () => window.removeEventListener('resize', clamp);
  }, [activeTool, collapsed, pinned.length]);

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
    dockDidDragRef.current = false;
    dockPointerStartRef.current = { x: e.clientX, y: e.clientY };
    const rect = dockEl.getBoundingClientRect();
    dockDragOffsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleDockTouchStart = (e: React.TouchEvent, dockEl: HTMLElement) => {
    if (e.touches.length === 0) return;
    setIsDraggingDock(true);
    dockDidDragRef.current = false;
    const touch = e.touches[0];
    dockPointerStartRef.current = { x: touch.clientX, y: touch.clientY };
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

    // Bounds the drag target's top-left so the whole element (measured from
    // its own rendered size, not a guessed constant) stays on-screen — lets
    // it reach every edge/corner of the viewport without ever letting part of
    // it drift off-screen where it'd be invisible and undraggable back.
    const clampToViewport = (x: number, y: number, elRect: DOMRect | undefined, fallback: number, margin: number) => {
      const w = elRect?.width ?? fallback;
      const h = elRect?.height ?? fallback;
      return {
        x: Math.max(margin, Math.min(x, Math.max(margin, window.innerWidth - w - margin))),
        y: Math.max(margin, Math.min(y, Math.max(margin, window.innerHeight - h - margin))),
      };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (draggingTool) {
        const rect = panelRefs[draggingTool].current?.getBoundingClientRect();
        const { x: newX, y: newY } = clampToViewport(e.clientX - dragOffset.x, e.clientY - dragOffset.y, rect, 300, 4);

        if (draggingTool === 'calc') setCalcPos({ x: newX, y: newY });
        if (draggingTool === 'epoch') setEpochPos({ x: newX, y: newY });
        if (draggingTool === 'json') setJsonPos({ x: newX, y: newY });
      } else if (isDraggingDock) {
        if (Math.hypot(e.clientX - dockPointerStartRef.current.x, e.clientY - dockPointerStartRef.current.y) > 4) {
          dockDidDragRef.current = true;
        }
        const rect = dockRef.current?.getBoundingClientRect();
        const { x: newX, y: newY } = clampToViewport(
          e.clientX - dockDragOffsetRef.current.x,
          e.clientY - dockDragOffsetRef.current.y,
          rect, 60, 4,
        );

        setDockPos({ x: newX, y: newY });
      } else if (resizingTool) {
        applyResize(resizingTool, e.clientX, e.clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const touch = e.touches[0];

      if (draggingTool) {
        const rect = panelRefs[draggingTool].current?.getBoundingClientRect();
        const { x: newX, y: newY } = clampToViewport(touch.clientX - dragOffset.x, touch.clientY - dragOffset.y, rect, 300, 4);

        if (draggingTool === 'calc') setCalcPos({ x: newX, y: newY });
        if (draggingTool === 'epoch') setEpochPos({ x: newX, y: newY });
        if (draggingTool === 'json') setJsonPos({ x: newX, y: newY });
      } else if (isDraggingDock) {
        if (Math.hypot(touch.clientX - dockPointerStartRef.current.x, touch.clientY - dockPointerStartRef.current.y) > 4) {
          dockDidDragRef.current = true;
        }
        const rect = dockRef.current?.getBoundingClientRect();
        const { x: newX, y: newY } = clampToViewport(
          touch.clientX - dockDragOffsetRef.current.x,
          touch.clientY - dockDragOffsetRef.current.y,
          rect, 60, 4,
        );

        setDockPos({ x: newX, y: newY });
      } else if (resizingTool) {
        applyResize(resizingTool, touch.clientX, touch.clientY);
      }
    };

    const handleDragEnd = () => {
      if (isDraggingDock) {
        setIsDraggingDock(false);
        if (dockDidDragRef.current) {
          // Persist dock position — only a real drag moved it
          localStorage.setItem('devkits-quick-dock-pos', JSON.stringify(dockPos));
        } else {
          // No meaningful movement — treat it as a click on the glow handle
          toggleCollapsed();
        }
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
            // Above ordinary in-page chrome (headers, dropdowns commonly sit at
            // z-40/z-50 — e.g. the Storage Vault's own "SECURE SHIELD" header
            // is z-50) so this floating dock is never visually buried under a
            // page's own content when dragged into that region; still below
            // real modals/dialogs, which use z-[100] and up.
            zIndex: 90
          }}
          className="flex flex-col gap-3.5 bg-background/70 dark:bg-slate-900/80 backdrop-blur-md border border-border/80 p-2 rounded-2xl shadow-2xl animate-fade-in select-none"
        >
          {/* One glowing handle does both jobs: drag it to move the whole dock,
              click it (no drag) to collapse/expand — see dockDidDragRef. */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                onMouseDown={(e) => handleDockMouseDown(e, dockRef.current!)}
                onTouchStart={(e) => handleDockTouchStart(e, dockRef.current!)}
                className={cn(
                  "cursor-move flex flex-col items-center gap-1 px-1 pt-0.5 pb-1.5 hover:text-primary transition-colors text-muted-foreground/80 select-none",
                  !collapsed && "border-b pb-2",
                )}
              >
                <div className="relative h-6 w-6 flex items-center justify-center">
                  <GripHorizontal className="relative h-3.5 w-3.5 text-primary" />
                </div>
                <div className="text-[8px] uppercase tracking-widest font-black text-center">
                  Quick
                </div>
                <div className="relative h-3.5 w-3.5 flex items-center justify-center">
                  <span className="absolute inset-0 rounded-full bg-primary/40 blur-[5px] animate-pulse" />
                  {collapsed ? (
                    <ChevronDown className="relative h-3 w-3 text-primary animate-bounce" />
                  ) : (
                    <ChevronUp className="relative h-3 w-3 text-primary animate-bounce" />
                  )}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">Drag to move &middot; Click to {collapsed ? 'expand' : 'collapse'}</TooltipContent>
          </Tooltip>

          {!collapsed && (
            <>
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
                        aria-label={tool.label}
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
                    aria-label="Manage Quick Access tools"
                    className="h-10 w-10 flex items-center justify-center rounded-xl transition-all shadow-sm active:scale-95 bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground border border-dashed border-border/80"
                  >
                    <Settings2 className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Manage Quick Access tools</TooltipContent>
              </Tooltip>
            </>
          )}
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
          ref={calcPanelRef}
          style={{
            position: 'fixed', left: `${calcPos.x}px`, top: `${calcPos.y}px`, zIndex: 100,
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
            onNavigate={() => router.push('/calculator')}
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
          ref={epochPanelRef}
          style={{
            position: 'fixed', left: `${epochPos.x}px`, top: `${epochPos.y}px`, zIndex: 100,
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
            onNavigate={() => router.push('/epoch')}
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
          ref={jsonPanelRef}
          style={{
            position: 'fixed', left: `${jsonPos.x}px`, top: `${jsonPos.y}px`, zIndex: 100,
            width: panelSizes.json ? `${panelSizes.json.width}px` : undefined,
            height: panelSizes.json ? `${panelSizes.json.height}px` : undefined,
          }}
          className={cn(
            'bg-background/95 border border-border/80 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-md animate-fade-in flex flex-col',
            // Unlike Calc/Epoch (width-only default — their content sizes
            // naturally), JSON's content chain relies on h-full/flex-1 all
            // the way down to Monaco's height:100%, which needs a definite
            // height to resolve against even before the user ever resizes.
            !panelSizes.json && 'w-80 h-[28rem]',
          )}
        >
          <MiniPanelHeader
            title="JSON Formatter"
            icon={<Braces className="h-4 w-4 text-primary" />}
            onClose={() => setActiveTool(null)}
            onNavigate={() => router.push('/json')}
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
  onNavigate: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
}

function MiniPanelHeader({ title, icon, onClose, onNavigate, onMouseDown, onTouchStart }: MiniHeaderProps) {
  return (
    <div
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onDoubleClick={onNavigate}
      title="Double-click to open the full page"
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
