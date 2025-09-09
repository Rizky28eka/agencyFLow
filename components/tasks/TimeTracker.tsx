
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Timer, Play, Square } from 'lucide-react';
import { addTimeEntry } from '@/app/actions/time-entries';

interface TimeTrackerProps {
  taskId: string;
  projectId: string;
}

export function TimeTracker({ taskId, projectId }: TimeTrackerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((new Date().getTime() - (startTime?.getTime() ?? 0)) / 1000));
      }, 1000);
    } else if (!isRunning && elapsedTime > 0) {
      // Timer stopped, log the time
      addTimeEntry({
        taskId,
        projectId,
        startAt: startTime!,
        endAt: new Date(),
        seconds: elapsedTime,
        description: 'Tracked time',
      });
      setElapsedTime(0);
    }
    return () => clearInterval(interval);
  }, [isRunning, elapsedTime, startTime, taskId, projectId]);

  const handleStartStop = () => {
    if (isRunning) {
      setIsRunning(false);
    } else {
      setStartTime(new Date());
      setIsRunning(true);
    }
  };

  const formatTime = (timeInSeconds: number) => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = timeInSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <Timer className="h-6 w-6" />
          <span className="text-lg font-mono">{formatTime(elapsedTime)}</span>
        </div>
        <Button onClick={handleStartStop} variant={isRunning ? 'destructive' : 'default'}>
          {isRunning ? <Square className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
          {isRunning ? 'Stop' : 'Start'}
        </Button>
      </CardContent>
    </Card>
  );
}
