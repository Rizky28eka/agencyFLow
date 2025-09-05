"use server"

import { revalidatePath } from "next/cache"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// This function seems to be for the main expenses page, we'll leave it as is.
export async function getExpenses() {
    const expenses = await prisma.expense.findMany({
        include: {
            project: true,
        },
    })
    return expenses.map(expense => ({
        ...expense,
        amount: expense.amount.toString(),
        project: {
            ...expense.project,
            budget: expense.project.budget?.toString() ?? "0",
        },
    }))
}

export async function getProjects() {
    const projects = await prisma.project.findMany()
    return projects.map(project => ({
        ...project,
        budget: project.budget?.toString() ?? "0",
    }))
}

export async function addExpense(data: { description: string, amount: string, date: Date, projectId: string }) {
    const organizationId = "cmf6tttw10000t46efkctz384";
    
    if (!data.description || !data.amount || !data.date || !data.projectId) {
        throw new Error("Missing required fields");
    }

    await prisma.expense.create({
        data: {
            description: data.description,
            amount: parseFloat(data.amount),
            date: data.date,
            projectId: data.projectId,
            organizationId,
        },
    });

    revalidatePath(`/internal/projects/${data.projectId}`);
    revalidatePath("/internal/expenses");
}

export async function updateExpense(id: string, projectId: string, data: { description: string, amount: string, date: Date }) {
    if (!data.description || !data.amount || !data.date) {
        throw new Error("Missing required fields");
    }

    await prisma.expense.update({
        where: { id },
        data: {
            description: data.description,
            amount: parseFloat(data.amount),
            date: data.date,
        },
    });

    revalidatePath(`/internal/projects/${projectId}`);
    revalidatePath("/internal/expenses");
}

export async function deleteExpense(id: string, projectId: string) {
    await prisma.expense.delete({
        where: { id },
    });
    revalidatePath(`/internal/projects/${projectId}`);
    revalidatePath("/internal/expenses");
}