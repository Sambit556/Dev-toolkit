'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

export const QrBarcodeTool = dynamic(
  () => import('@/components/qr-barcode/QrBarcodeTool').then((m) => m.QrBarcodeTool),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-12 bg-muted/20 border border-dashed rounded-xl">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);
