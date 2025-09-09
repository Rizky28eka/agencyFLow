"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getProjectViewData } from "@/app/actions/project-views";
import { Project, Task } from "@prisma/client";
import { format, isSameDay, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface ProjectCalendarViewProps {
  projectId: string;
}

export function ProjectCalendarView({ projectId }: ProjectCalendarViewProps) {
  const [projectData, setProjectData] = useState<{
    project: Project;
    tasks: Task[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getProjectViewData(projectId);
        setProjectData(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        console.error("Error fetching project calendar data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [projectId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (!projectData) {
    return (
      <p className="text-center text-muted-foreground py-4">
        No project data found for calendar view.
      </p>
    );
  }

  const { project, tasks } = projectData;

  const today = new Date();
  const daysInMonth = Array.from(
    { length: 31 },
    (_, i) => new Date(today.getFullYear(), today.getMonth(), i + 1)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Calendar: {project.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2 text-center font-bold mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {daysInMonth.map((day) => (
            <div
              key={format(day, "yyyy-MM-dd")}
              className="border p-2 h-24 flex flex-col items-center"
            >
              <span className="text-sm font-semibold">{format(day, "d")}</span>
              {/* Project dates */}
              {project.startDate &&
                isSameDay(parseISO(project.startDate.toISOString()), day) && (
                  <Badge className="mt-1 bg-blue-500">Project Start</Badge>
                )}
              {project.endDate &&
                isSameDay(parseISO(project.endDate.toISOString()), day) && (
                  <Badge className="mt-1 bg-blue-500">Project End</Badge>
                )}
              {/* Task due dates */}
              {tasks.map(
                (task) =>
                  task.dueDate &&
                  isSameDay(parseISO(task.dueDate.toISOString()), day) && (
                    <Badge key={task.id} className="mt-1 bg-green-500">
                      Task: {task.title}
                    </Badge>
                  )
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
