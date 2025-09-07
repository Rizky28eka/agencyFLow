'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { IconArrowLeft, IconUser, IconCash, IconReceipt2, IconChecklist, IconClock, IconFile, IconDownload, IconDots, IconTrash, IconActivity, IconEdit } from "@tabler/icons-react";
import Link from "next/link";
import { ExpenseFormDialog, ExpenseActions } from "../../expenses/expense-form-dialog";
import { TaskFormDialog, TaskActions } from "../../tasks/task-form-dialog";
import { TimeEntryFormDialog, TimeEntryActions } from "../../time-entries/time-entry-form-dialog";
import { Project, Task, User, Expense, File, Client, updateProject } from '../../projects/actions';
import { uploadFile, deleteFile } from '../../files/actions';
import { Activity } from '../../activities/actions';
import { format } from "date-fns";
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { toast } from 'sonner';
import * as React from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import ReactMarkdown from 'react-markdown';
import { Textarea } from '@/components/ui/textarea';


type SanitizedExpense = Omit<Expense, 'amount'> & { amount: string };

type FileWithUploadedBy = File & { uploadedBy: { name: string | null } };

// Define a more specific type for the project data after serialization
type ProjectDetailProps = Omit<Project, 'budget' | 'expenses'> & {
    client: Client;
    tasks: (Task & { assignee: User | null })[];
    expenses: SanitizedExpense[];
    files: FileWithUploadedBy[];
    budget: string | null; // Changed to string | null
    totalExpenses: number;
    profitability: number;
};
type UserListProps = User[];
import { TimeEntryWithRelations } from '../../time-entries/actions';

function FileUploadButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Uploading...' : 'Upload File'}
    </Button>
  );
}

type FileActionsProps = {
  file: File;
  projectId: string;
  onSuccess?: () => void;
}

