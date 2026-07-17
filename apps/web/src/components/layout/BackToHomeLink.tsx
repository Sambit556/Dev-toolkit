import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

/**
 * Compact back-arrow affordance for a tool page's own header, next to its
 * title. Deliberately plain (native `title` attribute, no Radix Tooltip):
 * it's rendered from server-component page.tsx files across ~30 tool pages,
 * and Radix's portal-based Tooltip caused SSR/hydration mismatches there —
 * it only works cleanly inside an already-client-rendered tree (e.g. Header).
 */
export function BackToHomeLink() {
  return (
    <Link
      href="/"
      aria-label="Back to home"
      title="Back to home"
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
    </Link>
  );
}
