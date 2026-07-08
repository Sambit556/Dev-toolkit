import type { Metadata } from 'next';
import { HeartHandshake } from 'lucide-react';
import { SupportOptions } from '@/components/support/SupportOptions';

export const metadata: Metadata = {
  title: 'Support the Project',
  description:
    'Support DevToolkit development via PayPal or UPI. Your contribution helps keep this free, privacy-first developer toolkit running.',
  alternates: { canonical: '/support' },
};

export default function SupportPage() {
  return (
    <div className="container py-10 md:py-14 max-w-2xl">
      <div className="text-center mb-8">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <HeartHandshake className="h-6 w-6" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Support DevToolkit</h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          This toolkit is free, ad-free, and runs entirely in your browser. If it saves you time,
          consider chipping in to help keep it maintained and hosted.
        </p>
      </div>

      <SupportOptions />
    </div>
  );
}
