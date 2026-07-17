import { BackToHomeLink } from '@/components/layout/BackToHomeLink';
import type { Metadata } from 'next';
import { Type } from 'lucide-react';
import { LoremIpsumTool } from '@/components/lorem-ipsum/LoremIpsumTool';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'Lorem Ipsum Generator — Online Placeholder Text Builder',
  description:
    'Generate custom dummy Lorem Ipsum placeholder text (paragraphs, sentences, words, lists) for website designs, programming, and layout testing.',
  alternates: { canonical: '/lorem-ipsum' },
};

export default function LoremIpsumPage() {
  return (
    <div className="container py-6 md:py-8 max-w-5xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <BackToHomeLink />
          <Type className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Lorem Ipsum Generator</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Create dummy text layouts with paragraphs, sentences, or word counts. Choose formats, customize templates, and download or copy generated text.
        </p>
      </div>

      <Separator className="mb-6" />

      <LoremIpsumTool />
    </div>
  );
}
