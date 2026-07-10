import type { Metadata } from 'next';
import { CalendarRange, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Separator } from '@/components/ui/separator';

const CalendarTool = dynamic(
  () => import('@/components/calendar/CalendarTool').then((m) => m.CalendarTool),
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
  title: 'Calendar Planner & Event Scheduler — Online Developer Tool',
  description:
    'Organize your dates, schedule custom tasks, color-code meetings/deadlines, and export events as .ics files locally. Fully private and offline-compatible.',
  alternates: { canonical: '/calendar' },
};

export default function CalendarPage() {
  return (
    <div className="container py-6 md:py-8 max-w-5xl">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <CalendarRange className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Calendar Planner & Scheduler</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Plan tasks, events, and meetings. Add color tags, view interactive grids, track upcoming deadlines, and export your schedules to Google Calendar or Outlook fully locally.
        </p>
      </div>

      <Separator className="mb-6" />

      <CalendarTool />
    </div>
  );
}
