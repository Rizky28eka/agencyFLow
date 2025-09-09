// app/(internal)/internal/calendar/page.tsx
import { TeamCalendarView } from '@/components/team-calendar-view';

export default function CalendarPage() {
  return (
    <div className="container mx-auto p-4">
      <TeamCalendarView />
    </div>
  );
}
