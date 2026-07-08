import type { Metadata } from 'next';
import { Globe } from 'lucide-react';
import { IpIntelTool } from '@/components/ip-intel/IpIntelTool';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'IP & Identity Intelligence Suite',
  description:
    'Auto-detect your IPv4/IPv6 details, lookup any IP address globally for geographical and ISP specs, and validate email addresses or phone numbers locally.',
  alternates: { canonical: '/ip-intel' },
};

export default function IpIntelPage() {
  return (
    <div className="container py-6 md:py-8 max-w-5xl">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Globe className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">IP & Identity Intelligence</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Instantly check connection details, query global geolocation directories, and validate email/phone identity formats securely in your browser.
        </p>
      </div>

      <Separator className="mb-6" />

      {/* Main tool container */}
      <IpIntelTool />
    </div>
  );
}
