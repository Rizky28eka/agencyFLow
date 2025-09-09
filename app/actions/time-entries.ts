
"use server";

import { prisma } from "@/lib/db";
import { TimeEntry } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export type TimeEntryInput = {
  taskId: string;
  projectId: string;
  startAt: Date;
  endAt?: Date;
  seconds: number;
  description?: string;
};

export async function addTimeEntry(data: TimeEntryInput): Promise<TimeEntry> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const newTimeEntry = await prisma.timeEntry.create({
    data: {
      ...data,
      userId: session.user.id,
    },
  });
  revalidatePath(`/internal/tasks/${data.taskId}`);
  return newTimeEntry;
}

export async function updateTimeEntry(id: string, data: Partial<TimeEntryInput>): Promise<TimeEntry> {
  const updatedTimeEntry = await prisma.timeEntry.update({
    where: { id },
    data,
  });
  revalidatePath(`/internal/tasks/${updatedTimeEntry.taskId}`);
  return updatedTimeEntry;
}

export async function deleteTimeEntry(id: string): Promise<TimeEntry> {
  const deletedTimeEntry = await prisma.timeEntry.delete({
    where: { id },
  });
  revalidatePath(`/internal/tasks/${deletedTimeEntry.taskId}`);
  return deletedTimeEntry;
}

export async function getTimeEntriesByTask(taskId: string): Promise<TimeEntry[]> {
  const timeEntries = await prisma.timeEntry.findMany({
    where: { taskId },
    orderBy: { startAt: "desc" },
  });
  return timeEntries;
}

export async function getTimeEntriesByUser(userId: string, startDate?: Date, endDate?: Date): Promise<TimeEntry[]> {
  const timeEntries = await prisma.timeEntry.findMany({
    where: {
      userId,
      startAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { startAt: "desc" },
  });
  return timeEntries;
}
