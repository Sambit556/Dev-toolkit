'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Database, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Pos {
  x: number;
  y: number;
}

const POS_STORAGE_KEY = 'devkits-storage-launcher-pos';
// Sits just above the Quick Access dock's own default ({ x: 16, y: 250 } in
// QuickAccess.tsx) so the two floating widgets stack without overlapping.
const DEFAULT_POS: Pos = { x: 16, y: 184 };

export function StorageLauncher() {
  const router = useRouter();
  const [pos, setPos] = useState<Pos>(DEFAULT_POS);
  const [expanded, setExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dragOffsetRef = useRef<Pos>({ x: 0, y: 0 });
  const pointerStartRef = useRef<Pos>({ x: 0, y: 0 });
  const didDragRef = useRef(false);

  // Reads localStorage, so this must run client-only — a lazy useState
  // initializer would run again during hydration with real data, mismatching
  // the server-rendered (default-position) HTML for any returning visitor.
  useEffect(() => {
    const saved = localStorage.getItem(POS_STORAGE_KEY);
    if (saved) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPos(JSON.parse(saved));
      } catch {}
    }
  }, []);

  // Keep the button on-screen after a resize, same as Quick Access's dock.
  useEffect(() => {
    const clamp = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPos((prev) => {
        const maxX = Math.max(4, window.innerWidth - rect.width - 4);
        const maxY = Math.max(4, window.innerHeight - rect.height - 4);
        const x = Math.max(4, Math.min(prev.x, maxX));
        const y = Math.max(4, Math.min(prev.y, maxY));
        if (x !== prev.x || y !== prev.y) {
          localStorage.setItem(POS_STORAGE_KEY, JSON.stringify({ x, y }));
          return { x, y };
        }
        return prev;
      });
    };
    clamp();
    window.addEventListener('resize', clamp);
    return () => window.removeEventListener('resize', clamp);
  }, []);

  const goToStorage = () => {
    sessionStorage.setItem('hidden_storage_activated', 'true');
    router.push('/storage');
  };

  const startDrag = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setExpanded(true);
    didDragRef.current = false;
    pointerStartRef.current = { x: clientX, y: clientY };
    const rect = buttonRef.current?.getBoundingClientRect();
    dragOffsetRef.current = {
      x: clientX - (rect?.left ?? 0),
      y: clientY - (rect?.top ?? 0),
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => startDrag(e.clientX, e.clientY);
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 0) return;
    startDrag(e.touches[0].clientX, e.touches[0].clientY);
  };

  useEffect(() => {
    if (!isDragging) return;

    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';

    const clampToViewport = (x: number, y: number) => {
      const rect = buttonRef.current?.getBoundingClientRect();
      const w = rect?.width ?? 48;
      const h = rect?.height ?? 48;
      return {
        x: Math.max(4, Math.min(x, Math.max(4, window.innerWidth - w - 4))),
        y: Math.max(4, Math.min(y, Math.max(4, window.innerHeight - h - 4))),
      };
    };

    const moveTo = (clientX: number, clientY: number) => {
      if (Math.hypot(clientX - pointerStartRef.current.x, clientY - pointerStartRef.current.y) > 4) {
        didDragRef.current = true;
      }
      setPos(clampToViewport(clientX - dragOffsetRef.current.x, clientY - dragOffsetRef.current.y));
    };

    const handleMouseMove = (e: MouseEvent) => moveTo(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      moveTo(e.touches[0].clientX, e.touches[0].clientY);
    };

    const handleEnd = () => {
      setIsDragging(false);
      setExpanded(false);
      if (didDragRef.current) {
        setPos((prev) => {
          localStorage.setItem(POS_STORAGE_KEY, JSON.stringify(prev));
          return prev;
        });
      } else {
        goToStorage();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging]);

  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label="Open Storage"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onMouseEnter={() => !isDragging && setExpanded(true)}
      onMouseLeave={() => !isDragging && setExpanded(false)}
      style={{ position: 'fixed', left: `${pos.x}px`, top: `${pos.y}px`, zIndex: 91 }}
      className={cn(
        'flex h-12 items-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg select-none',
        'transition-[width,box-shadow,transform] duration-300 ease-out hover:shadow-xl hover:scale-[1.03] active:scale-95',
        isDragging ? 'cursor-grabbing' : 'cursor-grab',
        expanded ? 'w-[136px] justify-start pl-3.5 pr-3' : 'w-12 justify-center'
      )}
    >
      <Database className="h-5 w-5 shrink-0" />
      <span
        className={cn(
          'overflow-hidden whitespace-nowrap text-sm font-semibold transition-all duration-300 ease-out',
          expanded ? 'max-w-[70px] ml-2 opacity-100' : 'max-w-0 ml-0 opacity-0'
        )}
      >
        Storage
      </span>
      <ChevronsRight
        className={cn(
          'h-4 w-4 shrink-0 transition-all duration-300 ease-out',
          expanded ? 'max-w-[16px] ml-1 opacity-100' : 'max-w-0 ml-0 opacity-0'
        )}
      />
    </button>
  );
}
