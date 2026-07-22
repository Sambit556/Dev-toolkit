'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Moon,
  Sun,
  Clock,
  Braces,
  Menu,
  X,
  Keyboard,
  HeartHandshake,
  BookOpen,
  Shield,
  Layers,
  ShieldCheck,
  RefreshCw,
  Fingerprint,
  CalendarRange,
  Calculator,
  Coins,
  Ruler,
  Palette,
  Sparkles,
  ChevronDown,
  Globe,
  Gamepad2,
  ArrowRightLeft,
  Zap,
  Code2,
  FileCode,
  QrCode,
  FileText,
  Lock,
  Search,
  Home,
  Link2
} from 'lucide-react';
import { CommandPalette } from './CommandPalette';
import { toolCategories } from '@/lib/tools';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocale, SUPPORTED_LANGUAGES } from '@/context/LocalizationContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const TOOL_COLORS: Record<string, string> = {
  '/epoch': 'blue',
  '/json': 'green',
  '/jwt': 'red',
  '/diff-checker': 'sky',
  '/html-preview': 'indigo',
  '/encoder-decoder': 'emerald',
  '/converters': 'teal',
  '/text-utils': 'rose',
  '/file-converter': 'amber',
  '/cron': 'indigo',
  '/security-tools': 'purple',
  '/qr-barcode': 'violet',
  '/lorem-ipsum': 'pink',
  '/fake-address': 'teal',
  '/calculator': 'sky',
  '/currency': 'blue',
  '/unit-converter': 'orange',
  '/color-picker': 'pink',
  '/image-tool': 'amber',
  '/speed-test': 'cyan',
  '/ip-intel': 'cyan',
  '/fun-tools': 'red',
  '/pdf-tools': 'fuchsia',
  '/regex-tester': 'red',
  '/sql-formatter': 'sky',
  '/graphql-formatter': 'violet',
  '/http-toolkit': 'emerald',
};

const COLOR_MAPS: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-blue-500/20',
  green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 border-green-500/20',
  red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 border-red-500/20',
  purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 border-purple-500/20',
  indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-500/20',
  orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 border-orange-500/20',
  pink: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400 border-pink-500/20',
  emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-500/20',
  sky: 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400 border-sky-500/20',
  violet: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400 border-violet-500/20',
  amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 border-amber-500/20',
  teal: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400 border-teal-500/20',
  fuchsia: 'bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/30 dark:text-fuchsia-400 border-fuchsia-500/20',
  rose: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 border-rose-500/20',
};