function FileActions({ file, projectId, onSuccess }: FileActionsProps) {
  const [, startTransition] = React.useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteFile(file.id, projectId);
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
          <DropdownMenuItem asChild>
            <a href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
              <IconDownload className="mr-2 h-4 w-4" />
              Download
            </a>
          </DropdownMenuItem>
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
            This action cannot be undone. This will permanently delete this file.
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


type ActivityWithUser = Activity & { user: { name: string | null } };

export function ProjectDetailView({ project, users, timeEntries, activities }: { project: ProjectDetailProps, users: UserListProps, timeEntries: TimeEntryWithRelations[], activities: ActivityWithUser[] }) {
  const [fileUploadState, fileUploadAction] = useActionState(uploadFile, { success: false, message: "" });
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isEditingDescription, setIsEditingDescription] = React.useState(false);
  const [description, setDescription] = React.useState(project?.description || "");

  const handleSaveDescription = async () => {
    if (!project) return;
    try {
      const projectDataForUpdate = {
        name: project.name,
        description: description,
        status: project.status,
        clientId: project.clientId,
        budget: project.budget || "0",
        startDate: project.startDate ? new Date(project.startDate) : null,
        endDate: project.endDate ? new Date(project.endDate) : null,
      };
      await updateProject(project.id, projectDataForUpdate);
      toast.success("Project description updated.");
      setIsEditingDescription(false);
    } catch (error) {
      toast.error("Failed to update description.");
      console.error(error);
    }
  };

  React.useEffect(() => {
    if (fileUploadState.success) {
      toast.success(fileUploadState.message);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else if (fileUploadState.message) {
      toast.error(fileUploadState.message);
    }
  }, [fileUploadState]);

  if (!project) {
    return <div>Project not found.</div>;
  }

  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: project.budgetCurrency || 'USD',
  });

  const totalHoursLogged = timeEntries.reduce((sum, entry) => sum + Number(entry.hours), 0);

  return (
    <div className="w-full p-4 space-y-6">
      <div>
        <Link href="/internal/projects" className="flex items-center gap-2 text-sm text-muted-foreground hover:underline mb-4">
          <IconArrowLeft size={16} />
          Back to Projects
        </Link>
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <Badge>{project.status.replace("_", " ")}</Badge>
        </div>
        
        <div className="mt-4">
          {isEditingDescription ? (
            <div className="space-y-2">
              <Textarea
                className="min-h-[150px] text-base"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your project using Markdown..."
              />
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleSaveDescription}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditingDescription(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="group relative pt-2">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    a: ({...props}) => <a className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                    ul: ({...props}) => <ul className="list-disc pl-5" {...props} />,
                    ol: ({...props}) => <ol className="list-decimal pl-5" {...props} />,
                  }}
                >
                  {project.description || "No description provided. Click the edit icon to add one."}
                </ReactMarkdown>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="absolute top-0 right-0 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => {
                  setDescription(project.description || "");
                  setIsEditingDescription(true);
                }}
              >
                <IconEdit size={14} />
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <IconChecklist size={20} />
                Tasks
              </CardTitle>
              <TaskFormDialog projectId={project.id} users={users} />
            </CardHeader>
            <CardContent>
              {project.tasks.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Title</TableHead><TableHead>Status</TableHead><TableHead>Priority</TableHead><TableHead>Assignee</TableHead><TableHead>Due Date</TableHead><TableHead><span className="sr-only">Actions</span></TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {project.tasks.map((task: Task & { assignee: User | null }) => (
                      <TableRow key={task.id}><TableCell>{task.title}</TableCell><TableCell><Badge variant="outline">{task.status.replace("_", " ")}</Badge></TableCell><TableCell>{task.priority}</TableCell><TableCell>{task.assignee?.name || 'Unassigned'}</TableCell><TableCell>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</TableCell><TableCell><TaskActions task={task} projectId={project.id} users={users} /></TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">No tasks for this project yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <IconReceipt2 size={20} />
                Expenses
              </CardTitle>
              <ExpenseFormDialog projectId={project.id} />
            </CardHeader>
            <CardContent>
              {project.expenses.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Description</TableHead><TableHead>Date</TableHead><TableHead>Amount</TableHead><TableHead><span className="sr-only">Actions</span></TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {project.expenses.map((expense: SanitizedExpense) => (
                      <TableRow key={expense.id}><TableCell>{expense.description}</TableCell><TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell><TableCell>{currencyFormatter.format(Number(expense.amount))}</TableCell><TableCell><ExpenseActions expense={expense} projectId={project.id} /></TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">No expenses for this project yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <IconClock size={20} />
                Time Entries ({totalHoursLogged.toFixed(2)} hours)
              </CardTitle>
              <TimeEntryFormDialog projectId={project.id} tasks={project.tasks} />
            </CardHeader>
            <CardContent>
              {timeEntries.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead><span className="sr-only">Actions</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{format(new Date(entry.date), "PPP")}</TableCell>
                        <TableCell>{entry.hours.toFixed(2)}</TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell>{entry.task?.title || 'N/A'}</TableCell>
                        <TableCell>{entry.user.name}</TableCell>
                        <TableCell><TimeEntryActions timeEntry={entry} projectId={project.id} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">No time entries for this project yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Files Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <IconFile size={20} />
                Files
              </CardTitle>
              <form action={fileUploadAction} className="flex items-center gap-2">
                <input type="hidden" name="projectId" value={project.id} />
                <input type="file" name="file" ref={fileInputRef} required className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                <FileUploadButton />
              </form>
            </CardHeader>
            <CardContent>
              {project.files.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File Name</TableHead>
                      <TableHead>Uploaded By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead><span className="sr-only">Actions</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {project.files.map((file: FileWithUploadedBy) => (
                      <TableRow key={file.id}>
                        <TableCell>
                          <a href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline">
                            <IconFile size={16} />
                            {file.name}
                          </a>
                        </TableCell>
                        <TableCell>{file.uploadedBy.name}</TableCell>
                        <TableCell>{format(new Date(file.createdAt), "PPP")}</TableCell>
                        <TableCell><FileActions file={file} projectId={project.id} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">No files uploaded for this project yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconUser size={20} />
                Client Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-semibold">{project.client.name}</p>
              <p className="text-sm text-muted-foreground">{project.client.email}</p>
              <p className="text-sm text-muted-foreground">{project.client.phone}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconCash size={20} />
                Financials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Budget</span>
                <span>{currencyFormatter.format(Number(project.budget))}</span>
              </div>
            </CardContent>
          </Card>

          {/* Activity Feed Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconActivity size={20} />
                Activity Feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.map((activity: ActivityWithUser) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {/* You can add an icon based on activity.type here */}
                        <IconActivity size={16} className="text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-semibold">{activity.user.name}</span> {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(activity.createdAt), "MMM dd, yyyy HH:mm")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No recent activity for this project.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
