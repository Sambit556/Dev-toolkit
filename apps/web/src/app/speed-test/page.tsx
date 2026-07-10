import type { Metadata } from 'next';
import { Activity, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Separator } from '@/components/ui/separator';

const SpeedTestTool = dynamic(
  () => import('@/components/speed-test/SpeedTestTool').then((m) => m.SpeedTestTool),
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
  title: 'Internet Speed Tester',
  description:
    'Test your internet connection latency, jitter, download, and upload bandwidth in real-time. Features a high-fidelity animated speedometer dial telemetry dashboard.',
  alternates: { canonical: '/speed-test' },
};

export default function SpeedTestPage() {
  return (
    <div className="container py-6 md:py-8 max-w-5xl">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Internet Speed Tester</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Run real-time performance probes to measure download bandwidth, upload bandwidth, latency, and packet jitter.
        </p>
      </div>

      <Separator className="mb-6" />

      {/* Main tool container */}
      <SpeedTestTool />
    </div>
  );
}