function LanguageSwitcher() {
  const { language, setLanguageManual } = useLocale();

  return (
    <div className="flex items-center gap-1">
      <Select value={language} onValueChange={setLanguageManual}>
        <SelectTrigger className="h-7 text-[10px] w-[118px] bg-card border font-medium">
          <SelectValue>
            <span className="inline-flex items-center gap-1 min-w-0">
              <Globe className="h-3 w-3 text-muted-foreground/60 shrink-0" />
              <span>{SUPPORTED_LANGUAGES[language]?.flag}</span>
              <span className="truncate">{SUPPORTED_LANGUAGES[language]?.label}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(SUPPORTED_LANGUAGES).map(([code, meta]) => (
            <SelectItem key={code} value={code} className="text-xs font-medium">
              <span className="inline-flex items-center gap-1.5">
                <span>{meta.flag}</span>
                <span>{meta.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- must flip only after client hydration to avoid an SSR/CSR theme mismatch
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
    { keys: ['Ctrl', 'Enter'], description: 'Convert / Submit' },
    { keys: ['Ctrl', 'S'], description: 'Open search / command palette' },
    { keys: ['Ctrl', 'Shift', 'C'], description: 'Copy result' },
    { keys: ['Ctrl', 'Shift', 'V'], description: 'Paste input' },
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

function ClockSegment({ value, className }: { value: string; className?: string }) {
  return (
    <span
      className={className ?? 'text-primary font-semibold tracking-wider'}
      style={{
        display: 'inline-block',
        animation: 'clockSlideUp 0.26s cubic-bezier(0.22,1,0.36,1) both',
      }}
    >
      {value}
    </span>
  );
}

function HeaderClock() {
  const [mounted, setMounted] = useState(false);
  const [datePart, setDatePart] = useState('');
  const [hh, setHh] = useState('--');
  const [mm, setMm] = useState('--');
  const [ss, setSs] = useState('--');
  const [ampm, setAmpm] = useState('');
  const [use12Hour, setUse12Hour] = useState(false);

  useEffect(() => {
    // Ticking wall-clock display: mounted-guard for SSR hydration safety, then a real
    // setInterval subscription to the passage of time (a genuine external system).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const updateClock = () => {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const newMm = String(now.getMinutes()).padStart(2, '0');
      const newSs = String(now.getSeconds()).padStart(2, '0');
      const rawHours = now.getHours();

      const period = rawHours >= 12 ? 'PM' : 'AM';
      const h12 = rawHours % 12 || 12;
      const newHh = use12Hour ? String(h12).padStart(2, '0') : String(rawHours).padStart(2, '0');

      setDatePart(`${day}/${month}/${year}`);
      setHh(newHh);
      setMm(newMm);
      setSs(newSs);
      setAmpm(period);
    };

    updateClock();
    const intervalId = setInterval(updateClock, 1000);
    return () => clearInterval(intervalId);
  }, [use12Hour]);

  if (!mounted) {
    return (
      <div className="hidden md:flex items-center gap-2 font-mono text-xs font-bold text-primary bg-primary/5 border border-primary/20 px-3 py-1.5 rounded-lg shadow-sm">
        <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="text-muted-foreground/40">--/--/---- | --:--:--</span>
      </div>
    );
  }

  return (
    <button
      onClick={() => setUse12Hour(v => !v)}
      className="hidden md:flex items-center gap-2 font-mono text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 hover:border-primary/30 transition-all px-3 py-1.5 rounded-lg shadow-sm cursor-pointer select-none group"
    >
      <Clock className="h-3.5 w-3.5 text-primary shrink-0 animate-pulse" />
      <div className="flex items-center gap-1">
        <span className="text-muted-foreground/80">{datePart}</span>
        <span className="text-muted-foreground/30 font-light mx-0.5">|</span>
        {/* Tight wrapper — zero gap so colons sit flush against digits */}
        <span className="inline-flex items-center">
          <ClockSegment key={`h:${hh}`} value={hh} />
          <span className="text-primary/50 font-light">:</span>
          <ClockSegment key={`m:${mm}`} value={mm} />
          <span className="text-primary/50 font-light">:</span>
          <ClockSegment key={`s:${ss}`} value={ss} className="text-primary font-semibold tracking-wider" />
        </span>
        {use12Hour && (
          <span className="text-[10px] font-black text-primary/70 ml-1">{ampm}</span>
        )}
      </div>
      {/* Format badge */}
      <span
        className={cn(
          "text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded-md border transition-all duration-200",
          use12Hour
            ? "bg-primary/15 text-primary border-primary/30"
            : "bg-muted/60 text-muted-foreground/60 border-border/50 group-hover:bg-primary/10 group-hover:text-primary/60 group-hover:border-primary/20"
        )}
      >
        {use12Hour ? '12H' : '24H'}
      </span>
    </button>
  );
}

type ConnectionStatus = 'online' | 'offline' | 'checking';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
// /api/status, not /health — some browser extensions pattern-match "health"
// in a URL and silently block it (ERR_BLOCKED_BY_CLIENT) even when the API
// itself is fine. Same handler, different path avoids that false negative.
const API_HEALTH_URL = `${API_BASE}/api/status`;

function HeaderStatus() {
  // Start as 'checking' until the first API health check resolves
  const [status, setStatus] = useState<ConnectionStatus>('checking');

  useEffect(() => {
    let cancelled = false;

    const checkApiHealth = () => {
      // No point hitting the API if the device itself has no network.
      if (!navigator.onLine) {
        setStatus('offline');
        return;
      }
      fetch(API_HEALTH_URL)
        .then((res) => !cancelled && setStatus(res.ok ? 'online' : 'offline'))
        .catch(() => !cancelled && setStatus('offline'));
    };

    checkApiHealth();
    const interval = setInterval(checkApiHealth, 60_000);

    window.addEventListener('online', checkApiHealth);
    window.addEventListener('offline', checkApiHealth);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener('online', checkApiHealth);
      window.removeEventListener('offline', checkApiHealth);
    };
  }, []);

  return (
    <a
      href={API_HEALTH_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
      "hidden md:flex items-center gap-1.5 font-mono text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg border shadow-sm transition-all",
      status === 'online' && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      status === 'offline' && "bg-red-500/10 text-red-600 border-red-500/20",
      status === 'checking' && "bg-amber-500/10 text-amber-600 border-amber-500/20"
    )}>
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        {status === 'online' && (
          <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </>
        )}
        {status === 'offline' && (
          <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
          </>
        )}
        {status === 'checking' && (
          <>
            <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
          </>
        )}
      </span>
      <span>
        {status === 'online' && 'Online'}
        {status === 'offline' && 'Offline'}
        {status === 'checking' && 'Checking'}
      </span>
    </a>
  );
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLocale();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [secretClicks, setSecretClicks] = useState(0);
  const [isSecretActivating, setIsSecretActivating] = useState(false);
  const clickResetTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSecretClick = () => {
    if (isSecretActivating) return;

    if (clickResetTimeout.current) {
      clearTimeout(clickResetTimeout.current);
    }

    const nextClicks = secretClicks + 1;
    setSecretClicks(nextClicks);

    if (nextClicks === 3) {
      setIsSecretActivating(true);
      // Set the flag immediately so it's ready when the page loads
      sessionStorage.setItem('hidden_storage_activated', 'true');
      
      setTimeout(() => {
        setSecretClicks(0);
        setIsSecretActivating(false);
        router.push('/storage');
      }, 1000);
    } else {
      clickResetTimeout.current = setTimeout(() => {
        setSecretClicks(0);
      }, 2500);
    }
  };
  const clickLocked = useRef(false); // true = user clicked to pin the dropdown open
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const closeDropdown = () => {
    setDesktopOpen(false);
    clickLocked.current = false;
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
      hoverTimeout.current = null;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // +1 accounts for the hidden Storage vault — deliberately not listed in
  // toolCategories since it's an unlisted/secret feature, not a nav entry.
  const totalTools = toolCategories.reduce((acc, cat) => acc + cat.items.length, 0) + 1;

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        if (progressBarRef.current) {
          progressBarRef.current.style.width = `${progress}%`;
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getCategoryTitle = (name: string) => {
    if (name === 'Formatters & Viewers') return t('formatters') || name;
    if (name === 'Converters & Parsers') return t('converters') || name;
    if (name === 'Generators') return t('generators') || name;
    return name;
  };

  const getToolTranslation = (href: string, fallbackLabel: string, fallbackDesc: string) => {
    const routeKey = href.replace('/', '');
    const translationMap: Record<string, { title: string; desc: string }> = {
      'epoch': { title: 'epochTitle', desc: 'epochDesc' },
      'json': { title: 'jsonTitle', desc: 'jsonDesc' },
      'jwt': { title: 'jwtTitle', desc: 'jwtDesc' },
      'uuid': { title: 'uuidTitle', desc: 'uuidDesc' },
      'cron': { title: 'cronTitle', desc: 'cronDesc' },
      'unit-converter': { title: 'unitTitle', desc: 'unitDesc' },
      'color-picker': { title: 'colorTitle', desc: 'colorDesc' },
      'encoder-decoder': { title: 'encoderDecoderTitle', desc: 'encoderDecoderDesc' },
      'calculator': { title: 'calculatorTitle', desc: 'calculatorDesc' },
      'yaml-json': { title: 'yamlTitle', desc: 'yamlDesc' },
      'image-tool': { title: 'imageTitle', desc: 'imageDesc' },
      'converters': { title: 'convertersTitle', desc: 'convertersDesc' },
      'currency': { title: 'currencyTitle', desc: 'currencyDesc' },
      'ip-intel': { title: 'ipIntelTitle', desc: 'ipIntelDesc' },
      'speed-test': { title: 'speedTestTitle', desc: 'speedTestDesc' },
      'file-converter': { title: 'fileConverterTitle', desc: 'fileConverterDesc' },
    };
    const mapped = translationMap[routeKey];
    return {
      label: mapped ? t(mapped.title) : fallbackLabel,
      desc: mapped ? t(mapped.desc) : fallbackDesc,
    };
  };

  // Hover handlers for the tools dropdown wrapper
  const handleMouseEnter = () => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
      hoverTimeout.current = null;
    }
    setDesktopOpen(true);
  };

  const handleMouseLeave = () => {
    // Only auto-close if the user hasn't explicitly clicked to lock it open
    if (!clickLocked.current) {
      hoverTimeout.current = setTimeout(() => {
        setDesktopOpen(false);
      }, 150); // small delay to allow moving to the dropdown panel
    }
  };

  // Click handler for the Tools button
  const handleToolsClick = () => {
    if (desktopOpen && clickLocked.current) {
      // Already open and pinned → close it
      closeDropdown();
    } else if (desktopOpen && !clickLocked.current) {
      // Open via hover → pin it
      clickLocked.current = true;
    } else {
      // Closed → open and pin
      setDesktopOpen(true);
      clickLocked.current = true;
    }
  };

  // Close dropdown on navigate. pathname comes from the router (an external system) and
  // navigation can originate from many places (Link clicks, browser back/forward), so
  // there's no single handler to hook this into directly.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    closeDropdown();
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <div
            id="header-logo-mark"
            className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 text-xs font-black text-white"
          >
            DK
          </div>
          <span className="hidden sm:inline">
            DevKits
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 relative">
          <Link
            href="/"
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              pathname === '/'
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Home className="h-4 w-4" />
            {t('home')}
          </Link>

          {/* Tools Menu Trigger */}
          <div
            className="py-1 cursor-pointer"
            ref={dropdownRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <button
              onClick={handleToolsClick}
              className={cn(
                'inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                desktopOpen && 'bg-accent text-accent-foreground'
              )}
            >
              {t('tools')}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {desktopOpen && (
              <div className="fixed left-1/2 top-14 z-50 w-[calc(100vw-2rem)] max-w-[1100px] -translate-x-1/2 animate-fade-in rounded-2xl border border-primary/20 bg-card/95 p-5 shadow-[0_20px_50px_rgba(59,130,246,0.15)] backdrop-blur-md dark:border-primary/30 dark:shadow-[0_20px_50px_rgba(99,102,241,0.25)] sm:p-6">
                <div className="grid grid-cols-3 gap-5 sm:gap-6 xl:grid-cols-6">
                  {toolCategories.map((cat) => (
                    <div key={cat.name} className="min-w-0 space-y-3">
                      <h4 className="text-[10px] uppercase font-black tracking-widest text-primary/85 border-b pb-2 border-primary/10 px-1 leading-snug">
                        {getCategoryTitle(cat.name)}
                      </h4>
                      <div className="grid gap-1">
                        {cat.items.map((item) => {
                          const Icon = item.icon;
                          const isSelected = pathname === item.href;
                          const trans = getToolTranslation(item.href, item.label, item.desc);
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={closeDropdown}
                              className={cn(
                                "flex items-center gap-2.5 rounded-lg p-2 transition-all hover:translate-x-0.5 hover:bg-muted text-left border border-transparent min-w-0",
                                isSelected && "bg-primary/5 border border-primary/20 text-primary"
                              )}
                            >
                              <div className={cn(
                                "h-7 w-7 rounded-md flex items-center justify-center shrink-0 border",
                                COLOR_MAPS[TOOL_COLORS[item.href] || 'blue']
                              )}>
                                <Icon className="h-3.5 w-3.5" />
                              </div>
                              <span className="text-xs font-bold leading-snug min-w-0">
                                {trans.label}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Toolbox stats sidebar */}
                  <div className="min-w-0 flex flex-col justify-end border-t border-border/60 pt-4 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
                    <div
                      onClick={handleSecretClick}
                      className={cn(
                        "bg-muted/40 rounded-xl p-3.5 border border-border/50 text-[10px] space-y-2.5 transition-all duration-550 cursor-pointer select-none relative overflow-hidden",
                        secretClicks === 1 && "border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.25)] bg-blue-500/5 scale-[1.01] rotate-[0.2deg]",
                        secretClicks === 2 && "border-indigo-500/70 shadow-[0_0_25px_rgba(99,102,241,0.45)] bg-indigo-500/10 scale-[1.03] -rotate-[0.2deg]",
                        isSecretActivating && "scale-105 border-emerald-500 shadow-[0_0_35px_rgba(16,185,129,0.7)] bg-emerald-500/10 animate-pulse duration-700"
                      )}
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground font-medium">Toolbox Count:</span>
                        <span className="font-bold font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-md w-fit mt-0.5">
                          {totalTools} Utilities
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 border-t pt-2 border-border/40">
                        <span className="text-muted-foreground font-medium">Storage State:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-450 font-mono">
                          Production Sandbox
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-t border-border/40 pt-2 font-mono">
                        <span className="text-muted-foreground font-medium">Gateway:</span>
                        <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-full bg-slate-950/60 border border-border/30">
                          <span className={cn("h-1.5 w-1.5 rounded-full transition-all duration-300", 
                            (secretClicks >= 1 || isSecretActivating) ? "bg-blue-500 shadow-[0_0_8px_#3b82f6]" : "bg-muted-foreground/20")} />
                          <span className={cn("h-1.5 w-1.5 rounded-full transition-all duration-300", 
                            (secretClicks >= 2 || isSecretActivating) ? "bg-indigo-500 shadow-[0_0_8px_#6366f1]" : "bg-muted-foreground/20")} />
                          {isSecretActivating && (
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-ping" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Link
            href="/blog"
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              pathname === '/blog'
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <BookOpen className="h-4 w-4" />
            {t('blog')}
          </Link>

          <Link
            href="/support"
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              pathname === '/support'
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <HeartHandshake className="h-4 w-4" />
            {t('support')}
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <HeaderStatus />
          <HeaderClock />
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
          <KeyboardShortcuts />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => window.dispatchEvent(new CustomEvent('toggle-command-palette'))}
                aria-label="Open command palette"
              >
                <Search className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Search tools (Ctrl+S or /)</TooltipContent>
          </Tooltip>
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
        <div className="md:hidden border-t bg-background px-4 py-3 space-y-3 max-h-[80vh] overflow-y-auto">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="block text-sm font-bold text-muted-foreground p-1"
          >
            {t('home')}
          </Link>

          {/* Collapsible Mobile tool list */}
          <div className="space-y-4 pt-1">
            {toolCategories.map((cat) => (
              <div key={cat.name} className="space-y-1">
                <span className="text-[9px] uppercase font-bold tracking-widest text-primary block px-1">
                  {getCategoryTitle(cat.name)}
                </span>
                <div className="grid gap-1 pl-1">
                  {cat.items.map((item) => {
                    const Icon = item.icon;
                    const trans = getToolTranslation(item.href, item.label, item.desc);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Icon className="h-3.5 w-3.5 text-primary" />
                        {trans.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-2.5 flex items-center justify-between">
            <div className="flex gap-3">
              <Link
                href="/blog"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-1 text-xs font-bold text-muted-foreground p-1"
              >
                <BookOpen className="h-3.5 w-3.5" />
                {t('blog')}
              </Link>
              <Link
                href="/support"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-1 text-xs font-bold text-muted-foreground p-1"
              >
                <HeartHandshake className="h-3.5 w-3.5" />
                {t('support')}
              </Link>
            </div>
            <div className="scale-90 origin-right">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      )}
      {/* Scroll progress bar */}
      <div
        ref={progressBarRef}
        className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-75 ease-out"
        style={{ width: '0%' }}
      />
      <CommandPalette />
    </header>
  );
}
