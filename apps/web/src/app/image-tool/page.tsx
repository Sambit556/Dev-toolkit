import type { Metadata } from 'next';
import { Sparkles } from 'lucide-react';
import { ImageTool } from '@/components/image-tool/ImageTool';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'Image Compression & Enhancer',
  description:
    'Compress, resize, and enhance images client-side. Convert format, adjust compression quality, apply brightness/contrast/saturation filters fully locally.',
  alternates: { canonical: '/image-tool' },
};

export default function ImagePage() {
  return (
    <div className="container py-6 md:py-8 max-w-5xl">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Image Compression & Enhancer</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Optimize, scale, and adjust your images fully client-side. 
          Modify quality, swap formats (JPEG, PNG, WebP), and apply color filters locally without any server lag.
        </p>
      </div>

      <Separator className="mb-6" />

      {/* Main tool container */}
      <ImageTool />
    </div>
  );
}
