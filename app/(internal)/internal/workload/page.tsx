'use client';

import { useState, useEffect } from 'react';
import { TeamWorkloadChart } from '@/components/team-workload-chart';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { addMonths, subMonths, format } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// We need to define the type here as it's not directly importable from a client component
// This should match the TeamWorkloadData type from the API response
export type TeamWorkloadData = {
    id: string;
    name: string | null;
    email: string;
    dailyCapacityHours: { toNumber: () => number } | null;
    assignedTasks: {
        id: string;
        title: string;
        estimatedHours: { toNumber: () => number } | null;
        startDate: Date | null;
        dueDate: Date | null;
        project: {
            name: string;
        };
    }[];
}[];

export default function WorkloadPage() {
  const [data, setData] = useState<TeamWorkloadData>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'monthly' | 'weekly'>('monthly');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    async function fetchWorkloadData() {
      setIsLoading(true);
      setError(null);
      try {
        const monthParam = format(currentMonth, 'yyyy-MM-dd');
        const response = await fetch(`/api/workload?month=${monthParam}`);
        if (!response.ok) {
          throw new Error('Failed to fetch workload data');
        }
        const jsonData = await response.json();
        // Prisma Decimal is not native to JSON, so we need to handle it.
        // The chart component already does .toNumber(), so we can pass it as is.
        setData(jsonData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchWorkloadData();
  }, [currentMonth]);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Team Workload</h1>
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-semibold text-lg w-32 text-center">{format(currentMonth, 'MMMM yyyy')}</span>
                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
            <div className="flex items-center gap-2 rounded-md bg-muted p-1">
                <Button variant={view === 'monthly' ? 'default' : 'ghost'} size="sm" onClick={() => setView('monthly')}>Monthly</Button>
                <Button variant={view === 'weekly' ? 'default' : 'ghost'} size="sm" onClick={() => setView('weekly')}>Weekly</Button>
            </div>
        </div>
      </div>

      {error && <p className="text-red-500">Error: {error}</p>}
      
      {isLoading ? (
        <div className="border rounded-md p-4">
            <Skeleton className="h-[650px] w-full" />
        </div>
      ) : (
        <TeamWorkloadChart data={data} view={view} month={currentMonth} />
      )}
    </div>
  );
}
