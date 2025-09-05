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
import { addTask, updateTask, deleteTask } from "./actions"
import { Task, User } from "./actions"

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

type TaskFormDialogProps = {
  projectId: string;
  task?: Task;
  trigger?: React.ReactElement;
  onSuccess?: () => void;
  users: User[]; // Add users prop
};

export function TaskFormDialog({ projectId, task, trigger, onSuccess, users }: TaskFormDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const [dateOpen, setDateOpen] = React.useState(false);

  const [form, setForm] = React.useState({
    title: task?.title || "",
    description: task?.description || "",
    status: task?.status || TaskStatus.TO_DO,
    priority: task?.priority || Priority.MEDIUM,
    dueDate: task?.dueDate ? new Date(task.dueDate) : undefined,
    assigneeId: task?.assigneeId || "", // Add assigneeId
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setForm({ ...form, [id]: value });
  };

  const handleSelectChange = (id: string, value: string) => {
    setForm({ ...form, [id]: value });
  }

  const handleDateChange = (date: Date | undefined) => {
    setForm({ ...form, dueDate: date });
  };

  const handleSubmit = () => {
    startTransition(() => {
      const dataToSubmit = {
        ...form,
        assigneeId: form.assigneeId === "" ? null : form.assigneeId, // Convert empty string to null for optional field
        dueDate: form.dueDate || null, // Convert undefined to null for optional field
      };

      const promise = task
        ? updateTask(task.id, projectId, dataToSubmit)
        : addTask({ ...dataToSubmit, projectId });

      promise
        .then(() => {
          setOpen(false);
          toast.success(task ? "Task updated" : "Task added");
          onSuccess?.();
        })
        .catch((error) => {
          toast.error(error.message);
        });
    });
  };

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
                <SelectItem value="">Unassigned</SelectItem> {/* Option for unassigned */}
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
        </div>
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
    task: Task;
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
                .catch((error) => {
                    toast.error(error.message);
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