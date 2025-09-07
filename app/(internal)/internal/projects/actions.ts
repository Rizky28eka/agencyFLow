'use server'

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db";
import { ProjectStatus, Prisma } from "@prisma/client"
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { isManager } from "@/lib/permissions";

export type Project = Prisma.ProjectGetPayload<{
    include: {
        expenses: true;
    };
}> & {
    totalExpenses: number;
    profitability: number;
};
export type Task = Prisma.TaskGetPayload<object>;
export type TimeEntry = Prisma.TimeEntryGetPayload<object>;
export type User = Prisma.UserGetPayload<object>;
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

export async function getProjects() {
    const user = await getAuthenticatedUser();
    if (!isManager(user)) {
        throw new Error("Unauthorized: You do not have permission to view projects.");
    }

    const projects = await prisma.project.findMany({
        where: {
            organizationId: user.organizationId,
        },
        include: {
            client: true,
            expenses: true, // Include expenses
        },
    });

    // Calculate total expenses for each project
    const projectsWithTotalExpenses = projects.map(project => {
        const expenses = project.expenses.map(expense => ({
            ...expense,
            amount: expense.amount.toString(), // Convert Decimal to string
        }));
        const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
        // Add a new property 'totalExpenses' to the project object
        return {
            ...project,
            expenses: expenses, // Use the converted expenses array
            totalExpenses: totalExpenses,
            // Also calculate profitability here if needed, or in page.tsx
            profitability: Number(project.budget) - totalExpenses,
            budget: project.budget ? project.budget.toString() : null, // Convert budget to string
        };
    });

    return projectsWithTotalExpenses;
}

export async function getProjectById(id: string) {
    const user = await getAuthenticatedUser();
    if (!isManager(user)) {
        throw new Error("Unauthorized: You do not have permission to view this project.");
    }

    const project = await prisma.project.findUnique({
        where: { id, organizationId: user.organizationId },
        include: {
            client: true,
            tasks: {
                include: {
                    assignee: true,
                },
            },
            expenses: true,
        },
    });

    if (!project) {
        return null;
    }

    const totalExpenses = project.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    const profitability = Number(project.budget) - totalExpenses;

    const expenses = project.expenses.map(expense => ({
        ...expense,
        amount: expense.amount.toString(), // Convert Decimal to string
    }));

    return {
        ...project,
        expenses: expenses, // Use the converted expenses array
        totalExpenses,
        profitability,
        budget: project.budget ? project.budget.toString() : null, // Convert budget to string
    };
}

export async function addProject(data: { name: string, description: string, status: ProjectStatus, clientId: string, budget: string, startDate: Date | null, endDate: Date | null }) {
    const user = await getAuthenticatedUser();
    if (!isManager(user)) {
        throw new Error("Unauthorized: You do not have permission to add projects.");
    }

    if (!data.clientId) {
        throw new Error("Client is required.");
    }

    await prisma.project.create({
        data: {
            name: data.name,
            description: data.description,
            status: data.status,
            clientId: data.clientId,
            budget: parseFloat(data.budget),
            startDate: data.startDate,
            endDate: data.endDate,
            organizationId: user.organizationId,
        },
    })
    revalidatePath("/internal/projects")
}

export async function updateProject(id: string, data: { name: string, description: string, status: ProjectStatus, clientId: string, budget: string, startDate: Date | null, endDate: Date | null }) {
    const user = await getAuthenticatedUser();
    if (!isManager(user)) {
        throw new Error("Unauthorized: You do not have permission to update projects.");
    }

    if (!data.clientId) {
        throw new Error("Client is required.");
    }

    const dataWithNumberBudget = {
        ...data,
        budget: parseFloat(data.budget)
    }

    await prisma.project.update({
        where: { id, organizationId: user.organizationId },
        data: dataWithNumberBudget,
    })
    revalidatePath("/internal/projects")
}

export async function deleteProject(id: string) {
    const user = await getAuthenticatedUser();
    if (!isManager(user)) {
        throw new Error("Unauthorized: You do not have permission to delete projects.");
    }

    await prisma.project.delete({
        where: { id, organizationId: user.organizationId },
    })
    revalidatePath("/internal/projects")
}

// --- Function for populating select dropdowns ---
export async function getProjectsForSelection(): Promise<{ id: string; name: string; }[]> {
    const user = await getAuthenticatedUser();
    if (!isManager(user)) {
        return []; // Return empty array if not authenticated
    }

    try {
        const projects = await prisma.project.findMany({
            where: {
                organizationId: user.organizationId,
                status: { in: ['PLANNING', 'ON_GOING'] } // Only show active projects
            },
            select: {
                id: true,
                name: true,
            },
            orderBy: {
                name: 'asc',
            },
        });
        return projects;
    } catch (error) {
        console.error("Failed to fetch projects for selection:", error);
        return [];
    }
}
