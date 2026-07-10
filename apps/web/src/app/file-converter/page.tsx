import type { Metadata } from 'next';
import { ArrowRightLeft, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Separator } from '@/components/ui/separator';

const FileConverterTool = dynamic(
  () => import('@/components/file-converter/FileConverterTool').then((m) => m.FileConverterTool),
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
  title: 'Client-Side File Converter',
  description:
    'Convert CSV files to JSON arrays, JSON lists to CSV spreadsheets, Markdown files to styled HTML webpages, and images between PNG, JPEG, and WebP formats. Securely runs client-side.',
  alternates: { canonical: '/file-converter' },
};

export default function FileConverterPage() {
  return (
    <div className="container py-6 md:py-8 max-w-5xl">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <ArrowRightLeft className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Client-Side File Converter</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          A secure client-side utility to convert structured data sheets, rich text documents, and images without uploading any files to external servers.
        </p>
      </div>

      <Separator className="mb-6" />

      {/* Main tool container */}
      <FileConverterTool />
    </div>
  );
}
