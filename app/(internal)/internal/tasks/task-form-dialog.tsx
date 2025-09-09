"use client"

import * as React from "react"
import { IconDots, IconEdit, IconTrash } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IconCalendar as IconCalendarTabler } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { toast } from "sonner"
import { addTask, updateTask, deleteTask, addTaskDependency, removeTaskDependency, getProjectTasksForDependencies } from "./actions"
import { User, TaskWithRelations } from "./actions" // Import TaskWithRelations
import { TimeEntryList } from '@/components/tasks/TimeEntryList'; // Import TimeEntryList

enum TaskStatus {
  TO_DO = "TO_DO",
  IN_PROGRESS = "IN_PROGRESS",
  IN_REVIEW = "IN_REVIEW",
  DONE = "DONE",
}

enum Priority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

const statuses = Object.values(TaskStatus).map(status => ({ value: status, label: status.replace("_", " ") }))
const priorities = Object.values(Priority)

const UNASSIGNED_VALUE = "UNASSIGNED";

type TaskFormDialogProps = {
  projectId: string;
  task?: TaskWithRelations; // Use TaskWithRelations
  trigger?: React.ReactElement;
  onSuccess?: () => void;
  users: User[];
};

export function TaskFormDialog({ projectId, task, trigger, onSuccess, users }: TaskFormDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const [dateOpen, setDateOpen] = React.useState(false);
  const [availableDependencies, setAvailableDependencies] = React.useState<{ id: string; title: string }[]>([]);
  const [selectedDependencies, setSelectedDependencies] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (open) {
      // Fetch available tasks for dependencies
      startTransition(async () => {
        const tasks = await getProjectTasksForDependencies(projectId, task?.id);
        setAvailableDependencies(tasks);
      });

      // Set initial selected dependencies if editing a task
      if (task?.dependenciesOn) {
        setSelectedDependencies(task.dependenciesOn.map(dep => dep.dependsOnId));
      } else {
        setSelectedDependencies([]);
      }
    }
  }, [open, projectId, task?.id, task?.dependenciesOn]);

  const [form, setForm] = React.useState({
    title: task?.title || "",
    description: task?.description || "",
    status: task?.status || TaskStatus.TO_DO,
    priority: task?.priority || Priority.MEDIUM,
    dueDate: task?.dueDate ? new Date(task.dueDate) : undefined,
    startDate: task?.startDate ? new Date(task.startDate) : undefined, // Add startDate
    estimatedHours: task?.estimatedHours?.toString() || "", // Add estimatedHours
    assigneeId: task?.assigneeId || UNASSIGNED_VALUE, // Default to UNASSIGNED_VALUE
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setForm({ ...form, [id]: value });
  };

  const handleNumberChange = (id: string, value: string) => {
    setForm({ ...form, [id]: value });
  };

  const handleSelectChange = (id: string, value: string) => {
    setForm({ ...form, [id]: value });
  }

  const handleDateChange = (date: Date | undefined) => {
    setForm({ ...form, dueDate: date });
  };

  // Move handleSubmit logic here to be within the component scope
  async function handleSubmit() {
    startTransition(async () => {
      const dataToSubmit = {
        ...form,
        assigneeId: form.assigneeId === UNASSIGNED_VALUE ? null : form.assigneeId,
        dueDate: form.dueDate || null,
        startDate: form.startDate || null, // Pass startDate
        estimatedHours: form.estimatedHours ? parseFloat(form.estimatedHours) : null, // Convert to number
      };

      try {
        let currentTaskId: string;

        if (task) {
          // Update existing task
          await updateTask(task.id, projectId, dataToSubmit);
          currentTaskId = task.id;
        } else {
          // Add new task
          const newTask = await addTask({ ...dataToSubmit, projectId });
          currentTaskId = newTask.id; // Assuming addTask returns the new task with an ID
        }

        // Handle dependencies
        const existingDependencyIds = task?.dependenciesOn?.map(dep => dep.dependsOnId) || [];

        const dependenciesToAdd = selectedDependencies.filter(
          (depId) => !existingDependencyIds.includes(depId)
        );
        const dependenciesToRemove = existingDependencyIds.filter(
          (depId) => !selectedDependencies.includes(depId)
        );

        for (const depId of dependenciesToAdd) {
          await addTaskDependency(currentTaskId, depId);
        }

        for (const depId of dependenciesToRemove) {
          await removeTaskDependency(currentTaskId, depId);
        }

        setOpen(false);
        toast.success(task ? "Task updated" : "Task added");
        onSuccess?.();
      } catch (error: unknown) { // Changed from any to unknown
        toast.error(error instanceof Error ? error.message : "An unknown error occurred.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : <DialogTrigger asChild><Button>Add Task</Button></DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Add Task"}</DialogTitle>
          <DialogDescription>
            {task ? "Update the task details." : "Add a new task to this project."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={form.title} onChange={handleChange} placeholder="e.g. Design the homepage" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="estimatedHours">Estimated Hours</Label>
            <Input id="estimatedHours" type="number" value={form.estimatedHours} onChange={(e) => handleNumberChange("estimatedHours", e.target.value)} placeholder="e.g. 8" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={form.description || ''} onChange={handleChange} placeholder="e.g. Create a high-fidelity mockup..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={form.status} onValueChange={(value) => handleSelectChange("status", value)}>
                <SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={form.priority} onValueChange={(value) => handleSelectChange("priority", value)}>
                <SelectTrigger><SelectValue placeholder="Select a priority" /></SelectTrigger>
                <SelectContent>
                  {priorities.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="assigneeId">Assignee</Label>
            <Select value={form.assigneeId} onValueChange={(value) => handleSelectChange("assigneeId", value)}>
              <SelectTrigger><SelectValue placeholder="Select an assignee" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED_VALUE}>Unassigned</SelectItem> {/* Option for unassigned */}
                {users.map((user) => <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !form.dueDate && "text-muted-foreground")}>
                  <IconCalendarTabler className="mr-2 h-4 w-4" />
                  {form.dueDate ? format(form.dueDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={form.dueDate}
                  onSelect={(d) => {
                    handleDateChange(d);
                    setDateOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dependencies">Dependencies</Label>
            <Select
              value={selectedDependencies.length > 0 ? selectedDependencies[0] : ""} // Display first selected or empty
              onValueChange={(value) => {
                // Toggle selection for multi-select like behavior
                setSelectedDependencies(prev =>
                  prev.includes(value)
                    ? prev.filter(id => id !== value)
                    : [...prev, value]
                );
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select dependencies">
                  {selectedDependencies.length > 0
                    ? selectedDependencies.map(id => availableDependencies.find(dep => dep.id === id)?.title || '').join(', ')
                    : "Select dependencies"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {availableDependencies.map((dep) => (
                  <SelectItem key={dep.id} value={dep.id}>
                    {dep.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedDependencies.map(id => {
                const depTask = availableDependencies.find(dep => dep.id === id);
                return depTask ? (
                  <span key={id} className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                    {depTask.title}
                    <button
                      type="button"
                      onClick={() => setSelectedDependencies(prev => prev.filter(depId => depId !== id))}
                      className="ml-1 -mr-0.5 h-3.5 w-3.5 rounded-full inline-flex items-center justify-center text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      <span className="sr-only">Remove</span>
                      <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                        <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                      </svg>
                    </button>
                  </span>
                ) : null;
              })}
            </div>
          </div>
        </div>
        {task?.id && ( // Only show time entries if task exists
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Time Entries</h3>
            <TimeEntryList taskId={task.id} projectId={projectId} />
          </div>
        )}
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Saving..." : (task ? "Update Task" : "Add Task")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  

  
}

type TaskActionsProps = {
    task: TaskWithRelations;
    projectId: string;
    onSuccess?: () => void;
    users: User[]; // Add users prop
}



export function TaskActions({ task, projectId, onSuccess, users }: TaskActionsProps) {
    const [, startTransition] = React.useTransition();

    const handleDelete = () => {
        startTransition(() => {
            deleteTask(task.id, projectId)
                .then(() => {
                    toast.success("Task deleted");
                    onSuccess?.();
                })
                .catch((error: unknown) => { // Changed from any to unknown
                    toast.error(error instanceof Error ? error.message : "An unknown error occurred.");
                });
        });
    };

    return (
        <AlertDialog>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <IconDots className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <TaskFormDialog
                        task={task}
                        projectId={projectId}
                        onSuccess={onSuccess}
                        users={users} // Pass users prop
                        trigger={
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <IconEdit className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                        }
                    />
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem className="text-red-500">
                            <IconTrash className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </AlertDialogTrigger>
                </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete this task.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}