import type { Metadata } from 'next';
import { Webhook } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { HttpToolkitTool } from './Lazy';

export const metadata: Metadata = {
  title: 'HTTP Toolkit — Status Codes, Header Inspector, Webhook Tester',
  description:
    'A searchable HTTP status code reference, a server-side header/response inspector, and a real webhook capture tool for testing incoming HTTP requests.',
  alternates: { canonical: '/http-toolkit' },
};

export default function HttpToolkitPage() {
  return (
    <div className="container py-6 md:py-8 max-w-5xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Webhook className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">HTTP Toolkit</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Look up HTTP status codes, inspect a URL&apos;s response headers, or spin up a live webhook capture URL to test incoming requests.
        </p>
      </div>

      <Separator className="mb-6" />

      <HttpToolkitTool />
    </div>
  );
}
