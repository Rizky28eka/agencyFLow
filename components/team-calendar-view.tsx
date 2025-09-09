// components/team-calendar-view.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getCalendarEvents } from '@/app/actions/project-views';
import { Project, Task } from '@prisma/client';
import {
  format,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  isSameDay,
  isWithinInterval,
  parseISO,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  type: 'task' | 'project';
  status?: string; // For tasks
  priority?: string; // For tasks
  assigneeName?: string | null; // For tasks
  projectName?: string; // For tasks and projects
}

export function TeamCalendarView() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        const { projects, tasks } = await getCalendarEvents(start, end);

        const formattedEvents: CalendarEvent[] = [];

        projects.forEach((project) => {
          if (project.startDate && project.endDate) {
            formattedEvents.push({
              id: project.id,
              title: project.name,
              startDate: parseISO(project.startDate.toISOString()),
              endDate: parseISO(project.endDate.toISOString()),
              type: 'project',
              projectName: project.name,
            });
          }
        });

        tasks.forEach((task) => {
          if (task.startDate && task.dueDate) {
            formattedEvents.push({
              id: task.id,
              title: task.title,
              startDate: parseISO(task.startDate.toISOString()),
              endDate: parseISO(task.dueDate.toISOString()),
              type: 'task',
              status: task.status,
              priority: task.priority,
              assigneeName: task.assignee?.name,
              projectName: task.project?.name,
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
  }, [currentMonth]);

  const daysInMonth = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth)),
  });

  const getEventsForDay = (day: Date) => {
    return events.filter(event =>
      isWithinInterval(day, { start: event.startDate, end: event.endDate }) ||
      isSameDay(day, event.startDate) ||
      isSameDay(day, event.endDate)
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Team Calendar</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold text-lg w-32 text-center">{format(currentMonth, 'MMMM yyyy')}</span>
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[600px] w-full" />
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-2 text-center font-bold mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {daysInMonth.map((day) => (
                <div
                  key={format(day, 'yyyy-MM-dd')}
                  className="border p-2 h-32 flex flex-col items-center overflow-y-auto"
                >
                  <span className="text-sm font-semibold">{format(day, 'd')}</span>
                  {getEventsForDay(day).map((event) => (
                    <Badge
                      key={event.id}
                      className={`mt-1 ${event.type === 'project' ? 'bg-blue-500' : 'bg-green-500'}`}
                    >
                      {event.type === 'task' ? `Task: ${event.title}` : `Project: ${event.title}`}
                    </Badge>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
