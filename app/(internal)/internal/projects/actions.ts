'use server'

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { ProjectStatus, Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isManager } from "@/lib/permissions";
import {
    getProjectsService,
    getProjectByIdService,
    addProjectService,
    updateProjectService,
    deleteProjectService,
    getProjectsForSelectionService,
    createProjectFromQuotationService,
} from "@/src/features/projects/services/project.service";

export type ProjectWithCalculatedFields = Omit<Prisma.ProjectGetPayload<{
    include: {
        expenses: true;
        client: true;
        timeEntries: true; // Add timeEntries to include
    };
}>, 'budget' | 'expenses' | 'timeEntries'> & {
    totalExpenses: number;
    profitability: number;
    budget: number | null;
    expenses: (Omit<Prisma.ExpenseGetPayload<object>, 'amount'> & { amount: number })[];
    timeEntries: (Omit<Prisma.TimeEntryGetPayload<object>, 'hours' | 'hourlyRate'> & { hours: number, hourlyRate: number | null })[];
    totalBillableTime: number; // New field for total billable time
};

export type Task = Prisma.TaskGetPayload<object>;
export type TimeEntry = Prisma.TimeEntryGetPayload<object>;
export type Expense = Prisma.ExpenseGetPayload<object>;
export type File = Prisma.FileGetPayload<object>;
export type Client = Prisma.ClientGetPayload<object>;

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

export async function getProjects(): Promise<ProjectWithCalculatedFields[]> {
    const user = await getAuthenticatedUser();
    if (!isManager(user)) {
        throw new Error("Unauthorized: You do not have permission to view projects.");
    }
    return getProjectsService(user);
}

export async function getProjectById(id: string) {
    const user = await getAuthenticatedUser();
    if (!isManager(user)) {
        throw new Error("Unauthorized: You do not have permission to view this project.");
    }
    return getProjectByIdService(id, user);
}

export async function addProject(data: { name: string, description: string, status: ProjectStatus, clientId: string, budget: string, startDate: Date | null, endDate: Date | null }) {
    const user = await getAuthenticatedUser();
    if (!isManager(user)) {
        throw new Error("Unauthorized: You do not have permission to add projects.");
    }
    await addProjectService(data, user);
    revalidatePath("/internal/projects");
}

export async function updateProject(id: string, data: { name: string, description: string, status: ProjectStatus, clientId: string, budget: string, startDate: Date | null, endDate: Date | null }) {
    const user = await getAuthenticatedUser();
    if (!isManager(user)) {
        throw new Error("Unauthorized: You do not have permission to update projects.");
    }
    await updateProjectService(id, data, user);
    revalidatePath("/internal/projects");
}

export async function deleteProject(id: string) {
    const user = await getAuthenticatedUser();
    if (!isManager(user)) {
        throw new Error("Unauthorized: You do not have permission to delete projects.");
    }
    await deleteProjectService(id, user);
    revalidatePath("/internal/projects");
}

export async function getProjectsForSelection(): Promise<{ id: string; name: string; }[]> {
    const user = await getAuthenticatedUser();
    if (!isManager(user)) {
        return [];
    }
    return getProjectsForSelectionService(user);
}

export async function createProjectFromQuotation(quotationId: string) {
    const user = await getAuthenticatedUser();
    if (!isManager(user)) {
        throw new Error("Unauthorized: You do not have permission to create projects from quotations.");
    }
    const newProject = await createProjectFromQuotationService(quotationId, user);
    revalidatePath("/internal/projects");
    return newProject;
}
