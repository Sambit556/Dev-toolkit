import {
  Clock,
  Braces,
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
  Globe,
  Gamepad2,
  ArrowRightLeft,
  Zap,
  Code2,
  FileCode,
  QrCode,
  FileText,
  Lock,
} from 'lucide-react';

export const toolCategories = [
  {
    name: 'Formatters & Viewers',
    items: [
      { href: '/json', label: 'JSON Viewer', icon: Braces, desc: 'Format and explore JSON text' },
      { href: '/jwt', label: 'JWT Decoder', icon: Shield, desc: 'Decode & encode tokens' },
      { href: '/diff-checker', label: 'Diff Checker', icon: ArrowRightLeft, desc: 'Compare text and code side-by-side' },
      { href: '/html-preview', label: 'HTML Sandbox', icon: Code2, desc: 'Live preview HTML/CSS/JS playground' },
    ],
  },
  {
    name: 'Converters & Parsers',
    items: [
      { href: '/epoch', label: 'Epoch Converter', icon: Clock, desc: 'Unix timestamp converter' },
      { href: '/encoder-decoder', label: 'Text Encoder / Decoder', icon: ShieldCheck, desc: 'Base64, URL, Hex, HTML' },
      { href: '/converters', label: 'Data Format Converter', icon: RefreshCw, desc: 'CSV, XML, YAML, Markdown parser' },
      { href: '/text-utils', label: 'Text & Case Utility', icon: FileText, desc: 'Case conversion & analytics' },
      { href: '/file-converter', label: 'Universal File Converter', icon: ArrowRightLeft, desc: 'Convert files client-side' },
    ],
  },
  {
    name: 'Generators',
    items: [
      { href: '/cron', label: 'Cron Generator', icon: CalendarRange, desc: 'Visual cron scheduler' },
      { href: '/security-tools', label: 'Security & Key Suite', icon: Lock, desc: 'Passwords, Keys, HMAC, BCrypt, UUIDs' },
      { href: '/qr-barcode', label: 'QR & Barcode Creator', icon: QrCode, desc: 'Generate QR codes and barcodes' },
      { href: '/lorem-ipsum', label: 'Lorem Ipsum', icon: FileText, desc: 'Generate dummy placeholder text' },
      { href: '/fake-address', label: 'Fake Person & Address', icon: Globe, desc: 'Mock test profile datasets' },
    ],
  },
  {
    name: 'Calculators & Design',
    items: [
      { href: '/calculator', label: 'Calculators Suite', icon: Calculator, desc: 'EMI, Salary, GST, SIP, BMI' },
      { href: '/currency', label: 'Currency Exchange', icon: Coins, desc: 'Exchange rates & offline values' },
      { href: '/unit-converter', label: 'Unit Converter', icon: Ruler, desc: 'Length, weight, area conversions' },
      { href: '/color-picker', label: 'Color Tool Suite', icon: Palette, desc: 'Picker, contrast, random palettes' },
      { href: '/image-tool', label: 'Image Optimizer', icon: Sparkles, desc: 'Compress, scale, filter' },
    ],
  },
  {
    name: 'System & Network',
    items: [
      { href: '/ip-intel', label: 'IP & Identity', icon: Globe, desc: 'Geo-IP & validation + HTTP Ping' },
      { href: '/speed-test', label: 'Speed Test', icon: Zap, desc: 'Ping, jitter, download, upload' },
      { href: '/pdf-tools', label: 'PDF Suite', icon: FileCode, desc: 'Merge, split, and password protect' },
      { href: '/fun-tools', label: 'Fun Utilities', icon: Gamepad2, desc: 'Coin flip, dice roll, name wheel' },
    ],
  },
];
