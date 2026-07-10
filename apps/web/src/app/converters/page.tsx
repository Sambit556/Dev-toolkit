import type { Metadata } from 'next';
import { RefreshCw, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Separator } from '@/components/ui/separator';

const ConvertersTool = dynamic(
  () => import('@/components/converters/ConvertersTool').then((m) => m.ConvertersTool),
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
          <h1 className="text-2xl font-bold">Data & Document Converters</h1>
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
