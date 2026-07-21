'use client';

import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';
import { FloatingSupport } from './FloatingSupport';
import { StickyNotes } from './StickyNotes';
import { QuickAccess } from './QuickAccess';

// The Storage Vault keeps the site's nav, quick-access dock, and sticky notes —
// but not the marketing Footer or the support bubble, which don't fit its
// fixed-height app layout. The vault's own page fills the remaining space
// below the sticky Header via `flex-1` (the <body> is already a flex column).
export function ChromeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStorageVault = pathname?.startsWith('/storage') ?? false;

  if (isStorageVault) {
    // `<body>` is only `min-h-screen` (a floor, no ceiling) so normal marketing pages can
    // grow taller than the viewport and scroll — but that means `flex-1 min-h-0` below has
    // no actual height to shrink against, so the vault's content could grow past 100dvh and
    // the whole *window* would scroll instead of just this container's internal lists. That
    // dragged the sticky Header along with it, making it look like it was hiding as you
    // scrolled toward the vault's own top bar. Pin this subtree to exactly one viewport
    // height so Header + the vault split it and only the vault's internal areas ever scroll.
    return (
      <div className="h-dvh w-full flex flex-col overflow-hidden">
        <Header />
        <div className="flex-1 min-h-0 w-full overflow-hidden flex flex-col">{children}</div>
        <StickyNotes />
        <QuickAccess />
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 relative z-10 w-full overflow-x-hidden">{children}</main>
      <Footer />
      <FloatingSupport />
      <StickyNotes />
      <QuickAccess />
    </>
  );
}
