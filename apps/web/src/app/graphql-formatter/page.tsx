import { BackToHomeLink } from '@/components/layout/BackToHomeLink';
import type { Metadata } from 'next';
import { Share2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { GraphqlFormatterTool } from './Lazy';

export const metadata: Metadata = {
  title: 'GraphQL Formatter & Validator — Beautify Queries Online',
  description:
    'Format and validate GraphQL queries, mutations, and SDL schemas client-side. Pretty-print, minify, and check syntax errors with line/column detail.',
  alternates: { canonical: '/graphql-formatter' },
};

export default function GraphqlFormatterPage() {
  return (
    <div className="container py-6 md:py-8 max-w-5xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <BackToHomeLink />
          <Share2 className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">GraphQL Formatter & Validator</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Pretty-print or minify GraphQL queries, mutations, and schemas, and validate syntax (optionally against your own SDL schema).
        </p>
      </div>

      <Separator className="mb-6" />

      <GraphqlFormatterTool />
    </div>
  );
}
