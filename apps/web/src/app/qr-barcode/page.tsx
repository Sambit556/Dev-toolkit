import type { Metadata } from 'next';
import { QrCode, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Separator } from '@/components/ui/separator';

const QrBarcodeTool = dynamic(
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

export const metadata: Metadata = {
  title: 'QR Code & Barcode Generator — Create Custom Codes Online',
  description:
    'Generate customized QR codes (with colors, custom size, error correction levels) and barcodes (CODE128, CODE39, EAN-13, UPC-A) client-side and download as SVG or PNG.',
  alternates: { canonical: '/qr-barcode' },
};

export default function QrBarcodePage() {
  return (
    <div className="container py-6 md:py-8 max-w-5xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <QrCode className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">QR & Barcode Generator</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Encode text, URLs, contacts, or numbers into high-quality customized QR codes or standard barcodes. Set custom styling and download outputs instantly.
        </p>
      </div>

      <Separator className="mb-6" />

      <QrBarcodeTool />
    </div>
  );
}
