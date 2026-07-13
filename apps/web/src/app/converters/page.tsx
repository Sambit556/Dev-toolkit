import type { Metadata } from 'next';
import { RefreshCw } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ConvertersTool } from './Lazy';

export const metadata: Metadata = {
  title: 'Conversions — CSV, XML, JSON, Markdown, HTML, PDF',
  description:
    'Convert schemas and text formats client-side. Convert CSV to JSON, XML to JSON, Markdown to HTML rendering, or export custom text to formatted PDF files.',
  alternates: { canonical: '/converters' },
};

export default function ConvertersPage() {
  return (
    <div className="container py-6 md:py-8 max-w-5xl">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <RefreshCw className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Data Converters</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          A collection of format converters to translate CSV grids, XML nodes, Markdown documents, 
          and compile customized text documents into formatted PDFs locally.
        </p>
      </div>

      <Separator className="mb-6" />

      {/* Main tool container */}
      <ConvertersTool />
    </div>
  );
}
