"use server"

import { revalidatePath } from "next/cache"
import { PrismaClient, ProjectStatus, Prisma } from "@prisma/client"

const prisma = new PrismaClient()

export type Project = Prisma.ProjectGetPayload<object>;
export type Task = Prisma.TaskGetPayload<object>;
export type TimeEntry = Prisma.TimeEntryGetPayload<object>;
export type User = Prisma.UserGetPayload<object>;
export type Expense = Prisma.ExpenseGetPayload<object>;
export type File = Prisma.FileGetPayload<object>;
export type Client = Prisma.ClientGetPayload<object>;

export async function getProjects() {
    const projects = await prisma.project.findMany({
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
    return await prisma.client.findMany()
}

export async function getProjectById(id: string) {
    const project = await prisma.project.findUnique({
        where: { id },
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
    // In a real app, you'd get the organizationId from the user's session
    const organizationId = "cmf6tttw10000t46efkctz384";

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
            organizationId,
        },
    })
    revalidatePath("/internal/projects")
}

export async function updateProject(id: string, data: { name: string, description: string, status: ProjectStatus, clientId: string, budget: string, startDate: Date | null, endDate: Date | null }) {
    
    if (!data.clientId) {
        throw new Error("Client is required.");
    }

    const dataWithNumberBudget = {
        ...data,
        budget: parseFloat(data.budget)
    }
    
    await prisma.project.update({
        where: { id },
        data: dataWithNumberBudget,
    })
    revalidatePath("/internal/projects")
}

export async function deleteProject(id: string) {
    await prisma.project.delete({
        where: { id },
    })
    revalidatePath("/internal/projects")
}

export async function getUsers() {
    return await prisma.user.findMany();
}