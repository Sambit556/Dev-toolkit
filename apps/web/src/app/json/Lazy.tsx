'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

export const JsonViewerPage = dynamic(
  () => import('@/components/json/JsonViewerPage').then((m) => m.JsonViewerPage),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen items-center justify-center bg-muted/20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);
