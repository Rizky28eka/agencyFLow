'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { IconArrowLeft, IconUser, IconCash, IconReceipt2, IconChecklist } from "@tabler/icons-react";
import Link from "next/link";
import { ExpenseFormDialog, ExpenseActions } from "../../expenses/expense-form-dialog";
import { TaskFormDialog, TaskActions } from "../../tasks/task-form-dialog";
import { Prisma } from '@prisma/client';

// Define a more specific type for the project data after serialization
type ProjectDetailProps = Prisma.PromiseReturnType<typeof import('../actions').getProjectById>;
type UserListProps = Prisma.PromiseReturnType<typeof import('../actions').getUsers>; // New type for users

export function ProjectDetailView({ project, users }: { project: ProjectDetailProps, users: UserListProps }) {
  if (!project) {
    return <div>Project not found.</div>;
  }

  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

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
        <p className="text-muted-foreground">{project.description}</p>
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
              <TaskFormDialog projectId={project.id} users={users} /> {/* Pass users */}
            </CardHeader>
            <CardContent>
              {project.tasks.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Title</TableHead><TableHead>Status</TableHead><TableHead>Priority</TableHead><TableHead>Assignee</TableHead><TableHead>Due Date</TableHead><TableHead><span className="sr-only">Actions</span></TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {project.tasks.map((task) => (
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
                    {project.expenses.map((expense) => (
                      <TableRow key={expense.id}><TableCell>{expense.description}</TableCell><TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell><TableCell>{currencyFormatter.format(Number(expense.amount))}</TableCell><TableCell><ExpenseActions expense={expense} projectId={project.id} /></TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">No expenses for this project yet.</p>
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
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Expenses</span>
                <span className="text-red-500">{currencyFormatter.format(Number(project.totalExpenses))}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Profitability</span>
                <span>{currencyFormatter.format(Number(project.profitability))}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
