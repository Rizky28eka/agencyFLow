// components/tasks/TimerButton.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { startTimer, stopTimer, getActiveTimer } from '@/app/actions/time-entries';
import { formatDuration, intervalToDuration } from 'date-fns';

interface TimerButtonProps {
  taskId: string;
  projectId: string;
  userId: string;
  onTimerChange: () => void; // Callback to refresh task list or time entries
}

export function TimerButton({ taskId, projectId, userId, onTimerChange }: TimerButtonProps) {
  const [activeTimeEntry, setActiveTimeEntry] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState<string>('00:00:00');

  useEffect(() => {
    async function checkActiveTimer() {
      setIsLoading(true);
      try {
        const timer = await getActiveTimer(userId);
        setActiveTimeEntry(timer);
      } catch (error) {
        toast.error('Failed to fetch active timer.');
        console.error('Error fetching active timer:', error);
      } finally {
        setIsLoading(false);
      }
    }
    checkActiveTimer();

    let interval: NodeJS.Timeout;
    if (activeTimeEntry && activeTimeEntry.startTime) {
      interval = setInterval(() => {
        const duration = intervalToDuration({
          start: new Date(activeTimeEntry.startTime),
          end: new Date(),
        });
        setElapsedTime(formatDuration(duration, { format: ['hours', 'minutes', 'seconds'] }));
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [userId, activeTimeEntry?.startTime]); // Re-run when activeTimeEntry.startTime changes

  const handleStartTimer = async () => {
    setIsLoading(true);
    try {
      const newEntry = await startTimer(taskId, projectId, userId);
      setActiveTimeEntry(newEntry);
      toast.success('Timer started!');
      onTimerChange();
    } catch (error: any) {
      toast.error(error.message || 'Failed to start timer.');
      console.error('Error starting timer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopTimer = async () => {
    setIsLoading(true);
    try {
      if (activeTimeEntry) {
        await stopTimer(activeTimeEntry.id);
        setActiveTimeEntry(null);
        setElapsedTime('00:00:00');
        toast.success('Timer stopped!');
        onTimerChange();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to stop timer.');
      console.error('Error stopping timer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isCurrentTaskActive = activeTimeEntry && activeTimeEntry.taskId === taskId;

  if (isLoading) {
    return <Button disabled>Loading...</Button>;
  }

  return (
    <>
      {isCurrentTaskActive ? (
        <Button onClick={handleStopTimer} variant="destructive">
          Stop ({elapsedTime})
        </Button>
      ) : (
        <Button onClick={handleStartTimer} disabled={!!activeTimeEntry}>
          Start Timer
        </Button>
      )}
    </>
  );
}
