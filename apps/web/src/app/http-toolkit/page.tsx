import type { Metadata } from 'next';
import { Webhook, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Separator } from '@/components/ui/separator';

const HttpToolkitTool = dynamic(
  () => import('@/components/http-toolkit/HttpToolkitTool').then((m) => m.HttpToolkitTool),
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
          Look up HTTP status codes, inspect a URL's response headers, or spin up a live webhook capture URL to test incoming requests.
        </p>
      </div>

      <Separator className="mb-6" />

      <HttpToolkitTool />
    </div>
  );
}
