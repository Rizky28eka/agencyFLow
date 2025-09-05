"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { TaskStatus, Priority, Prisma } from "@prisma/client";
import { createNotification } from "../notifications/actions";
import { createActivity } from "../activities/actions"; // Import createActivity

export type Task = Prisma.TaskGetPayload<object>;
export type User = Prisma.UserGetPayload<object>;

export async function addTask(data: {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: Date | null;
  projectId: string;
  assigneeId?: string | null;
}) {
  const task = await prisma.task.create({
    data: {
      ...data,
      assigneeId: data.assigneeId === "" ? null : data.assigneeId,
    },
  });

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

  // Create activity
  await createActivity(
    data.projectId,
    "TASK_CREATED",
    `Task "${task.title}" was created.`
  );

  revalidatePath(`/internal/projects/${data.projectId}`);
}

export async function updateTask(
  id: string,
  projectId: string,
  data: {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: Priority;
    dueDate?: Date | null;
    startDate?: Date | null;
    assigneeId?: string | null;
  }
) {
  const existingTask = await prisma.task.findUnique({
    where: { id },
    select: { assigneeId: true, title: true, projectId: true },
  });

  const updatedTask = await prisma.task.update({
    where: { id },
    data: {
      ...data,
      assigneeId: data.assigneeId === "" ? null : data.assigneeId,
    },
  });

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { name: true, organizationId: true },
  });

  if (
    project &&
    updatedTask.assigneeId &&
    updatedTask.assigneeId !== existingTask?.assigneeId
  ) {
    await createNotification({
      recipientId: updatedTask.assigneeId,
      message: `You have been assigned task: "${updatedTask.title}" in project "${project.name}".`,
      link: `/internal/projects/${updatedTask.projectId}`,
      organizationId: project.organizationId,
    });
  }

  // Create activity
  await createActivity(
    projectId,
    "TASK_UPDATED",
    `Task "${updatedTask.title}" was updated.`
  );

  revalidatePath(`/internal/projects/${projectId}`);
}

export async function deleteTask(id: string, projectId: string) {
  const deletedTask = await prisma.task.delete({
    where: { id },
  });

  // Create activity
  await createActivity(
    projectId,
    "TASK_DELETED",
    `Task "${deletedTask.title}" was deleted.`
  );

  revalidatePath(`/internal/projects/${projectId}`);
}

export async function addTaskDependency(
  dependentId: string,
  dependsOnId: string
) {
  await prisma.taskDependency.create({
    data: {
      dependentId,
      dependsOnId,
    },
  });
  // No specific project ID here, so revalidate a broader path or skip activity for now
  revalidatePath(`/internal/projects`);
}

export async function removeTaskDependency(id: string) {
  await prisma.taskDependency.delete({
    where: { id },
  });
  // No specific project ID here, so revalidate a broader path or skip activity for now
  revalidatePath(`/internal/projects`);
}