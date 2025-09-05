"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { TaskStatus, Priority } from "@prisma/client"
import { createNotification } from "../notifications/actions"

export async function addTask(data: {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: Date;
  projectId: string;
  assigneeId?: string | null; // Added assigneeId
}) {
  const task = await prisma.task.create({
    data: {
      ...data,
      assigneeId: data.assigneeId === "" ? null : data.assigneeId, // Ensure null for empty string
    },
  });

  // Get project name for notification message
  const project = await prisma.project.findUnique({
    where: { id: data.projectId },
    select: { name: true, organizationId: true },
  });

  if (task.assigneeId && project) {
    await createNotification({
      recipientId: task.assigneeId,
      message: `You have been assigned a new task: "${task.title}" in project "${project.name}".`,
      link: `/internal/projects/${task.projectId}`,
      organizationId: project.organizationId,
    });
  }

  revalidatePath(`/internal/projects/${data.projectId}`);
}

export async function updateTask(id: string, projectId: string, data: {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: Priority;
    dueDate?: Date;
    assigneeId?: string | null; // Added assigneeId
}) {
  // Fetch existing task to compare assigneeId
  const existingTask = await prisma.task.findUnique({
    where: { id },
    select: { assigneeId: true, title: true, projectId: true },
  });

  const updatedTask = await prisma.task.update({
    where: { id },
    data: {
      ...data,
      assigneeId: data.assigneeId === "" ? null : data.assigneeId, // Ensure null for empty string
    },
  });

  // Get project name for notification message
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { name: true, organizationId: true },
  });

  // Notify if assignee changed and is not null
  if (project && updatedTask.assigneeId && updatedTask.assigneeId !== existingTask?.assigneeId) {
    await createNotification({
      recipientId: updatedTask.assigneeId,
      message: `You have been assigned task: "${updatedTask.title}" in project "${project.name}".`,
      link: `/internal/projects/${updatedTask.projectId}`,
      organizationId: project.organizationId,
    });
  }

  revalidatePath(`/internal/projects/${projectId}`);
}

export async function deleteTask(id: string, projectId: string) {
  await prisma.task.delete({
    where: { id },
  });
  revalidatePath(`/internal/projects/${projectId}`);
}