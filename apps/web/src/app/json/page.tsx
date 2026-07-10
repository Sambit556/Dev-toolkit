import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const JsonViewerPage = dynamic(
  () => import('@/components/json/JsonViewerPage').then((m) => m.JsonViewerPage),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen items-center justify-center bg-muted/20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

export const metadata: Metadata = {
  title: 'JSON Viewer & Formatter',
  description:
    'View, format, validate and explore JSON data. Syntax highlighting, tree view, CSV export, TypeScript generation and more. 100% client-side.',
  alternates: { canonical: '/json' },
};

export default function JsonPage() {
  return <JsonViewerPage />;
}
