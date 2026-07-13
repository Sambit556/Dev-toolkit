import type { Metadata } from 'next';
import { FileText } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { PdfTools } from './Lazy';

export const metadata: Metadata = {
  title: 'Client-Side PDF Utilities — Merge, Split, and Protect PDFs',
  description:
    'Merge multiple PDF documents, split pages, and encrypt (protect) PDF files with passwords client-side. Your files never upload to any server.',
  alternates: { canonical: '/pdf-tools' },
};

export default function PdfToolsPage() {
  return (
    <div className="container py-6 md:py-8 max-w-5xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">PDF Utilities</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Perform PDF operations safely and fully inside your browser. Your files are processed client-side and never sent to a server.
        </p>
      </div>

      <Separator className="mb-6" />

      <PdfTools />
    </div>
  );
}
