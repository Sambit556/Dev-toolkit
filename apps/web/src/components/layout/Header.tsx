'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Zap
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocale, SUPPORTED_LANGUAGES } from '@/context/LocalizationContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const toolCategories = [
  {
    name: 'Formatters & Viewers',
    items: [
      { href: '/json', label: 'JSON Viewer', icon: Braces, desc: 'Format and explore JSON text' },
      { href: '/jwt', label: 'JWT Decoder', icon: Shield, desc: 'Decode & encode tokens' },
    ],
  },
  {
    name: 'Converters & Parsers',
    items: [
      { href: '/epoch', label: 'Epoch Converter', icon: Clock, desc: 'Unix timestamp converter' },
      { href: '/yaml-json', label: 'YAML ↔ JSON', icon: Layers, desc: 'Map YAML configs to JSON' },
      { href: '/encoder-decoder', label: 'Encoder/Decoder', icon: ShieldCheck, desc: 'Base64, URL, Hex, HTML' },
      { href: '/converters', label: 'Data & PDF', icon: RefreshCw, desc: 'CSV, XML, MD, PDF Writer' },
      { href: '/file-converter', label: 'File Converter', icon: ArrowRightLeft, desc: 'CSV, JSON, Markdown, Images' },
    ],
  },
  {
    name: 'Generators',
    items: [
      { href: '/uuid', label: 'UUID Generator', icon: Fingerprint, desc: 'Batch UUID/ULID/NanoID' },
      { href: '/cron', label: 'Cron Generator', icon: CalendarRange, desc: 'Visual cron scheduler' },
    ],
  },
  {
    name: 'Calculators & Utilities',
    items: [
      { href: '/calculator', label: 'Calculators', icon: Calculator, desc: 'EMI, Salary, Age, Date' },
      { href: '/currency', label: 'Currency Exchanger', icon: Coins, desc: 'Exchange rates & offline values' },
      { href: '/unit-converter', label: 'Unit Converter', icon: Ruler, desc: 'Length, weight, area' },
      { href: '/color-picker', label: 'Color Picker', icon: Palette, desc: 'Picker, harmonies, WCAG' },
      { href: '/image-tool', label: 'Image Optimizer', icon: Sparkles, desc: 'Compress, scale, filter' },
      { href: '/ip-intel', label: 'IP Intelligence', icon: Globe, desc: 'Geo details & credentials check' },
      { href: '/speed-test', label: 'Speed Test', icon: Zap, desc: 'Ping, jitter, download, upload' },
    ],
  },
];

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

