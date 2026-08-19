import { BackToHomeLink } from '@/components/layout/BackToHomeLink';
import type { Metadata } from 'next';
import { ArrowRightLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { FileConverterTool } from './Lazy';

export const metadata: Metadata = {
  title: 'File Converter — Documents, Images, Spreadsheets & PDFs',
  description:
    'Free file converter. Convert Word, PDF, Excel, RTF, EPUB, Images (JPG, PNG, WebP, SVG, HEIC), Markdown, CSV, JSON, and HTML locally with zero server uploads.',
  alternates: { canonical: '/file-converter' },
};

export default function FileConverterPage() {
  return (
    <div className="container py-6 md:py-8 max-w-6xl">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <BackToHomeLink />
          <ArrowRightLeft className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">File Converter</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Convert Word documents, PDFs, Excel sheets, images, and data structures 100% locally in your browser with complete privacy.
        </p>
      </div>

      <Separator className="mb-6" />

      {/* Main tool container */}
      <FileConverterTool />
    </div>
  );
}
