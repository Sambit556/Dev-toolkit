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
  const isCloudIde = (pathname?.startsWith('/code-studio') || pathname?.startsWith('/cloud-ide')) ?? false;
  const isStorageVault = pathname?.startsWith('/storage') ?? false;

  if (isCloudIde) {
    return (
      <div className="h-dvh w-screen flex flex-col overflow-hidden bg-black">
        <div className="flex-1 min-h-0 w-full overflow-hidden flex flex-col">{children}</div>
      </div>
    );
  }

  if (isStorageVault) {
    return (
      <div className="h-dvh w-full flex flex-col overflow-hidden bg-black">
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
