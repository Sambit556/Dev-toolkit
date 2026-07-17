import { BackToHomeLink } from '@/components/layout/BackToHomeLink';
import type { Metadata } from 'next';
import { Regex } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { RegexTesterTool } from './Lazy';

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
          <BackToHomeLink />
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
