'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, Braces, Github, HeartHandshake } from 'lucide-react';
import { useLocale } from '@/context/LocalizationContext';

export function Footer() {
  const { t } = useLocale();

  return (
    <footer className="border-t mt-auto">
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 font-bold mb-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-black">
                DT
              </div>
              DevToolkit
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('tagline')} {t('privacyNote')}
            </p>
          </div>

          {/* Tools */}
          <div>
            <h4 className="text-sm font-semibold mb-3">{t('tools')}</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/epoch" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Clock className="h-3.5 w-3.5" />
                  {t('epochTitle')}
                </Link>
              </li>
              <li>
                <Link href="/json" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Braces className="h-3.5 w-3.5" />
                  {t('jsonTitle')}
                </Link>
              </li>
              <li>
                <Link href="/support" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <HeartHandshake className="h-3.5 w-3.5" />
                  {t('support')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Privacy */}
          <div>
            <h4 className="text-sm font-semibold mb-3">{t('privacyTitle')}</h4>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li>✓ {t('privacyFeature1')}</li>
              <li>✓ {t('privacyFeature2')}</li>
              <li>✓ {t('privacyFeature3')}</li>
              <li>✓ {t('privacyFeature4')}</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>© 2026 DevToolkit. Built for developers by <span className="font-semibold text-foreground">Sambit</span>.</p>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <Github className="h-3.5 w-3.5" />
            {t('openSource')}
          </a>
        </div>
      </div>
    </footer>
  );
}
