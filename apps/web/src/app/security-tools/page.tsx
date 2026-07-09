import type { Metadata } from 'next';
import { Shield } from 'lucide-react';
import { SecurityTools } from '@/components/security-tools/SecurityTools';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'Security & Cryptography Suite — Password, HMAC & BCrypt Generator',
  description:
    'Generate secure cryptographic passwords and tokens, check password strength entropy, compute HMAC hashes (SHA-256/SHA-512), and generate BCrypt salts/hashes client-side.',
  alternates: { canonical: '/security-tools' },
};

export default function SecurityToolsPage() {
  return (
    <div className="container py-6 md:py-8 max-w-5xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Security & Cryptography Suite</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Generate secure tokens and passwords, analyze password entropy, calculate HMAC digital signatures, and hash/verify passwords with BCrypt.
        </p>
      </div>

      <Separator className="mb-6" />

      <SecurityTools />
    </div>
  );
}
