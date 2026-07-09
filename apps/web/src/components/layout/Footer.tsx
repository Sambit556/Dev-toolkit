'use client';

import React from 'react';
import Link from 'next/link';
import {
  Clock,
  Braces,
  Shield,
  Layers,
  ShieldCheck,
  RefreshCw,
  ArrowRightLeft,
  Fingerprint,
  CalendarRange,
  Calculator,
  Coins,
  Ruler,
  Palette,
  Sparkles,
  Globe,
  Zap,
  Github,
  HeartHandshake
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
                DT
              </div>
              DevToolkit
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('tagline')} {t('privacyNote')}
            </p>
          </div>

          {/* Converters & Formatters */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-foreground mb-4">
              {t('converters')} & {t('formatters')}
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/epoch" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Clock className="h-3.5 w-3.5 text-primary/70" />
                  {t('epochTitle')}
                </Link>
              </li>
              <li>
                <Link href="/json" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Braces className="h-3.5 w-3.5 text-primary/70" />
                  {t('jsonTitle')}
                </Link>
              </li>
              <li>
                <Link href="/jwt" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Shield className="h-3.5 w-3.5 text-primary/70" />
                  {t('jwtTitle')}
                </Link>
              </li>
              <li>
                <Link href="/yaml-json" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Layers className="h-3.5 w-3.5 text-primary/70" />
                  {t('yamlTitle')}
                </Link>
              </li>
              <li>
                <Link href="/encoder-decoder" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary/70" />
                  {t('encoderDecoderTitle')}
                </Link>
              </li>
              <li>
                <Link href="/converters" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <RefreshCw className="h-3.5 w-3.5 text-primary/70" />
                  {t('convertersTitle')}
                </Link>
              </li>
              <li>
                <Link href="/file-converter" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowRightLeft className="h-3.5 w-3.5 text-primary/70" />
                  {t('fileConverterTitle')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Generators & Utilities */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-foreground mb-4">
              {t('generators')} & {t('utilities')}
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/uuid" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Fingerprint className="h-3.5 w-3.5 text-primary/70" />
                  {t('uuidTitle')}
                </Link>
              </li>
              <li>
                <Link href="/cron" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <CalendarRange className="h-3.5 w-3.5 text-primary/70" />
                  {t('cronTitle')}
                </Link>
              </li>
              <li>
                <Link href="/unit-converter" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Ruler className="h-3.5 w-3.5 text-primary/70" />
                  {t('unitTitle')}
                </Link>
              </li>
              <li>
                <Link href="/color-picker" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Palette className="h-3.5 w-3.5 text-primary/70" />
                  {t('colorTitle')}
                </Link>
              </li>
              <li>
                <Link href="/calculator" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Calculator className="h-3.5 w-3.5 text-primary/70" />
                  {t('calculatorTitle')}
                </Link>
              </li>
              <li>
                <Link href="/image-tool" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Sparkles className="h-3.5 w-3.5 text-primary/70" />
                  {t('imageTitle')}
                </Link>
              </li>
              <li>
                <Link href="/currency" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Coins className="h-3.5 w-3.5 text-primary/70" />
                  {t('currencyTitle')}
                </Link>
              </li>
              <li>
                <Link href="/ip-intel" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Globe className="h-3.5 w-3.5 text-primary/70" />
                  {t('ipIntelTitle')}
                </Link>
              </li>
              <li>
                <Link href="/speed-test" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Zap className="h-3.5 w-3.5 text-primary/70" />
                  {t('speedTestTitle')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Privacy Checklist */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-foreground mb-4">
              {t('privacyTitle')}
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <span className="text-primary font-bold">✓</span> {t('privacyFeature1')}
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-primary font-bold">✓</span> {t('privacyFeature2')}
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-primary font-bold">✓</span> {t('privacyFeature3')}
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-primary font-bold">✓</span> {t('privacyFeature4')}
              </li>
            </ul>
          </div>

          {/* Support & Links */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-foreground mb-4">
              {t('support')} & Links
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/support" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <HeartHandshake className="h-3.5 w-3.5 text-primary/70" />
                  {t('support')}
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
                  {t('openSource')}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <p>© 2026 DevToolkit. Built for developers by <span className="font-semibold text-foreground">Sambit</span>.</p>
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