function HeaderClock() {
  const [datePart, setDatePart] = useState('');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();

      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');

      setDatePart(`${day}/${month}/${year}`);
      setHours(hh);
      setMinutes(mm);
      setSeconds(ss);
    };

    updateClock();
    const intervalId = setInterval(updateClock, 1000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="hidden md:flex items-center gap-2 font-mono text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 hover:border-primary/30 transition-all px-3 py-1.5 rounded-lg shadow-sm">
      <style>{`
        @keyframes clockSlideUp {
          from {
            transform: translateY(3px);
            opacity: 0.2;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .clock-tick-animation {
          display: inline-block;
          animation: clockSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
      <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
      <div className="flex items-center gap-1.5 select-none">
        <span className="text-muted-foreground/80">{datePart}</span>
        <span className="text-muted-foreground/30 font-light mx-0.5">|</span>
        <div className="flex items-center text-primary font-semibold tracking-wider">
          <span key={hours} className="clock-tick-animation">{hours}</span>
          <span className="text-muted-foreground/40 mx-[1px]">:</span>
          <span key={minutes} className="clock-tick-animation">{minutes}</span>
          <span className="text-muted-foreground/40 mx-[1px]">:</span>
          <span key={seconds} className="clock-tick-animation text-primary/90">{seconds}</span>
        </div>
      </div>
    </div>
  );
}

type ConnectionStatus = 'online' | 'offline' | 'checking';

function HeaderStatus() {
  // Start as 'checking' until component mounts and reads navigator.onLine
  const [status, setStatus] = useState<ConnectionStatus>('checking');

  useEffect(() => {
    // Read actual browser network state on mount
    setStatus(navigator.onLine ? 'online' : 'offline');

    const handleOnline = () => setStatus('online');
    const handleOffline = () => setStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className={cn(
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
    </div>
  );
}

export function Header() {
  const pathname = usePathname();
  const { t } = useLocale();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const totalTools = toolCategories.reduce((acc, cat) => acc + cat.items.length, 0);

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
    if (name.includes('Formatter')) return t('formatters');
    if (name.includes('Converter')) return t('converters');
    if (name.includes('Generator')) return t('generators');
    if (name.includes('Calculator')) return t('utilities');
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

  // Close dropdown on navigate
  useEffect(() => {
    setDesktopOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-black">
            DT
          </div>
          <span className="hidden sm:inline">
            DevToolkit
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 relative">
          <Link
            href="/"
            className={cn(
              'inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              pathname === '/'
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            {t('home')}
          </Link>

          {/* Tools Menu Trigger */}
          <div
            className="py-1"
            onMouseEnter={() => setDesktopOpen(true)}
            onMouseLeave={() => setDesktopOpen(false)}
          >
            <button
              className={cn(
                'inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                desktopOpen && 'bg-accent text-accent-foreground'
              )}
            >
              {t('tools')}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>

            {/* Premium Multi-column Dropdown Popover */}
            {desktopOpen && (
              <div className="absolute top-[34px] left-1/2 -translate-x-1/2 w-[760px] bg-card/95 backdrop-blur-md border border-primary/20 dark:border-primary/30 shadow-[0_20px_50px_rgba(59,130,246,0.15)] dark:shadow-[0_20px_50px_rgba(99,102,241,0.25)] rounded-2xl p-5 grid grid-cols-12 gap-5 animate-fade-in z-50 before:content-[''] before:absolute before:top-[-15px] before:left-0 before:right-0 before:h-[15px]">
                {/* Column 1 (Left): Formatters & Generators */}
                <div className="col-span-4 space-y-4">
                  {toolCategories.filter(c => ['Formatters & Viewers', 'Generators'].includes(c.name)).map((cat) => (
                    <div key={cat.name} className="space-y-2">
                      <h4 className="text-[10px] uppercase font-black tracking-widest text-primary/80 px-1">
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
                              className={cn(
                                "flex items-start gap-2.5 rounded-lg p-2 transition-all hover:translate-x-0.5 hover:bg-muted text-left",
                                isSelected && "bg-primary/5 border border-primary/20"
                              )}
                            >
                              <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <Icon className="h-3.5 w-3.5" />
                              </div>
                              <div>
                                <p className="text-xs font-bold leading-none">{trans.label}</p>
                                <p className="text-[9px] text-muted-foreground mt-0.5 leading-snug line-clamp-1">
                                  {trans.desc}
                                </p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Column 2 (Middle): Converters & Calculators */}
                <div className="col-span-4 space-y-4">
                  {toolCategories.filter(c => ['Converters & Parsers', 'Calculators & Utilities'].includes(c.name)).map((cat) => (
                    <div key={cat.name} className="space-y-2">
                      <h4 className="text-[10px] uppercase font-black tracking-widest text-primary/80 px-1">
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
                              className={cn(
                                "flex items-start gap-2.5 rounded-lg p-2 transition-all hover:translate-x-0.5 hover:bg-muted text-left",
                                isSelected && "bg-primary/5 border border-primary/20"
                              )}
                            >
                              <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <Icon className="h-3.5 w-3.5" />
                              </div>
                              <div>
                                <p className="text-xs font-bold leading-none">{trans.label}</p>
                                <p className="text-[9px] text-muted-foreground mt-0.5 leading-snug line-clamp-1">
                                  {trans.desc}
                                </p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Column 3 (Right): Featured Platform Sidebar */}
                <div className="col-span-4 border-l border-border/60 pl-5">
                  <div className="space-y-3 text-left">
                    <div className="space-y-1.5">
                      <h5 className="text-xs font-black">{t('allToolsPrivate')}</h5>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        {t('privacyEngineDesc')}
                      </p>
                    </div>
                    <div className="bg-muted/40 rounded-xl p-3 border border-border/50 text-[10px] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('toolboxCount')}:</span>
                        <span className="font-bold font-mono text-primary">{totalTools} {t('utilitiesLabel')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('storageState')}:</span>
                        <span className="font-bold text-primary font-mono">{t('prodSandbox')}</span>
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
        className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-75 ease-out shadow-[0_0_8px_rgba(59,130,246,0.5)]"
        style={{ width: '0%' }}
      />
    </header>
  );
}
