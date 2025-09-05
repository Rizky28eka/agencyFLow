"use server"

import { revalidatePath } from "next/cache"
import { PrismaClient, ProjectStatus, Prisma } from "@prisma/client"
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient()

export type Project = Prisma.ProjectGetPayload<object>;
export type Task = Prisma.TaskGetPayload<object>;
export type TimeEntry = Prisma.TimeEntryGetPayload<object>;
export type User = Prisma.UserGetPayload<object>;
export type Expense = Prisma.ExpenseGetPayload<object>;
export type File = Prisma.FileGetPayload<object>;
export type Client = Prisma.ClientGetPayload<object>;

async function getCurrentUser() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id || !session.user?.organizationId) {
        return null;
    }
    return session.user;
}

export async function getProjects() {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return [];
    }

    const projects = await prisma.project.findMany({
        where: {
            organizationId: currentUser.organizationId,
        },
        include: {
            client: true,
        },
    });

    const expenseSums = await prisma.expense.groupBy({
        by: ['projectId'],
        _sum: {
            amount: true,
        },
    });

    return projects.map(project => {
        const expenseSum = expenseSums.find(e => e.projectId === project.id);
        const totalExpenses = expenseSum?._sum.amount?.toString() ?? "0";
        const budget = project.budget?.toString() ?? "0";

        const totalExpensesNum = parseFloat(totalExpenses);
        const budgetNum = parseFloat(budget);
        const profitability = budgetNum - totalExpensesNum;

        return {
            ...project,
            budget: budget,
            totalExpenses: totalExpenses,
            profitability: profitability.toString(),
        };
    });
}

export async function getClients() {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return [];
    }
    return await prisma.client.findMany({
        where: {
            organizationId: currentUser.organizationId,
        },
    });
}

export async function getProjectById(id: string) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return null;
    }

    const project = await prisma.project.findUnique({
        where: { id, organizationId: currentUser.organizationId },
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

    // Convert Decimals in expenses to strings
    const sanitizedExpenses = project.expenses.map(expense => ({
        ...expense,
        amount: expense.amount.toString(),
    }));

    const totalExpenses = sanitizedExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    const budget = Number(project.budget) || 0;
    const profitability = budget - totalExpenses;

    return {
        ...project,
        budget: project.budget?.toString() ?? "0",
        expenses: sanitizedExpenses, // Use the sanitized expenses
        totalExpenses: totalExpenses.toString(),
        profitability: profitability.toString(),
    };
}

export async function addProject(data: { name: string, description: string, status: ProjectStatus, clientId: string, budget: string, startDate: Date | null, endDate: Date | null }) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        throw new Error("User not authenticated.");
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
            organizationId: currentUser.organizationId,
        },
    })
    revalidatePath("/internal/projects")
}

export async function updateProject(id: string, data: { name: string, description: string, status: ProjectStatus, clientId: string, budget: string, startDate: Date | null, endDate: Date | null }) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        throw new Error("User not authenticated.");
    }

    if (!data.clientId) {
        throw new Error("Client is required.");
    }

    const dataWithNumberBudget = {
        ...data,
        budget: parseFloat(data.budget)
    }
    
    await prisma.project.update({
        where: { id, organizationId: currentUser.organizationId },
        data: dataWithNumberBudget,
    })
    revalidatePath("/internal/projects")
}

export async function deleteProject(id: string) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        throw new Error("User not authenticated.");
    }

    await prisma.project.delete({
        where: { id, organizationId: currentUser.organizationId },
    })
    revalidatePath("/internal/projects")
}

export async function getUsers() {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return [];
    }
    return await prisma.user.findMany({
        where: {
            organizationId: currentUser.organizationId,
        },
    });
}