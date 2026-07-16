'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Clock,
  Braces,
  Shield,
  Fingerprint,
  CalendarRange,
  Ruler,
  Palette,
  ShieldCheck,
  Calculator,
  Coins,
  Layers,
  Sparkles,
  RefreshCw,
  Zap,
  Globe,
  ArrowRight,
  ArrowRightLeft,
  Search,
  SlidersHorizontal,
  Gamepad2,
  Code2,
  FileCode,
  QrCode,
  FileText,
  Lock,
  Regex,
  Database,
  Share2,
  Webhook,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { RecentHistory } from '@/components/home/RecentHistory';
import { useLocale } from '@/context/LocalizationContext';

const TOOLS = [
  {
    href: '/epoch',
    icon: Clock,
    title: 'Epoch Converter',
    description:
      'Convert Unix timestamps to readable dates and back. Live Unix clock, timezone adjustments, and copyable snippets.',
    features: ['Live Unix clock', 'Timezone support', 'Microsecond precision', 'Code examples'],
    category: 'converters',
    badge: 'Epoch',
    color: 'blue',
    keywords: ['epoch converter', 'unix timestamp converter', 'unix time', 'timestamp to date', 'date to timestamp', 'epoch time', 'unix epoch', 'convert timestamp', 'current unix time', 'epochconverter'],
  },
  {
    href: '/json',
    icon: Braces,
    title: 'JSON Viewer',
    description:
      'Format, validate, and explore JSON syntax with syntax highlighting, search, and nesting node tree explorer.',
    features: ['Format & minify', 'Error highlights', 'TypeScript interface gen', 'Large file support'],
    category: 'formatters',
    badge: 'JSON',
    color: 'green',
    keywords: ['json formatter', 'json beautifier', 'json prettifier', 'json validator', 'format json', 'beautify json', 'minify json', 'parse json', 'json parser', 'json editor', 'json tree view', 'json lint', 'jsonlint'],
  },
  {
    href: '/jwt',
    icon: Shield,
    title: 'JWT Decoder & Encoder',
    description:
      'Decode payload details, check headers, verify HMAC/RSA signatures, and encode signed JSON Web Tokens client-side.',
    features: ['Local sign & verify', 'Decoded claim help', 'Epoch timestamp parse', 'RS256 SPKI/PKCS8 key'],
    category: 'formatters',
    badge: 'JWT',
    color: 'red',
    keywords: ['jwt decoder', 'jwt encoder', 'json web token', 'decode jwt', 'jwt parser', 'bearer token decoder', 'jwt debugger', 'token decoder', 'jwt payload', 'auth token viewer', 'jwt verify'],
  },

  {
    href: '/cron',
    icon: CalendarRange,
    title: 'Cron Expression Generator',
    description:
      'Build cron expression strings visually, parse values into English, and plot next execution dates.',
    features: ['Visual rule builder', 'cronstrue English info', 'cron-parser calendar list', 'Quartz schedule support'],
    category: 'generators',
    badge: 'Scheduler',
    color: 'indigo',
    keywords: ['cron generator', 'cron expression builder', 'crontab generator', 'cron job creator', 'cron syntax helper', 'visual cron builder', 'schedule generator', 'cron parser', 'cron humanizer', 'crontab syntax'],
  },
  {
    href: '/calendar',
    icon: CalendarRange,
    title: 'Calendar Planner',
    description:
      'Plan tasks and events on an interactive monthly calendar, then export them to Google Calendar, Outlook, or a downloadable .ics file.',
    features: ['Interactive monthly view', 'Task & event scheduler', 'Google/Outlook/.ics export', 'JSON backup & restore'],
    category: 'generators',
    badge: 'Planner',
    color: 'violet',
    keywords: ['calendar planner', 'task scheduler', 'calendar app', 'event planner', 'monthly calendar', 'interactive calendar', 'plan tasks', 'agenda planner', 'export to google calendar', 'export to outlook', 'ics file export', 'icalendar generator'],
  },
  {
    href: '/unit-converter',
    icon: Ruler,
    title: 'All Unit Converter',
    description:
      'Convert metric and imperial units across 10 categories including length, mass, digital storage, and temperature.',
    features: ['10 categories', 'Real-time conversion matrix', 'Unit swap', 'Scientific format support'],
    category: 'utilities',
    badge: 'Converter',
    color: 'orange',
    keywords: ['unit converter', 'length converter', 'weight converter', 'area converter', 'metric converter', 'convert units', 'measurement converter', 'imperial to metric'],
  },
  {
    href: '/color-picker',
    icon: Palette,
    title: 'Color Picker & Contrast',
    description:
      'Pick color channels, fetch analogous/triadic palettes, and validate WCAG AA/AAA typography readability.',
    features: ['RGB/HSL/CMYK/HSV', 'Harmonies generator', 'WCAG contrast ratio', 'Preview typography renders'],
    category: 'utilities',
    badge: 'Design',
    color: 'pink',
    keywords: ['color picker', 'hex color picker', 'rgb to hex', 'color contrast checker', 'random color generator', 'color palette generator', 'color converter', 'hsl color picker', 'accessibility contrast checker'],
  },
  {
    href: '/encoder-decoder',
    icon: ShieldCheck,
    title: 'Encoder / Decoder',
    description:
      'Convert strings to/from Base64, URL encoding, HTML entities, Hex, Binary, Morse code, or Caesar shifting.',
    features: ['Base64 file drop', 'URL query param editor', 'ROT13 & Caesar shifts', 'Hex/Bin separators'],
    category: 'converters',
    badge: 'Encode',
    color: 'emerald',
    keywords: ['base64 encode', 'base64 decode', 'b64', 'url encode', 'url decode', 'hex encode', 'hex decode', 'html entity encode', 'encode text', 'decode string', 'text encoder', 'text decoder', 'percent encoding', 'rot13'],
  },
  {
    href: '/calculator',
    icon: Calculator,
    title: 'Calculators (EMI, Salary, Age)',
    description:
      'Compute mortgage Loan EMIs, Gross/Net Salary intervals, age differences, and calendar date math offsets.',
    features: ['Amortization table CSV', 'Gross vs Net deductions', 'Age date interval', 'SVG donut percentages'],
    category: 'utilities',
    badge: 'Finance',
    color: 'sky',
    keywords: ['emi calculator', 'loan calculator', 'salary calculator', 'gst calculator', 'sip calculator', 'bmi calculator', 'finance calculator', 'tax calculator', 'interest calculator'],
  },

  {
    href: '/image-tool',
    icon: Sparkles,
    title: 'Image Compressor & Enhancer',
    description:
      'Compress JPEG/PNG/WebP images, scale dimensions by custom ratios, adjust enhancement filters, and generate a full favicon package locally.',
    features: ['Quality adjustments', 'Percentage scale', 'Canvas filters', 'Favicon & app icon generator'],
    category: 'utilities',
    badge: 'Media',
    color: 'amber',
    keywords: ['image compressor', 'image optimizer', 'resize image', 'compress image', 'image converter', 'image quality reducer', 'photo compressor', 'exif viewer', 'favicon generator', 'favicon maker', 'ico generator', 'apple touch icon generator', 'generate favicon', 'site icon creator'],
  },
  {
    href: '/converters',
    icon: RefreshCw,
    title: 'Structured Data Format Converter',
    description:
      'Translate between CSV spreadsheets, XML configs, YAML schemas, and Markdown documents client-side in real time.',
    features: ['CSV ↔ JSON dynamic grid', 'XML ↔ JSON nested trees', 'YAML ↔ JSON configurations', 'Live Markdown editor & preview'],
    category: 'converters',
    badge: 'Converter',
    color: 'teal',
    keywords: ['csv to json', 'json to csv', 'xml to json', 'json to xml', 'yaml to json', 'json to yaml', 'markdown to html', 'markdown editor', 'markdown previewer', 'md to html', 'html to markdown', 'data format converter', 'csv parser', 'xml parser', 'yaml parser', 'live markdown preview'],
  },
  {
    href: '/currency',
    icon: Coins,
    title: 'Currency Exchanger',
    description:
      'Exchange global currencies with live API rates, 7-day sparkline charts, and offline custom rates configurations.',
    features: ['Live public API rates', 'Simulated 7-day sparkline', 'Offline Custom Rates config', 'Top currency matrix'],
    category: 'utilities',
    badge: 'Currency',
    color: 'blue',
    keywords: ['currency converter', 'exchange rate calculator', 'forex converter', 'money converter', 'currency exchange rates', 'convert currency offline'],
  },
  {
    href: '/ip-intel',
    icon: Globe,
    title: 'IP & Identity Intelligence',
    description:
      'Check current client/remote IP information, lookup ISP network details, and validate email or phone structures.',
    features: ['Auto client IP fetch', 'Detailed geolocation & ISP', 'Disposable email flags', 'E.164 phone check'],
    category: 'system',
    badge: 'Network',
    color: 'blue',
    keywords: ['ip lookup', 'my ip address', 'geo ip lookup', 'ip address finder', 'what is my ip', 'ip validator', 'http ping', 'ping tool'],
  },
  {
    href: '/speed-test',
    icon: Zap,
    title: 'Internet Speed Tester',
    description:
      'Evaluate your internet connection latency, jitter, download speed, and upload speed with an animated speedometer.',
    features: ['Animated gauge needle', 'Ping & Jitter latency check', 'Download stream reader telemetry', 'Session logs history'],
    category: 'system',
    badge: 'Telemetry',
    color: 'pink',
    keywords: ['internet speed test', 'download speed test', 'upload speed test', 'ping test', 'jitter test', 'bandwidth test', 'network speed checker'],
  },
  {
    href: '/file-converter',
    icon: RefreshCw,
    title: 'Client-Side File Converter',
    description:
      'Convert CSV tables to JSON arrays, JSON lists to CSV sheets, Markdown docs to HTML, and draw/convert image formats.',
    features: ['CSV ↔ JSON structure', 'Markdown ↔ HTML previews', 'WebP/PNG/JPG canvas exports', 'Local file upload zone'],
    category: 'converters',
    badge: 'Converter',
    color: 'teal',
    keywords: ['file converter', 'convert files', 'file format converter', 'document converter', 'image to base64', 'file to text converter', 'client-side file conversion', 'batch file convert'],
  },
  {
    href: '/text-utils',
    icon: FileText,
    title: 'Text Case Converter & Counters',
    description:
      'Modify case styles (camel, Pascal, snake, kebab), calculate text reading/speaking times, and count words, sentences, and lines.',
    features: ['10+ case transforms', 'Speaking/reading time estimators', 'Frequency distribution logs', 'Word/Char/Sentence counters'],
    category: 'converters',
    badge: 'Text',
    color: 'pink',
    keywords: ['case converter', 'uppercase lowercase converter', 'camel case', 'snake case', 'kebab case', 'title case', 'text analytics', 'word counter', 'character counter', 'text case converter', 'capitalize text', 'text statistics'],
  },
  {
    href: '/diff-checker',
    icon: ArrowRightLeft,
    title: 'Code Diff Checker',
    description:
      'Compare files, code blocks, or standard text strings side-by-side or in inline unified views using Monaco DiffEditor.',
    features: ['Monaco Diff editor', 'Side-by-side & unified layout', 'Local files upload dropzone', 'Format checking'],
    category: 'formatters',
    badge: 'Format',
    color: 'emerald',
    keywords: ['diff checker', 'text diff', 'compare text', 'code diff', 'file diff', 'diff tool', 'text comparison', 'side by side diff', 'unified diff', 'compare code', 'what changed between two files'],
  },
  {
    href: '/countdown',
    icon: Clock,
    title: 'Countdown Timer & Lap Stopwatch',
    description:
      'Visual circular countdown timer, custom alarms, tab title duration trackers, and stopwatch lap recorder.',
    features: ['Circular countdown SVG', 'Offline audio chime synths', 'Lap list stopwatch', 'Tab title progress indicator'],
    category: 'utilities',
    badge: 'Clock',
    color: 'sky',
    keywords: ['countdown timer', 'stopwatch', 'timer app', 'lap timer', 'event countdown', 'online timer', 'visual countdown'],
  },
  {
    href: '/lorem-ipsum',
    icon: FileText,
    title: 'Lorem Ipsum Generator',
    description:
      'Create placeholder dummy text paragraphs, sentences, words, and list structures for design mockups.',
    features: ['Custom paragraphs & lists', 'HTML wrapper wraps', 'Random generator seeds', 'Clipboard copies'],
    category: 'generators',
    badge: 'Text',
    color: 'violet',
    keywords: ['lorem ipsum generator', 'placeholder text generator', 'dummy text generator', 'filler text', 'sample text generator', 'lorem ipsum dolor', 'fake paragraph generator'],
  },
  {
    href: '/security-tools',
    icon: Lock,
    title: 'Security & Key Generator Suite',
    description:
      'Generate secure passwords, cryptographically random UUIDs (v4/v1/v5), sortable ULIDs, NanoIDs, sign HMAC hashes, and verify BCrypt strings.',
    features: ['UUID, ULID & NanoID generator', 'BCrypt hasher & verifier', 'HMAC signature signing', 'Entropy strength checks'],
    category: 'generators',
    badge: 'Security',
    color: 'amber',
    keywords: ['password generator', 'random password generator', 'secure key generator', 'hmac generator', 'bcrypt hash', 'uuid generator', 'guid generator', 'unique id generator', 'random id', 'uuid v4', 'identifier generator', 'unique identifier', 'token generator', 'secret key generator', 'hash generator'],
  },
  {
    href: '/qr-barcode',
    icon: QrCode,
    title: 'QR & Barcode Creator',
    description:
      'Generate customizeable SVG/PNG QR Codes with size scaling and barcodes matching multiple international standards.',
    features: ['QR SVG/PNG options', 'CODE128/CODE39/EAN barcodes', 'Live validation checkers', 'Batch file saving'],
    category: 'generators',
    badge: 'Marketing',
    color: 'blue',
    keywords: ['qr code generator', 'barcode generator', 'qr generator', 'create qr code', 'generate barcode', 'qr code maker', 'barcode maker', 'scan code generator'],
  },
  {
    href: '/pdf-tools',
    icon: FileCode,
    title: 'PDF Merger, Splitter & Protector',
    description:
      'Merge multiple PDF documents client-side, extract specific pages, or password-protect files with User & Owner encryption.',
    features: ['Drag-and-drop file reordering', 'Client-side pdf-lib processor', 'Password locking', 'Page range selectors'],
    category: 'system',
    badge: 'PDF',
    color: 'purple',
    keywords: ['merge pdf', 'split pdf', 'password protect pdf', 'pdf tools', 'combine pdf', 'pdf merger', 'pdf splitter', 'encrypt pdf', 'compress pdf'],
  },
  {
    href: '/html-preview',
    icon: Code2,
    title: 'HTML/CSS/JS Sandbox Preview',
    description:
      'Code playground split-view sandbox. Run client-side scripts, styles, and view intercepted console outputs directly.',
    features: ['Interactive sandbox preview', 'Split-screen layout', 'Captured console logs tray', 'Live hot-reloading'],
    category: 'formatters',
    badge: 'Sandbox',
    color: 'indigo',
    keywords: ['html preview', 'css preview', 'js playground', 'live html editor', 'code sandbox', 'html css js editor', 'codepen alternative', 'html renderer', 'frontend playground', 'live code preview'],
  },
  {
    href: '/fake-address',
    icon: Globe,
    title: 'Fake Address & Persona Generator',
    description:
      'Generate realistic mock personas containing names, phones, credit cards, physical addresses, and occupations for testing.',
    features: ['US/UK/IN/CA regions', 'Valid Luhn credit cards', 'Bulk profiles export', 'Offline mock DBs'],
    category: 'generators',
    badge: 'Testing',
    color: 'orange',
    keywords: ['fake data generator', 'mock data generator', 'fake address generator', 'fake name generator', 'test data generator', 'dummy profile generator', 'random person generator', 'fake identity generator'],
  },
  {
    href: '/fun-tools',
    icon: Gamepad2,
    title: 'Fun Utilities Playground',
    description:
      'Simulate 3D coin flips, 3D dice rollers, split participants into random teams, or spin interactive name fortune wheels.',
    features: ['3D CSS flip animations', '3D CSS dice cubes', 'HTML5 canvas name wheel', 'Random team builders'],
    category: 'system',
    badge: 'Play',
    color: 'red',
    keywords: ['coin flip', 'dice roller', 'random name picker', 'decision maker', 'random wheel', 'spin wheel'],
  },
  {
    href: '/regex-tester',
    icon: Regex,
    title: 'Regex Tester & Builder',
    description:
      'Build and debug regular expressions with live match highlighting, capture group details, and a replace-mode preview — all client-side.',
    features: ['Live match highlighting', 'Capture group inspector', 'Replace mode preview', 'Common pattern library'],
    category: 'formatters',
    badge: 'Regex',
    color: 'red',
    keywords: ['regex tester', 'regex builder', 'regular expression tester', 'regex validator', 'regex debugger', 'pattern matcher', 'regex101 alternative', 'test regex', 'regex match highlighter', 'regex replace tool', 'regexp tester', 'regex cheat sheet'],
  },
  {
    href: '/sql-formatter',
    icon: Database,
    title: 'SQL Formatter & Beautifier',
    description:
      'Beautify or minify SQL queries across MySQL, PostgreSQL, SQLite, T-SQL, PL/SQL, BigQuery, and more.',
    features: ['10+ SQL dialects', 'Keyword case options', 'Beautify & minify', 'Copy & download'],
    category: 'formatters',
    badge: 'SQL',
    color: 'sky',
    keywords: ['sql formatter', 'sql beautifier', 'sql prettifier', 'format sql', 'beautify sql', 'sql minifier', 'query formatter', 'mysql formatter', 'postgresql formatter', 'sql linter', 'sql pretty print', 'sequel formatter'],
  },
  {
    href: '/graphql-formatter',
    icon: Share2,
    title: 'GraphQL Formatter & Validator',
    description:
      'Pretty-print or minify GraphQL queries and schemas, with syntax validation and optional schema checking.',
    features: ['Format & pretty-print', 'Syntax validation', 'Optional schema validation', 'Minify queries'],
    category: 'formatters',
    badge: 'GraphQL',
    color: 'violet',
    keywords: ['graphql formatter', 'graphql validator', 'graphql beautifier', 'format graphql query', 'graphql linter', 'gql formatter', 'graphql schema validator', 'prettify graphql', 'graphql syntax checker'],
  },
  {
    href: '/http-toolkit',
    icon: Webhook,
    title: 'HTTP Toolkit',
    description:
      "Look up HTTP status codes, inspect a URL's response headers server-side, or generate a live webhook capture URL to test incoming requests.",
    features: ['Searchable status code reference', 'Server-side header inspector', 'Live webhook capture URL', 'SSRF-guarded requests'],
    category: 'system',
    badge: 'HTTP',
    color: 'emerald',
    keywords: ['http status codes', 'status code reference', 'http header inspector', 'webhook tester', 'webhook.site alternative', 'http response viewer', 'header checker', 'webhook testing tool', 'http status lookup', 'api status codes', 'rest api status codes', 'check response headers'],
  },
];

