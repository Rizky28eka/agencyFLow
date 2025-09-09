'use client';

import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCalendarEvents } from '@/app/actions/project-views';

import { enUS } from 'date-fns/locale';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { 'en-US': enUS },
});

const DnDCalendar = withDragAndDrop(Calendar);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: any;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const start = new Date(new Date().getFullYear(), 0, 1); // Start of current year
        const end = new Date(new Date().getFullYear(), 11, 31); // End of current year
        const { projects, tasks } = await getCalendarEvents(start, end);

        const formattedEvents: CalendarEvent[] = [];

        projects.forEach((project) => {
          if (project.startDate && project.endDate) {
            formattedEvents.push({
              id: project.id,
              title: `Project: ${project.name}`,
              start: project.startDate,
              end: project.endDate,
              allDay: true,
            });
          }
        });

        tasks.forEach((task) => {
          if (task.startDate && task.dueDate) {
            formattedEvents.push({
              id: task.id,
              title: `Task: ${task.title}`,
              start: task.startDate,
              end: task.dueDate,
              allDay: true,
            });
          }
        });

        setEvents(formattedEvents);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error('Error fetching calendar events:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const onEventDrop = ({ event, start, end, allDay }: any) => {
    // Update event in backend
    console.log('Event dropped:', event, start, end, allDay);
  };

  const onEventResize = ({ event, start, end, allDay }: any) => {
    // Update event in backend
    console.log('Event resized:', event, start, end, allDay);
  };

  if (isLoading) {
    return <p>Loading Calendar...</p>;
  }

  if (error) {
    return <p className="text-red-500">Error: {error}</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Calendar</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: 700 }}>
          <DnDCalendar
            localizer={localizer}
            events={events}
            onEventDrop={onEventDrop}
            onEventResize={onEventResize}
            resizable
            selectable
            defaultView="month"
            defaultDate={new Date()}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
          />
        </div>
      </CardContent>
    </Card>
  );
}