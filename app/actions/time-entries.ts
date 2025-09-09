"use server";

import { prisma } from "@/lib/db";
import { TimeEntry, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

export type TimeEntryInput = {
  hours: number;
  date: Date;
  description?: string;
  userId: string;
  taskId?: string;
  projectId: string;
  hourlyRate?: number;
  currency?: string;
};

export async function addTimeEntry(data: TimeEntryInput): Promise<TimeEntry> {
  const newTimeEntry = await prisma.timeEntry.create({
    data: {
      ...data,
      hours: new Prisma.Decimal(data.hours),
      hourlyRate: data.hourlyRate ? new Prisma.Decimal(data.hourlyRate) : undefined,
    },
  });
  revalidatePath("/internal/time-entries");
  revalidatePath(`/internal/tasks/${data.taskId}`);
  return newTimeEntry;
}

export async function updateTimeEntry(id: string, data: Partial<TimeEntryInput>): Promise<TimeEntry> {
  const updatedTimeEntry = await prisma.timeEntry.update({
    where: { id },
    data: {
      ...data,
      hours: data.hours ? new Prisma.Decimal(data.hours) : undefined,
      hourlyRate: data.hourlyRate ? new Prisma.Decimal(data.hourlyRate) : undefined,
    },
  });
  revalidatePath("/internal/time-entries");
  revalidatePath(`/internal/tasks/${updatedTimeEntry.taskId}`);
  return updatedTimeEntry;
}

export async function deleteTimeEntry(id: string): Promise<TimeEntry> {
  const deletedTimeEntry = await prisma.timeEntry.delete({
    where: { id },
  });
  revalidatePath("/internal/time-entries");
  revalidatePath(`/internal/tasks/${deletedTimeEntry.taskId}`);
  return deletedTimeEntry;
}

export async function getTimeEntriesByTask(taskId: string): Promise<TimeEntry[]> {
  const timeEntries = await prisma.timeEntry.findMany({
    where: { taskId },
    orderBy: { date: "desc" },
  });
  return timeEntries;
}

export async function getTimeEntriesByUser(userId: string, startDate?: Date, endDate?: Date): Promise<TimeEntry[]> {
  const timeEntries = await prisma.timeEntry.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: "desc" },
  });
  return timeEntries;
}