const CATEGORIES = [
  { value: 'all', label: 'All Tools' },
  { value: 'converters', label: 'Converters & Parsers' },
  { value: 'formatters', label: 'Formatters & Viewers' },
  { value: 'generators', label: 'Generators' },
  { value: 'utilities', label: 'Calculators & Utilities' },
  { value: 'system', label: 'System & Network' },
];

const FEATURES = [
  {
    icon: Zap,
    title: 'Blazing Fast',
    description: 'All operations run client-side in your browser with no network latency.',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'Your data never leaves your browser. No logging, no tracking, no ads.',
  },
  {
    icon: Globe,
    title: 'Offline Ready',
    description: 'Works without internet. Fully installable as a Progressive Web App.',
  },
];

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
};

export default function HomePage() {
  const { t } = useLocale();
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('all');

  const filteredTools = TOOLS.filter((tool) => {
    const q = search.toLowerCase();
    const matchesSearch =
      tool.title.toLowerCase().includes(q) ||
      tool.description.toLowerCase().includes(q) ||
      tool.badge.toLowerCase().includes(q) ||
      tool.features.some((f) => f.toLowerCase().includes(q)) ||
      tool.keywords.some((k) => k.toLowerCase().includes(q));

    const matchesCategory = activeCat === 'all' || tool.category === activeCat;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-background to-muted/20">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-gradient-to-tr from-blue-500/20 via-purple-500/10 to-transparent blur-3xl"
        />
        <div className="container py-16 md:py-20 text-center max-w-3xl mx-auto relative animate-fade-in">
          <Badge variant="secondary" className="mb-4 text-xs font-semibold">
            {t('welcome')}
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 leading-tight bg-gradient-to-r from-blue-600 via-purple-600 to-blue-500 bg-clip-text text-transparent">
            {t('suiteTitle')}
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
            {t('tagline')}
          </p>
        </div>
      </section>

      {/* Main dashboard search and filters */}
      <section className="container py-10 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">{t('tools')}</h2>

          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2.5 items-center">
            {/* Search Bar */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 text-xs h-9 bg-card"
              />
            </div>

            {/* Category tabs */}
            <div className="flex flex-wrap gap-1 w-full sm:w-auto">
              {CATEGORIES.map((cat) => {
                const getCatLabel = (val: string) => {
                  switch (val) {
                    case 'all': return t('allTools');
                    case 'converters': return t('converters');
                    case 'formatters': return t('formatters');
                    case 'generators': return t('generators');
                    case 'utilities': return t('utilities');
                    case 'system': return t('systemNetwork');
                    default: return val;
                  }
                };
                return (
                  <Button
                    key={cat.value}
                    variant={activeCat === cat.value ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setActiveCat(cat.value)}
                  >
                    {getCatLabel(cat.value)}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tools grid */}
        {filteredTools.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTools.map(({ href, icon: Icon, title, description, features, color, badge }) => {
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
              const displayTitle = mapped ? t(mapped.title) : title;
              const displayDesc = mapped ? t(mapped.desc) : description;

              return (
                <Link key={href} href={href} className="group">
                  <Card className="h-full transition-all duration-200 hover:shadow-lg hover:border-primary/50 group-hover:-translate-y-0.5 border">
                    <CardContent className="p-4 flex flex-col justify-between h-full space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                              COLOR_MAPS[color] || 'bg-muted text-muted-foreground'
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <Badge variant="secondary" className="text-[10px] font-semibold">{badge}</Badge>
                        </div>

                        <div>
                          <h3 className="text-sm font-bold group-hover:text-primary transition-colors">{displayTitle}</h3>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed min-h-[40px]">
                            {displayDesc}
                          </p>
                        </div>

                        <ul className="space-y-1 pt-1.5 border-t border-dashed">
                          {features.slice(0, 3).map((f) => (
                            <li key={f} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                              <div className="h-1.5 w-1.5 rounded-full bg-primary/70 shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex items-center text-xs font-semibold text-primary group-hover:gap-2 gap-1 transition-all pt-2">
                        {t('openTool') !== 'openTool' ? t('openTool') : 'Open Tool'}
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed rounded-lg bg-card/50">
            <SlidersHorizontal className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">No tools match your active filters</p>
            <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setActiveCat('all'); }} className="text-primary mt-2">
              {t('clearFilters')}
            </Button>
          </div>
        )}
      </section>

      {/* Features summary bar */}
      <section className="border-t bg-muted/20">
        <div className="container py-10 md:py-14 max-w-4xl mx-auto">
          <div className="grid gap-6 sm:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description }) => {
              const transMap: Record<string, { title: string; desc: string }> = {
                'Blazing Fast': { title: 'fastTitle', desc: 'fastDesc' },
                'Privacy First': { title: 'privacyTitle', desc: 'privacyDesc' },
                'Offline Ready': { title: 'offlineTitle', desc: 'offlineDesc' },
              };
              const mapped = transMap[title];
              const displayTitle = mapped ? t(mapped.title) : title;
              const displayDesc = mapped ? t(mapped.desc) : description;

              return (
                <div key={title} className="flex flex-col items-center text-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="font-bold text-xs">{displayTitle}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{displayDesc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Recent History */}
      <section className="container py-10">
        <RecentHistory />
      </section>
    </div>
  );
}
