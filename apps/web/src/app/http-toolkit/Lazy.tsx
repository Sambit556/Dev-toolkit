'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

export const HttpToolkitTool = dynamic(
  () => import('@/components/http-toolkit/HttpToolkitTool').then((m) => m.HttpToolkitTool),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-12 bg-muted/20 border border-dashed rounded-xl">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);
