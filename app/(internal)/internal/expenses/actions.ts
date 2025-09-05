"use server"

import { revalidatePath } from "next/cache"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function getExpenses() {
    const expenses = await prisma.expense.findMany({
        include: {
            project: true,
        },
    })
    return expenses.map(expense => ({
        id: expense.id,
        description: expense.description,
        amount: expense.amount.toString(),
        date: expense.date,
        createdAt: expense.createdAt,
        updatedAt: expense.updatedAt,
        organizationId: expense.organizationId,
        projectId: expense.projectId,
        project: {
            id: expense.project.id,
            name: expense.project.name,
            description: expense.project.description,
            status: expense.project.status,
            budget: expense.project.budget?.toString() ?? "0",
            startDate: expense.project.startDate,
            endDate: expense.project.endDate,
            createdAt: expense.project.createdAt,
            updatedAt: expense.project.updatedAt,
            organizationId: expense.project.organizationId,
            clientId: expense.project.clientId,
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
    // In a real app, you'd get the organizationId from the user's session
    const organizationId = "cmf6tttw10000t46efkctz384";
    await prisma.expense.create({
        data: {
            ...data,
            organizationId,
        },
    })
    revalidatePath("/internal/expenses")
}

export async function updateExpense(id: string, data: { description: string, amount: string, date: Date, projectId: string }) {
    await prisma.expense.update({
        where: { id },
        data,
    })
    revalidatePath("/internal/expenses")
}

export async function deleteExpense(id: string) {
    await prisma.expense.delete({
        where: { id },
    })
    revalidatePath("/internal/expenses")
}
