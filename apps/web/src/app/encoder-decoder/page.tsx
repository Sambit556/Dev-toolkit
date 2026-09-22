import { BackToHomeLink } from '@/components/layout/BackToHomeLink';
import type { Metadata } from 'next';
import { ShieldCheck } from 'lucide-react';
import { EncoderDecoderTool } from '@/components/encoder-decoder/EncoderDecoderTool';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'Universal Encoder / Decoder & Encryption Suite',
  description:
    'Convert client-side using Base64, Hex, Binary, Base32, Base58, Base85, URL, HTML entities, Punycode, Quoted-Printable, UUEncode, Caesar, ROT13/47, Atbash, Vigenère, Affine, Rail Fence, Morse Code, Braille, AES, DES, 3DES, RC4, Blowfish, and Hashes with real-time Auto-Detection.',
  alternates: { canonical: '/encoder-decoder' },
};

export default function EncoderDecoderPage() {
  return (
    <div className="container py-6 md:py-8 max-w-5xl">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <BackToHomeLink />
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Encoder / Decoder & Encryption Suite</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Encode, decode, encrypt, and decrypt across dozens of data formats, ciphers, and symmetric algorithms with real-time format auto-detection, dynamic passphrase support, and multi-algorithm live comparison.
        </p>
      </div>

      <Separator className="mb-6" />

      {/* Main tool container */}
      <EncoderDecoderTool />
    </div>
  );
}
