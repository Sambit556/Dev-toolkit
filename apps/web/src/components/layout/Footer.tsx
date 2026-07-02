import React from 'react';
import Link from 'next/link';
import { Clock, Braces, Github, HeartHandshake } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t mt-auto">
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 font-bold mb-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-black">
                DC
              </div>
              DevChrono JSONLab
            </div>
            <p className="text-sm text-muted-foreground">
              Fast, private developer utilities. All processing happens in your browser.
            </p>
          </div>

          {/* Tools */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Tools</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/epoch" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Clock className="h-3.5 w-3.5" />
                  Epoch Converter
                </Link>
              </li>
              <li>
                <Link href="/json" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Braces className="h-3.5 w-3.5" />
                  JSON Viewer
                </Link>
              </li>
              <li>
                <Link href="/support" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <HeartHandshake className="h-3.5 w-3.5" />
                  Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Privacy */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Privacy First</h4>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li>✓ Client-side processing</li>
              <li>✓ No data collection</li>
              <li>✓ No ads or tracking</li>
              <li>✓ Open source</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} DevChrono JSONLab. Built for developers.</p>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <Github className="h-3.5 w-3.5" />
            Open Source
          </a>
        </div>
      </div>
    </footer>
  );
}
