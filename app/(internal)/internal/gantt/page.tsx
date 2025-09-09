
'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Gantt from 'frappe-gantt';
import { getProjectViewData } from '@/app/actions/project-views';
import { ProjectViewData } from '@/types/db-models';
import { format } from 'date-fns';

export default function GanttChartPage() {
  const ganttRef = useRef<HTMLDivElement>(null);
  const [projectData, setProjectData] = useState<ProjectViewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch data for a specific project or all projects
        // For now, we'll fetch all projects and tasks for a dummy organizationId
        const data = await getProjectViewData('dummy-org-id'); // Replace with actual organizationId
        setProjectData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error('Error fetching project data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (ganttRef.current && projectData) {
      const tasks = projectData.projects.flatMap(project =>
        project.tasks.map(task => ({
          id: task.id,
          name: task.title,
          start: format(task.startDate || new Date(), 'yyyy-MM-dd'),
          end: format(task.dueDate || new Date(), 'yyyy-MM-dd'),
          progress: 0, // You might calculate this based on subtasks or time spent
          dependencies: '', // Implement if you have task dependencies
          custom_class: task.status === 'DONE' ? 'bar-milestone' : '', // Example styling
        }))
      );

      new Gantt(ganttRef.current, tasks, {
        on_date_change: function (task, start, end) {
          console.log(`${task.name}: Date changed to ${start} - ${end}`);
          // Call updateTask API here
        },
        on_progress_change: function (task, progress) {
          console.log(`${task.name}: Progress changed to ${progress}`);
          // Call updateTask API here
        },
        on_view_change: function (mode) {
          console.log(`View changed to ${mode}`);
        },
      });
    }
  }, [projectData]);

  if (isLoading) {
    return <p>Loading Gantt Chart...</p>;
  }

  if (error) {
    return <p className="text-red-500">Error: {error}</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Gantt Chart</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={ganttRef}></div>
      </CardContent>
    </Card>
  );
}
