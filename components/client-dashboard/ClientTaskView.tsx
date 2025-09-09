'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

// Simplified Task type for client view
interface ClientTask {
  id: string;
  title: string;
  status: string;
  dueDate: string | null;
}

interface ClientTaskViewProps {
  projectId: string;
}

export function ClientTaskView({ projectId }: ClientTaskViewProps) {
  const [tasks, setTasks] = useState<ClientTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;

    async function fetchClientTasks() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/projects/${projectId}/tasks`);
        if (!response.ok) {
          throw new Error('Could not fetch project tasks.');
        }
        const data = await response.json();
        setTasks(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchClientTasks();
  }, [projectId]);

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-1/3" />
            </CardHeader>
            <CardContent className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </CardContent>
        </Card>
    );
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <p className="font-medium">{task.title}</p>
                <div className="flex items-center gap-4">
                    {task.dueDate && (
                        <span className="text-sm text-muted-foreground">
                            Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}
                        </span>
                    )}
                    <Badge 
                        className={cn(
                            task.status === 'DONE' && 'bg-green-600',
                            task.status === 'IN_PROGRESS' && 'bg-blue-500',
                            task.status === 'IN_REVIEW' && 'bg-yellow-500',
                        )}
                    >
                        {task.status.replace('_', ' ')}
                    </Badge>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-4">No tasks to display for this project yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
