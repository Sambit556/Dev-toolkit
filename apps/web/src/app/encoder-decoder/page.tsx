import type { Metadata } from 'next';
import { ShieldCheck } from 'lucide-react';
import { EncoderDecoderTool } from '@/components/encoder-decoder/EncoderDecoderTool';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'Encoder/Decoder & URL Parser',
  description:
    'Convert content client-side using Base64, URL encoding, HTML entities, Hex, Binary, Octal, Caesar cipher, ROT13, and Morse code. Inspect and edit URL structure and query parameters.',
  alternates: { canonical: '/encoder-decoder' },
};

export default function EncoderDecoderPage() {
  return (
    <div className="container py-6 md:py-8 max-w-5xl">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Encoder / Decoder</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Encode and decode text in standard data encodings (Base64, Hex, Binary), text formatting, or ciphers. 
          Deconstruct URLs into domains, ports, hash anchors, and edit query variables dynamically.
        </p>
      </div>

      <Separator className="mb-6" />

      {/* Main tool container */}
      <EncoderDecoderTool />
    </div>
  );
}
