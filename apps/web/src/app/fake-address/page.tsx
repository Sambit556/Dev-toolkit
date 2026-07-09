import type { Metadata } from 'next';
import { MapPin } from 'lucide-react';
import { FakeAddressTool } from '@/components/fake-address/FakeAddressTool';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'Fake Address & Persona Generator — Online Test Data Generator',
  description:
    'Generate realistic fake addresses, names, phone numbers, postal codes, and credit cards for testing purposes across multiple countries like US, UK, India, and Canada.',
  alternates: { canonical: '/fake-address' },
};

export default function FakeAddressPage() {
  return (
    <div className="container py-6 md:py-8 max-w-5xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Fake Address & Persona Generator</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Generate random, mock address records and developer testing personas. Select locations, configure options, and download mock datasets instantly.
        </p>
      </div>

      <Separator className="mb-6" />

      <FakeAddressTool />
    </div>
  );
}
