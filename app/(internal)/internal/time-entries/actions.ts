'use server'

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Prisma } from "@prisma/client";
import { createActivity } from "../activities/actions"; // Import createActivity

export type TimeEntry = Prisma.TimeEntryGetPayload<object>;
export type Task = Prisma.TaskGetPayload<object>;

async function getCurrentUser() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
        return null;
    }
    return session.user;
}

export async function addTimeEntry(prevState: { success: boolean; message: string; }, formData: FormData) { // Changed prevState: any
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return { success: false, message: "User not authenticated." };
    }

    const hours = parseFloat(formData.get("hours") as string);
    const date = new Date(formData.get("date") as string);
    const description = formData.get("description") as string;
    const projectId = formData.get("projectId") as string;
    const taskId = formData.get("taskId") === "NO_TASK" ? null : (formData.get("taskId") as string | null);

    if (isNaN(hours) || !date || !projectId) {
        return { success: false, message: "Invalid input for time entry." };
    }

    try {
        const newTimeEntry = await prisma.timeEntry.create({
            data: {
                hours,
                date,
                description,
                projectId,
                taskId: taskId || null,
                userId: currentUser.id,
            },
        });

        // Create activity
        await createActivity(
            projectId,
            "TIME_ENTRY_ADDED",
            `Logged ${newTimeEntry.hours} hours for ${newTimeEntry.description || 'a task'}.`
        );

        revalidatePath(`/internal/projects/${projectId}`);
        return { success: true, message: "Time entry added successfully!" };
    } catch (error) {
        console.error(error);
        return { success: false, message: "Failed to add time entry." };
    }
}

export async function updateTimeEntry(prevState: { success: boolean; message: string; }, formData: FormData) { // Changed prevState: any
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return { success: false, message: "User not authenticated." };
    }

    const id = formData.get("id") as string;
    const hours = parseFloat(formData.get("hours") as string);
    const date = new Date(formData.get("date") as string);
    const description = formData.get("description") as string;
    const projectId = formData.get("projectId") as string;
    const taskId = formData.get("taskId") === "NO_TASK" ? null : (formData.get("taskId") as string | null);

    if (isNaN(hours) || !date || !projectId || !id) {
        return { success: false, message: "Invalid input for time entry." };
    }

    try {
        const updatedTimeEntry = await prisma.timeEntry.update({
            where: { id },
            data: {
                hours,
                date,
                description,
                projectId,
                taskId: taskId || null,
            },
        });

        // Create activity
        await createActivity(
            projectId,
            "TIME_ENTRY_UPDATED",
            `Updated ${updatedTimeEntry.hours} hours for ${updatedTimeEntry.description || 'a task'}.`
        );

        revalidatePath(`/internal/projects/${projectId}`);
        return { success: true, message: "Time entry updated successfully!" };
    } catch (error) {
        console.error(error);
        return { success: false, message: "Failed to update time entry." };
    }
}

export async function deleteTimeEntry(id: string, projectId: string) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return { success: false, message: "User not authenticated." };
    }

    try {
        const deletedTimeEntry = await prisma.timeEntry.delete({
            where: { id },
        });

        // Create activity
        await createActivity(
            projectId,
            "TIME_ENTRY_DELETED",
            `Deleted ${deletedTimeEntry.hours} hours for ${deletedTimeEntry.description || 'a task'}.`
        );

        revalidatePath(`/internal/projects/${projectId}`);
        return { success: true, message: "Time entry deleted successfully!" };
    } catch (error) {
        console.error(error);
        return { success: false, message: "Failed to delete time entry." };
    }
}

export async function getTimeEntries(projectId?: string, userId?: string) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return [];
    }

    const whereClause: { projectId?: string; userId?: string } = {};
    if (projectId) {
        whereClause.projectId = projectId;
    }
    if (userId) {
        whereClause.userId = userId;
    }

    try {
        const timeEntries = await prisma.timeEntry.findMany({
            where: whereClause,
            include: {
                user: { select: { name: true } },
                project: { select: { name: true } },
                task: true,
            },
            orderBy: { date: "desc" },
        });
        return timeEntries;
    } catch (error) {
        console.error(error);
        return [];
    }
}

export type TimeEntryWithRelations = TimeEntry & { user: { name: string | null }, task: Task | null };
