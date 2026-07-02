'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Moon, Sun, Clock, Braces, Menu, X, Keyboard, HeartHandshake } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const nav = [
  { href: '/epoch', label: 'Epoch Converter', icon: Clock },
  { href: '/json', label: 'JSON Viewer', icon: Braces },
  { href: '/support', label: 'Support', icon: HeartHandshake },
];

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // resolvedTheme is undefined until after mount (it reads localStorage/system
  // preference client-side only), so deriving the switch state from it during
  // the first render would mismatch the server-rendered HTML.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <div className="flex items-center gap-1.5">
      <Sun className={cn('h-3.5 w-3.5', isDark ? 'text-muted-foreground' : 'text-foreground')} />
      <Switch
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
        aria-label="Toggle dark mode"
      />
      <Moon className={cn('h-3.5 w-3.5', isDark ? 'text-foreground' : 'text-muted-foreground')} />
    </div>
  );
}

function KeyboardShortcuts() {
  const shortcuts = [
    { keys: ['C'], description: 'Clear form' },
    { keys: ['Ctrl', 'Enter'], description: 'Convert / Submit' },
    { keys: ['Ctrl', 'K'], description: 'Open command palette' },
    { keys: ['Ctrl', 'Shift', 'C'], description: 'Copy result' },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Keyboard shortcuts">
          <Keyboard className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {shortcuts.map(({ keys, description }) => (
            <div key={description} className="flex items-center justify-between py-1">
              <span className="text-sm text-muted-foreground">{description}</span>
              <div className="flex items-center gap-1">
                {keys.map((k) => (
                  <kbd
                    key={k}
                    className="inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs font-medium"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-black">
            DC
          </div>
          <span className="hidden sm:inline">
            DevChrono <span className="text-muted-foreground font-normal">JSONLab</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <KeyboardShortcuts />
          <ThemeToggle />
          {/* Mobile menu */}
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-background px-4 py-3 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium',
                pathname === href
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
