import type { Metadata } from 'next';
import { Palette } from 'lucide-react';
import { ColorTool } from '@/components/color/ColorTool';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'All Color Picker & WCAG Contrast Checker',
  description:
    'Pick and convert colors client-side. Live conversions between HEX, RGB, HSL, CMYK, and HSV, automatic color harmonies generation, and WCAG accessibility contrast ratio validation.',
  alternates: { canonical: '/color-picker' },
};

export default function ColorPage() {
  return (
    <div className="container py-6 md:py-8 max-w-5xl">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Palette className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">All Color Picker</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          A visual dashboard to convert color spaces (HEX, RGB, HSL, CMYK, HSV), construct matching color palettes/harmonies, 
          and check WCAG AA/AAA contrast ratio compliance for design accessibility.
        </p>
      </div>

      <Separator className="mb-6" />

      {/* Main tool container */}
      <ColorTool />
    </div>
  );
}
