import { useState, useCallback } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AddTaskDialog } from './AddTaskDialog';
import { EditTaskDialog } from './EditTaskDialog';
import { LogTimeDialog } from './LogTimeDialog';
import { TimeEntryList } from './TimeEntryList';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner";
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define the Task type based on our Prisma schema
export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  totalHoursLogged: number;
  assignee: {
    name: string | null;
    image: string | null;
  } | null;
}

interface TaskListProps {
  projectId: string;
  tasks: Task[];
  isLoading: boolean;
  onUpdate: () => void; // Callback to tell the parent to refetch
}

export function TaskList({ projectId, tasks, isLoading, onUpdate }: TaskListProps) {
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [logTimeTask, setLogTimeTask] = useState<Task | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/tasks/${taskToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      toast.success(`Task "${taskToDelete.title}" has been deleted.`);
      onUpdate(); // Tell parent to refetch
      setTaskToDelete(null); // Close the dialog
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      toast.error(errorMessage);
    }
  };

  const handleToggleExpand = (taskId: string) => {
    setExpandedTaskId(prevId => prevId === taskId ? null : taskId);
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/4" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
           <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Dialogs */}
      <AddTaskDialog
        projectId={projectId}
        open={isAddTaskOpen}
        onOpenChange={setIsAddTaskOpen}
        onTaskCreated={onUpdate}
      />
      <EditTaskDialog
        task={taskToEdit}
        projectId={projectId}
        open={!!taskToEdit}
        onOpenChange={() => setTaskToEdit(null)}
        onTaskUpdated={onUpdate}
      />
      {logTimeTask && (
        <LogTimeDialog
          taskId={logTimeTask.id}
          projectId={projectId}
          open={!!logTimeTask}
          onOpenChange={() => setLogTimeTask(null)}
          onTimeLogged={onUpdate}
        />
      )}
      <AlertDialog open={!!taskToDelete} onOpenChange={() => setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task
              <span className="font-semibold"> {taskToDelete?.title}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask} className={buttonVariants({ variant: "destructive" })}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Task List Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tasks</CardTitle>
          <Button onClick={() => setIsAddTaskOpen(true)}>Add Task</Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <div key={task.id} className="border rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <Button size="icon" variant="ghost" onClick={() => handleToggleExpand(task.id)}>
                        <ChevronDown className={cn("h-4 w-4 transition-transform", expandedTaskId === task.id && "rotate-180")} />
                      </Button>
                      <div>
                        <p className="font-semibold">{task.title}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-500">{task.status} - {task.priority}</p>
                          <Badge variant="secondary">{task.totalHoursLogged.toFixed(2)}h logged</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-2">
                          <p className="text-sm">{task.assignee?.name || 'Unassigned'}</p>
                          {task.assignee?.image ? (
                            <img src={task.assignee.image} alt={task.assignee.name || ''} className="h-8 w-8 rounded-full" />
                          ) : (
                             <div className="h-8 w-8 rounded-full bg-gray-200" />
                          )}
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setLogTimeTask(task)}>Log Time</Button>
                        <Button variant="outline" size="sm" onClick={() => setTaskToEdit(task)}>Edit</Button>
                        <Button variant="destructive" size="sm" onClick={() => setTaskToDelete(task)}>Delete</Button>
                     </div>
                  </div>
                  {expandedTaskId === task.id && <TimeEntryList taskId={task.id} projectId={projectId} />}
                </div>
              ))
            ) : (
              <p className="p-4 text-center text-muted-foreground">No tasks found for this project.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
