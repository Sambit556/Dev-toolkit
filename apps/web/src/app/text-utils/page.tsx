import { BackToHomeLink } from '@/components/layout/BackToHomeLink';
import type { Metadata } from 'next';
import { Type } from 'lucide-react';
import { TextUtilsTool } from '@/components/text-utils/TextUtilsTool';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'Text & Case Utilities — Case Converter & Word Counter',
  description:
    'Convert text case (camelCase, PascalCase, snake_case, kebab-case) and count words, characters, sentences, and paragraphs in real-time.',
  alternates: { canonical: '/text-utils' },
};

export default function TextUtilsPage() {
  return (
    <div className="container py-6 md:py-8 max-w-5xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <BackToHomeLink />
          <Type className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Text & Case Utilities</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Convert string cases between camelCase, PascalCase, snake_case, kebab-case, and count characters, words, sentences, or analyze frequency dynamically.
        </p>
      </div>

      <Separator className="mb-6" />

      <TextUtilsTool />
    </div>
  );
}
