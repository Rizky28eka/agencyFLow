import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';

interface TimeEntry {
  id: string;
  hours: number;
  date: string;
  description: string | null;
  user: {
    name: string | null;
    image: string | null;
  };
}

interface TimeEntryListProps {
  taskId: string;
  projectId: string;
}

export function TimeEntryList({ taskId, projectId }: TimeEntryListProps) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEntries() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}/time-entries`);
        if (!response.ok) {
          throw new Error('Failed to fetch time entries.');
        }
        const data = await response.json();
        setEntries(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchEntries();
  }, [taskId, projectId]);

  if (isLoading) {
    return (
        <div className="p-4 space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
        </div>
    );
  }

  if (error) {
    return <p className="text-red-500 text-sm p-4">Error: {error}</p>;
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 border-t">
      <h4 className="font-semibold text-sm mb-3">Time Log Details</h4>
      <div className="space-y-3">
        {entries.length > 0 ? (
          entries.map(entry => (
            <div key={entry.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={entry.user.image || undefined} />
                        <AvatarFallback>{entry.user.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <span>{entry.user.name}</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-muted-foreground italic">{entry.description || 'No description'}</span>
                    <span className="text-muted-foreground">{format(new Date(entry.date), 'PPP')}</span>
                    <span className="font-bold">{Number(entry.hours).toFixed(2)}h</span>
                </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No time entries logged for this task yet.</p>
        )}
      </div>
    </div>
  );
}
