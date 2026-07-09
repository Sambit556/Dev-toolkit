import type { Metadata } from 'next';
import { Gamepad2 } from 'lucide-react';
import { FunTools } from '@/components/fun-tools/FunTools';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'Fun Developer Utilities — Coin Flip, Dice Roll, Spinning Name Wheel',
  description:
    'Play coin flips (3D), roll multiple dice (3D), spin a custom fortune name wheel, pick random items, and split teams client-side.',
  alternates: { canonical: '/fun-tools' },
};

export default function FunToolsPage() {
  return (
    <div className="container py-6 md:py-8 max-w-5xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Gamepad2 className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Fun & Random Utilities</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Run quick random selections, simulate 3D dice rolls and coin flips, spin customizable slice name wheels, or organize participants into randomized teams.
        </p>
      </div>

      <Separator className="mb-6" />

      <FunTools />
    </div>
  );
}
