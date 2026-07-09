import type { Metadata } from 'next';
import { Eye } from 'lucide-react';
import { HtmlPreviewTool } from '@/components/html-preview/HtmlPreviewTool';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'Real-Time HTML/CSS/JS Previewer — Online Sandbox Code Playground',
  description:
    'Test, write, and preview HTML structure, CSS layouts, and JavaScript scripts in real-time. Features clean visual execution, code console log capture, and templates.',
  alternates: { canonical: '/html-preview' },
};

export default function HtmlPreviewPage() {
  return (
    <div className="container py-6 md:py-8 max-w-6xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Eye className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">HTML / CSS / JS Previewer</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Write front-end code with live sandboxed previews in your browser. Render structures, inject stylesheets, inspect scripts, and display console logs.
        </p>
      </div>

      <Separator className="mb-6" />

      <HtmlPreviewTool />
    </div>
  );
}
