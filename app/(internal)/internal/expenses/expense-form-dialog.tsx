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
import { IconCalendar as IconCalendarTabler } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { toast } from "sonner"
import { addExpense, updateExpense, deleteExpense } from "./actions"
import { Expense } from "@prisma/client"

type ExpenseWithAmountAsString = Omit<Expense, 'amount'> & { amount: string };

type ExpenseFormDialogProps = {
  projectId: string;
  expense?: ExpenseWithAmountAsString;
  trigger?: React.ReactElement;
  onSuccess?: () => void;
};

export function ExpenseFormDialog({ projectId, expense, trigger, onSuccess }: ExpenseFormDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const [dateOpen, setDateOpen] = React.useState(false);

  const [form, setForm] = React.useState({
    description: expense?.description || "",
    amount: expense ? String(expense.amount) : "0",
    date: expense?.date ? new Date(expense.date) : new Date(),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setForm({ ...form, [id]: value });
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setForm({ ...form, date });
    }
  };

  const handleSubmit = () => {
    startTransition(() => {
      const promise = expense
        ? updateExpense(expense.id, projectId, form)
        : addExpense({ ...form, projectId });

      promise
        .then(() => {
          setOpen(false);
          toast.success(expense ? "Expense updated" : "Expense added");
          onSuccess?.();
        })
        .catch((error) => {
          toast.error(error.message);
        });
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : <DialogTrigger asChild><Button>Add Expense</Button></DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{expense ? "Edit Expense" : "Add Expense"}</DialogTitle>
          <DialogDescription>
            {expense ? "Update the expense details." : "Add a new expense to this project."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={form.description} onChange={handleChange} placeholder="e.g. Software license" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" value={form.amount} onChange={handleChange} placeholder="e.g. 100" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                    <IconCalendarTabler className="mr-2 h-4 w-4" />
                    {format(form.date, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.date}
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
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Saving..." : (expense ? "Update Expense" : "Add Expense")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type ExpenseActionsProps = {
    expense: ExpenseWithAmountAsString;
    projectId: string;
    onSuccess?: () => void;
}

export function ExpenseActions({ expense, projectId, onSuccess }: ExpenseActionsProps) {
    const [, startTransition] = React.useTransition();

    const handleDelete = () => {
        startTransition(() => {
            deleteExpense(expense.id, projectId)
                .then(() => {
                    toast.success("Expense deleted");
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
                    <ExpenseFormDialog
                        expense={expense}
                        projectId={projectId}
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
                        This action cannot be undone. This will permanently delete this expense record.
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
