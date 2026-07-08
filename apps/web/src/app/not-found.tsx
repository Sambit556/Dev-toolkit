'use client';

import React from 'react';
import Link from 'next/link';
import { Home, Compass, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HexCanvasBg } from '@/components/layout/HexCanvasBg';

export default function NotFound() {
  return (
    <div className="relative min-h-[80vh] flex items-center justify-center container py-12 overflow-hidden">
      {/* Background hexagons particle grid */}
      <HexCanvasBg />

      {/* Main card center container */}
      <Card className="relative max-w-md w-full border border-primary/20 bg-card/65 backdrop-blur-md shadow-2xl p-8 rounded-2xl text-center space-y-6 animate-fade-in z-10">
        <CardContent className="p-0 space-y-6">
          {/* Neon warning icon badge */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
            <AlertTriangle className="h-8 w-8 animate-bounce" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight leading-none font-mono text-foreground">
              404 <span className="text-primary font-sans font-normal text-xl block mt-1">Resource Not Found</span>
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto pt-2">
              The utility page or configurations request parameter you searched for does not exist or has been relocated to another workspace index.
            </p>
          </div>

          {/* Action links */}
          <div className="flex flex-col gap-2.5 pt-2">
            <Link href="/" className="w-full">
              <Button variant="default" className="w-full text-xs font-bold gap-2 h-9 shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:scale-[1.01] transition-all">
                <Home className="h-4 w-4" />
                Return to Workspace
              </Button>
            </Link>
            <Link href="/" className="w-full">
              <Button variant="outline" className="w-full text-xs font-bold gap-2 h-9 hover:bg-muted/65">
                <Compass className="h-4 w-4" />
                Browse Available Tools
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
