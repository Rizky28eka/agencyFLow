'use server'

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { createActivity } from "../activities/actions"; // Import createActivity
import { isManager } from "@/lib/permissions";

export type TimeEntry = Prisma.TimeEntryGetPayload<object>;
export type Task = Prisma.TaskGetPayload<object>;

async function getAuthenticatedUser() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id || !session.user.organizationId || !session.user.role) {
        throw new Error("Unauthorized: User not authenticated.");
    }
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { role: true }
    });
    if (!user) {
        throw new Error("Unauthorized: User not found.");
    }
    return user;
}

export async function addTimeEntry(prevState: { success: boolean; message: string; }, formData: FormData) {
    const user = await getAuthenticatedUser();

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
                userId: user.id,
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

export async function updateTimeEntry(prevState: { success: boolean; message: string; }, formData: FormData) {
    const user = await getAuthenticatedUser();

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
            where: { id, userId: user.id }, // Ensure only the user who created it or a manager can update
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
    const user = await getAuthenticatedUser();

    try {
        const deletedTimeEntry = await prisma.timeEntry.delete({
            where: { id, userId: user.id }, // Ensure only the user who created it or a manager can delete
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
    const user = await getAuthenticatedUser();

    const whereClause: Prisma.TimeEntryWhereInput = {
        project: {
            organizationId: user.organizationId,
        },
    };
    if (projectId) {
        whereClause.projectId = projectId;
    }
    // Only allow users to see their own time entries unless they are a manager
    if (!isManager(user)) {
        whereClause.userId = user.id;
    } else if (userId) {
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

export type TimeEntryWithRelations = TimeEntry & { user: { name: string | null }, project: { name: string | null }, task: Task | null };
