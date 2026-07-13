import type { Metadata } from 'next';
import { Regex, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Separator } from '@/components/ui/separator';

const RegexTesterTool = dynamic(
  () => import('@/components/regex-tester/RegexTesterTool').then((m) => m.RegexTesterTool),
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
  title: 'Regex Tester — Build & Debug Regular Expressions Online',
  description:
    'Test regular expressions with live match highlighting, capture groups, replace preview, and a library of common patterns. Runs entirely client-side.',
  alternates: { canonical: '/regex-tester' },
};

export default function RegexTesterPage() {
  return (
    <div className="container py-6 md:py-8 max-w-5xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Regex className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Regex Tester & Builder</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Build and debug regular expressions with live match highlighting, capture group inspection, and a replace-mode preview — all client-side.
        </p>
      </div>

      <Separator className="mb-6" />

      <RegexTesterTool />
    </div>
  );
}
