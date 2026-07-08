import type { Metadata } from 'next';
import { Ruler } from 'lucide-react';
import { UnitTool } from '@/components/unit/UnitTool';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'All Unit Converter',
  description:
    'Convert measurements client-side. Live conversions for length, mass/weight, area, volume, temperature, speed, duration, digital storage, energy, and pressure.',
  alternates: { canonical: '/unit-converter' },
};

export default function UnitPage() {
  return (
    <div className="container py-6 md:py-8 max-w-5xl">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Ruler className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">All Unit Converter</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Convert across 10 measurement categories including length, mass, digital storage, and temperature. 
          Instantly compare values across all units in a category simultaneously.
        </p>
      </div>

      <Separator className="mb-6" />

      {/* Main tool container */}
      <UnitTool />
    </div>
  );
}
