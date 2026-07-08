import type { Metadata } from 'next';
import { Layers } from 'lucide-react';
import { YamlJsonTool } from '@/components/yaml-json/YamlJsonTool';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'YAML ↔ JSON Converter',
  description:
    'Convert YAML config data to JSON objects and vice versa client-side. Live validation, syntax highlighting editors, and indentation configuration.',
  alternates: { canonical: '/yaml-json' },
};

export default function YamlJsonPage() {
  return (
    <div className="container py-6 md:py-8 max-w-5xl">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Layers className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">YAML ↔ JSON Converter</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          A side-by-side Monaco editor to translate YAML schemas to JSON records or vice versa in real time. 
          Configurable key sorting, indentation sizes, and error flags.
        </p>
      </div>

      <Separator className="mb-6" />

      {/* Main tool container */}
      <YamlJsonTool />
    </div>
  );
}
