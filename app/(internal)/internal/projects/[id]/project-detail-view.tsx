'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GanttChart } from "@/components/gantt-chart";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { IconArrowLeft, IconUser, IconCash, IconReceipt2, IconChecklist, IconClock, IconFile, IconActivity, IconEdit } from "@tabler/icons-react";
import Link from "next/link";
import { ExpenseFormDialog, ExpenseActions } from "../../expenses/expense-form-dialog";
import { TaskFormDialog, TaskActions } from "../../tasks/task-form-dialog";
import { TaskWithRelations } from '../../tasks/actions';
import { TimeEntryFormDialog, TimeEntryActions } from "../../time-entries/time-entry-form-dialog";
import { ProjectWithCalculatedFields, Expense, File, Client, updateProject } from '../../projects/actions';
import { User } from '@prisma/client';
import { uploadFile } from '../../files/actions';
import { Activity } from '../../activities/actions';
import { format } from "date-fns";
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { toast } from 'sonner';
import * as React from "react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from 'react-markdown';
import { Textarea } from '@/components/ui/textarea';
import { FileList } from "@/components/files/file-list";


type SanitizedExpense = Omit<Expense, 'amount'> & { amount: string };

type FileWithUploadedBy = File & { uploadedBy: { name: string | null } };

// Define a more specific type for the project data after serialization
type ProjectDetailProps = Omit<ProjectWithCalculatedFields, 'budget' | 'expenses' | 'client'> & {
    client: Client;
    tasks: TaskWithRelations[];
    expenses: SanitizedExpense[];
    files: FileWithUploadedBy[];
    budget: number | null; // Changed to number | null
    totalExpenses: number;
    profitability: number;
};
type UserListProps = User[];
import type { TimeEntryWithRelations } from '../../time-entries/actions';

function FileUploadButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Uploading...' : 'Upload File'}
    </Button>
  );
}

export type ActivityWithUser = Activity & { user: { name: string | null } };

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
        budget: project.budget?.toString() || "0", // Convert number back to string for updateProject
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

  const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: project.budgetCurrency || 'IDR',
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
                    {project.tasks.map((task: TaskWithRelations) => (
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconChecklist size={20} />
                Gantt Chart
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GanttChart projects={[project]} />
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconUser size={20} />
                Team Capacity Planning
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                // Filter upcoming tasks with estimated hours
                const upcomingTasks = project.tasks.filter(
                  (task) => task.startDate && new Date(task.startDate) >= today && task.estimatedHours
                );

                // Calculate workload per user
                const workloadPerUser = upcomingTasks.reduce((acc, task) => {
                  if (task.assigneeId && task.estimatedHours) {
                    acc[task.assigneeId] = (acc[task.assigneeId] || 0) + Number(task.estimatedHours);
                  }
                  return acc;
                }, {} as Record<string, number>);

                // Calculate capacity per user and compare with workload
                const capacityData = users.map(user => {
                  const totalWorkload = workloadPerUser[user.id] || 0;
                  // Assuming a 30-day period for future capacity planning for simplicity
                  const futureWorkingDays = 30; 
                  const totalCapacity = (user.dailyCapacityHours ? Number(user.dailyCapacityHours) : 0) * futureWorkingDays;
                  
                  return {
                    userName: user.name || 'N/A',
                    totalWorkload: totalWorkload,
                    totalCapacity: totalCapacity,
                    remainingCapacity: totalCapacity - totalWorkload,
                    isOverloaded: totalWorkload > totalCapacity && totalCapacity > 0,
                  };
                });

                return (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Team Member</TableHead>
                        <TableHead>Workload (Estimated Hours)</TableHead>
                        <TableHead>Capacity (30 Days)</TableHead>
                        <TableHead>Remaining Capacity</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {capacityData.length > 0 ? (
                        capacityData.map((data, index) => (
                          <TableRow key={index}>
                            <TableCell>{data.userName}</TableCell>
                            <TableCell>{data.totalWorkload.toFixed(2)}</TableCell>
                            <TableCell>{data.totalCapacity.toFixed(2)}</TableCell>
                            <TableCell className={data.remainingCapacity < 0 ? "text-red-500" : "text-green-500"}>
                              {data.remainingCapacity.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              {data.isOverloaded ? (
                                <Badge variant="destructive">Overloaded</Badge>
                              ) : data.totalCapacity === 0 ? (
                                <Badge variant="outline">No Capacity Set</Badge>
                              ) : (
                                <Badge variant="secondary">Under Capacity</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No team members or upcoming tasks for capacity planning.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                );
              })()}
            </CardContent>
          </Card>

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
                <FileList files={project.files} onUpdate={() => { /* In a real app, you would re-validate the data here */ }} />
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

export { TimeEntryWithRelations, type UserListProps, type ProjectDetailProps };