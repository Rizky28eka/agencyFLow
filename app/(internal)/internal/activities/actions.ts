'use server'

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
export type Activity = Awaited<ReturnType<typeof prisma.activity.findMany>>[number];

async function getCurrentUser() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
        return null;
    }
    return session.user;
}

export async function createActivity(
    projectId: string,
    type: string,
    description: string,
    userId?: string // Optional: if activity is not directly tied to current user
) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        console.error("Attempted to create activity without authenticated user.");
        return;
    }

    try {
        await prisma.activity.create({
            data: {
                projectId: projectId,
                type: type,
                description: description,
                userId: userId || currentUser.id,
                organizationId: currentUser.organizationId,
            },
        });
        // Revalidate paths that display activities, e.g., project detail page
        revalidatePath(`/internal/projects/${projectId}`);
    } catch (error) {
        console.error("Failed to create activity:", error);
    }
}

export async function getProjectActivities(projectId: string) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return [];
    }

    try {
        const activities = await prisma.activity.findMany({
            where: {
                projectId: projectId,
                organizationId: currentUser.organizationId,
            },
            include: {
                user: {
                    select: { name: true },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 20, // Limit to last 20 activities for performance
        });
        return activities;
    } catch (error) {
        console.error("Failed to fetch project activities:", error);
        return [];
    }
}
