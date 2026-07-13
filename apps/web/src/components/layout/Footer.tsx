'use client';

import React from 'react';
import Link from 'next/link';
import {
  Clock,
  Braces,
  Shield,
  ShieldCheck,
  RefreshCw,
  ArrowRightLeft,
  CalendarRange,
  Calculator,
  Coins,
  Ruler,
  Palette,
  Sparkles,
  Globe,
  Zap,
  Github,
  HeartHandshake,
  FileText,
  Lock,
  QrCode,
  Gamepad2,
  FileCode,
  Timer,
  Calendar,
  Regex,
  Database,
  Share2,
  Webhook,
} from 'lucide-react';
import { useLocale } from '@/context/LocalizationContext';

export function Footer() {
  const { t } = useLocale();

  return (
    <footer className="border-t mt-auto bg-background">
      <div className="container py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-bold">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-black">
                DK
              </div>
              DevKits
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('tagline')} {t('privacyNote')}
            </p>
          </div>

          {/* Formatters & Viewers */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-4">
              Formatters & Viewers
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/json" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Braces className="h-3.5 w-3.5 text-primary/70" />
                  JSON Viewer
                </Link>
              </li>
              <li>
                <Link href="/jwt" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Shield className="h-3.5 w-3.5 text-primary/70" />
                  JWT Decoder
                </Link>
              </li>
              <li>
                <Link href="/diff-checker" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowRightLeft className="h-3.5 w-3.5 text-primary/70" />
                  Code Diff Checker
                </Link>
              </li>
              <li>
                <Link href="/html-preview" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Sparkles className="h-3.5 w-3.5 text-primary/70" />
                  HTML/CSS/JS Sandbox
                </Link>
              </li>
              <li>
                <Link href="/regex-tester" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Regex className="h-3.5 w-3.5 text-primary/70" />
                  Regex Tester
                </Link>
              </li>
              <li>
                <Link href="/sql-formatter" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Database className="h-3.5 w-3.5 text-primary/70" />
                  SQL Formatter
                </Link>
              </li>
              <li>
                <Link href="/graphql-formatter" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Share2 className="h-3.5 w-3.5 text-primary/70" />
                  GraphQL Formatter
                </Link>
              </li>
            </ul>
          </div>

          {/* Converters & Generators */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-4">
              Converters & Generators
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/epoch" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Clock className="h-3.5 w-3.5 text-primary/70" />
                  Epoch Converter
                </Link>
              </li>
              <li>
                <Link href="/converters" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <RefreshCw className="h-3.5 w-3.5 text-primary/70" />
                  Structured Data Converter
                </Link>
              </li>
              <li>
                <Link href="/encoder-decoder" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary/70" />
                  Text Encoder / Decoder
                </Link>
              </li>
              <li>
                <Link href="/text-utils" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <FileText className="h-3.5 w-3.5 text-primary/70" />
                  Text & Case Utility
                </Link>
              </li>
              <li>
                <Link href="/file-converter" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowRightLeft className="h-3.5 w-3.5 text-primary/70" />
                  Universal File Converter
                </Link>
              </li>
              <li>
                <Link href="/cron" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <CalendarRange className="h-3.5 w-3.5 text-primary/70" />
                  Cron Generator
                </Link>
              </li>
              <li>
                <Link href="/calendar" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Calendar className="h-3.5 w-3.5 text-primary/70" />
                  Calendar Planner
                </Link>
              </li>
              <li>
                <Link href="/security-tools" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Lock className="h-3.5 w-3.5 text-primary/70" />
                  Security & Key Suite
                </Link>
              </li>
              <li>
                <Link href="/qr-barcode" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <QrCode className="h-3.5 w-3.5 text-primary/70" />
                  QR & Barcode Creator
                </Link>
              </li>
              <li>
                <Link href="/lorem-ipsum" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <FileText className="h-3.5 w-3.5 text-primary/70" />
                  Lorem Ipsum
                </Link>
              </li>
              <li>
                <Link href="/fake-address" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Globe className="h-3.5 w-3.5 text-primary/70" />
                  Fake Person & Address
                </Link>
              </li>
            </ul>
          </div>

          {/* Calculators & Utilities */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-4">
              Calculators & Utilities
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/calculator" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Calculator className="h-3.5 w-3.5 text-primary/70" />
                  Calculators Suite
                </Link>
              </li>
              <li>
                <Link href="/currency" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Coins className="h-3.5 w-3.5 text-primary/70" />
                  Currency Exchange
                </Link>
              </li>
              <li>
                <Link href="/unit-converter" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Ruler className="h-3.5 w-3.5 text-primary/70" />
                  Unit Converter
                </Link>
              </li>
              <li>
                <Link href="/color-picker" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Palette className="h-3.5 w-3.5 text-primary/70" />
                  Color Tool Suite
                </Link>
              </li>
              <li>
                <Link href="/image-tool" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Sparkles className="h-3.5 w-3.5 text-primary/70" />
                  Image Optimizer
                </Link>
              </li>
              <li>
                <Link href="/ip-intel" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Globe className="h-3.5 w-3.5 text-primary/70" />
                  IP & Identity
                </Link>
              </li>
              <li>
                <Link href="/speed-test" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Zap className="h-3.5 w-3.5 text-primary/70" />
                  Speed Test
                </Link>
              </li>
              <li>
                <Link href="/pdf-tools" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <FileCode className="h-3.5 w-3.5 text-primary/70" />
                  PDF Suite
                </Link>
              </li>
              <li>
                <Link href="/http-toolkit" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Webhook className="h-3.5 w-3.5 text-primary/70" />
                  HTTP Toolkit
                </Link>
              </li>
              <li>
                <Link href="/countdown" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Timer className="h-3.5 w-3.5 text-primary/70" />
                  Countdown & Stopwatch
                </Link>
              </li>
              <li>
                <Link href="/fun-tools" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Gamepad2 className="h-3.5 w-3.5 text-primary/70" />
                  Fun Utilities
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources & Privacy */}
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-4">
                Resources
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/support" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <HeartHandshake className="h-3.5 w-3.5 text-primary/70" />
                    Support
                  </Link>
                </li>
                <li>
                  <a
                    href="https://github.com/Sambit556/Dev-toolkit"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Github className="h-3.5 w-3.5 text-primary/70" />
                    Open Source
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">
                Security Sandbox
              </h4>
              <ul className="space-y-2 text-[10px] text-muted-foreground leading-normal">
                <li className="flex items-start gap-1.5">
                  <span className="text-primary font-bold">✓</span> Local sandboxed execution
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-primary font-bold">✓</span> No server logs or storage
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-primary font-bold">✓</span> Fully offline compatible
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <p>© 2026 DevKits. Built for developers by <span className="font-semibold text-foreground">Sambit</span>.</p>
          <a
            href="https://github.com/Sambit556/Dev-toolkit"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <Github className="h-3.5 w-3.5" />
            {t('openSource')}
          </a>
        </div>
      </div>
    </footer>
  );
}
