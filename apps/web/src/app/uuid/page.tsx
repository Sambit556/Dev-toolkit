import type { Metadata } from 'next';
import { Fingerprint } from 'lucide-react';
import { UuidTool } from '@/components/uuid/UuidTool';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'UUID & ULID Generator',
  description:
    'Generate secure, cryptographically random UUID v4, UUID v1, ULID, and NanoID values. Batch generation, formatting configuration, and UUID v1 timestamp decoding.',
  alternates: { canonical: '/uuid' },
};

export default function UuidPage() {
  return (
    <div className="container py-6 md:py-8 max-w-5xl">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Fingerprint className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">UUID & ULID Generator</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Generate UUID (v4, v1, v5), ULID, and NanoID tokens securely in your browser. 
          Analyze and decode timestamps and nodes from UUID v1 identifiers instantly.
        </p>
      </div>

      <Separator className="mb-6" />

      {/* Main tool container */}
      <UuidTool />
    </div>
  );
}
