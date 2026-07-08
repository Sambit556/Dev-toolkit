import type { Metadata } from 'next';
import { Shield } from 'lucide-react';
import { JwtTool } from '@/components/jwt/JwtTool';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'JWT Decoder & Encoder',
  description:
    'Decode, verify, and generate JSON Web Tokens (JWT) client-side. Live signature verification with HMAC and RSA, interactive claims breakdowns, and templates.',
  alternates: { canonical: '/jwt' },
};

export default function JwtPage() {
  return (
    <div className="container py-6 md:py-8 max-w-5xl">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">JWT Decoder & Encoder</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Decode and verify JSON Web Tokens (JWT) or encode new ones. 
          All computations are executed locally in your browser — your tokens and keys are never sent to any server.
        </p>
      </div>

      <Separator className="mb-6" />

      {/* Main tool container */}
      <JwtTool />
    </div>
  );
}
