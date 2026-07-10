import type { Metadata } from 'next';
import { Sparkles, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Separator } from '@/components/ui/separator';

const ImageTool = dynamic(
  () => import('@/components/image-tool/ImageTool').then((m) => m.ImageTool),
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
  title: 'Image Compressor, Enhancer & Metadata Viewer',
  description:
    'Compress, resize, enhance images and view camera EXIF metadata client-side. Convert formats, adjust quality, extract dominant color palettes fully locally.',
  alternates: { canonical: '/image-tool' },
};

export default function ImagePage() {
  return (
    <div className="container py-6 md:py-8 max-w-5xl">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Image Compressor, Enhancer & Metadata Viewer</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Optimize, scale, extract dominant color palettes, and inspect JPEG camera EXIF tags fully client-side. 
          Modify quality factor, swap formats (JPEG, PNG, WebP), and apply enhancement filters locally without any server lag.
        </p>
      </div>

      <Separator className="mb-6" />

      {/* Main tool container */}
      <ImageTool />
    </div>
  );
}
