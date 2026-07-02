import type { Metadata } from 'next';
import { JsonViewerPage } from '@/components/json/JsonViewerPage';

export const metadata: Metadata = {
  title: 'JSON Viewer & Formatter',
  description:
    'View, format, validate and explore JSON data. Syntax highlighting, tree view, CSV export, TypeScript generation and more. 100% client-side.',
  alternates: { canonical: '/json' },
};

export default function JsonPage() {
  return <JsonViewerPage />;
}
