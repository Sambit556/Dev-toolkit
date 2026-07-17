import { BackToHomeLink } from '@/components/layout/BackToHomeLink';
import type { Metadata } from 'next';
import { CalendarRange } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { CalendarTool } from './Lazy';

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
          <BackToHomeLink />
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
