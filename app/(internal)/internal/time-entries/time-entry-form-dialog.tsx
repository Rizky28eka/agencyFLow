'use client'

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
import { IconCalendar as IconCalendarTabler } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { toast } from "sonner"
import { addTimeEntry, updateTimeEntry, deleteTimeEntry, Task, TimeEntryWithRelations } from "./actions"
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";



type TimeEntryFormDialogProps = {
  projectId: string;
  tasks: Task[];
  timeEntry?: TimeEntryWithRelations;
  trigger?: React.ReactElement;
  onSuccess?: () => void;
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return <Button type="submit" disabled={pending}>{pending ? 'Saving...' : 'Save Changes'}</Button>;
}

export function TimeEntryFormDialog({ projectId, tasks, timeEntry, trigger, onSuccess }: TimeEntryFormDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [dateOpen, setDateOpen] = React.useState(false);

  const initialState = {
    success: false,
    message: "",
  };

  const [addState, addAction] = useActionState(addTimeEntry, initialState);
  const [updateState, updateAction] = useActionState(updateTimeEntry, initialState);

  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (addState.success || updateState.success) {
      toast.success(addState.message || updateState.message);
      setOpen(false);
      onSuccess?.();
      formRef.current?.reset();
    } else if (addState.message || updateState.message) {
      toast.error(addState.message || updateState.message);
    }
  }, [addState, updateState, onSuccess]);

  const action = timeEntry ? updateAction : addAction;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : <DialogTrigger asChild><Button>Add Time Entry</Button></DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{timeEntry ? "Edit Time Entry" : "Add Time Entry"}</DialogTitle>
          <DialogDescription>
            {timeEntry ? "Update the time entry details." : "Add a new time entry for this project."}
          </DialogDescription>
        </DialogHeader>
        <form action={action} ref={formRef}>
          <input type="hidden" name="projectId" value={projectId} />
          {timeEntry && <input type="hidden" name="id" value={timeEntry.id} />}
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="hours">Hours</Label>
                <Input id="hours" name="hours" type="number" step="0.01" defaultValue={timeEntry?.hours.toString() || ""} placeholder="e.g. 8" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Popover open={dateOpen} onOpenChange={setDateOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                      <IconCalendarTabler className="mr-2 h-4 w-4" />
                      {timeEntry?.date ? format(new Date(timeEntry.date), "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={timeEntry?.date ? new Date(timeEntry.date) : undefined}
                      onSelect={(d) => {
                        if (d) {
                          const dateInput = formRef.current?.elements.namedItem("date");
                          if (dateInput instanceof HTMLInputElement) {
                            dateInput.value = d.toISOString();
                          }
                          setDateOpen(false);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <input type="hidden" name="date" value={timeEntry?.date ? new Date(timeEntry.date).toISOString() : ""} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" defaultValue={timeEntry?.description || ""} placeholder="e.g. Worked on UI design" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="taskId">Task (Optional)</Label>
              <Select name="taskId" defaultValue={timeEntry?.taskId || "NO_TASK"}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a task" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NO_TASK">No specific task</SelectItem>
                  {tasks.map(task => (
                    <SelectItem key={task.id} value={task.id}>{task.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type TimeEntryActionsProps = {
    timeEntry: TimeEntryWithRelations;
    projectId: string;
    onSuccess?: () => void;
}

export function TimeEntryActions({ timeEntry, projectId, onSuccess }: TimeEntryActionsProps) {
    const [, startTransition] = React.useTransition();

    const handleDelete = () => {
        startTransition(async () => {
            const result = await deleteTimeEntry(timeEntry.id, projectId);
            if (result.success) {
                toast.success(result.message);
                onSuccess?.();
            } else {
                toast.error(result.message);
            }
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
                    <TimeEntryFormDialog
                        timeEntry={timeEntry}
                        projectId={projectId}
                        tasks={[]} // Tasks need to be passed down if editing from here
                        onSuccess={onSuccess}
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
                        This action cannot be undone. This will permanently delete this time entry record.
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
