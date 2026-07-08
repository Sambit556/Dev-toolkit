'use client';

import React, { useEffect, useRef, useState } from 'react';
import { LifeBuoy, MessageCircle, Mail, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Public-facing contact details, configured via env (see .env.local.example) so
// they're not hardcoded in source and can be swapped per-deployment. These are
// rendered client-side for visitors to click, so they're inherently public —
// not secrets, just kept out of the component file.
const WHATSAPP_NUMBER_RAW = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '';
const WHATSAPP_NUMBER = WHATSAPP_NUMBER_RAW.replace(/[^\d]/g, ''); // wa.me needs digits only
const WHATSAPP_MESSAGE = 'Hi, I need assistance with DevToolkit.';
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@devtoolkit.example';

export function FloatingSupport() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="fixed bottom-5 left-5 z-50">
      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-60 rounded-lg border bg-popover shadow-lg p-2 animate-fade-in">
          <p className="px-2 pt-1 pb-2 text-xs font-medium text-muted-foreground">Need a hand? Reach out</p>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 rounded-md px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 shrink-0">
              <MessageCircle className="h-3.5 w-3.5" />
            </span>
            <span>
              <span className="block font-medium">WhatsApp</span>
              <span className="block text-[11px] text-muted-foreground">Quick chat</span>
            </span>
          </a>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Support request — DevToolkit')}`}
            className="flex items-center gap-2.5 rounded-md px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 shrink-0">
              <Mail className="h-3.5 w-3.5" />
            </span>
            <span>
              <span className="block font-medium">Email</span>
              <span className="block text-[11px] text-muted-foreground">{SUPPORT_EMAIL}</span>
            </span>
          </a>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close support menu' : 'Open support menu'}
        aria-expanded={open}
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105',
          'bg-primary text-primary-foreground',
        )}
      >
        {open ? <X className="h-5 w-5" /> : <LifeBuoy className="h-5 w-5" />}
      </button>
    </div>
  );
}
