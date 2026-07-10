import type { Metadata } from 'next';
import { GitCompare, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Separator } from '@/components/ui/separator';

const DiffCheckerTool = dynamic(
  () => import('@/components/diff-checker/DiffCheckerTool').then((m) => m.DiffCheckerTool),
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
  title: 'JSON & Code Diff Checker — Compare Text Online',
  description:
    'Compare code, text, or JSON side-by-side or in unified layout in real-time. Highlights additions, deletions, and differences client-side.',
  alternates: { canonical: '/diff-checker' },
};

export default function DiffPage() {
  return (
    <div className="container py-6 md:py-8 max-w-5xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <GitCompare className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Code & Text Diff Checker</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Compare two text blocks, JSON documents, or source code files side-by-side. Highlight deletions, modifications, and insertions securely.
        </p>
      </div>

      <Separator className="mb-6" />

      <DiffCheckerTool />
    </div>
  );
}
