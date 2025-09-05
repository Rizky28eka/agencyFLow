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
    return expenses.map(e => ({ ...e, amount: e.amount.toString() }))
}

export async function getProjects() {
    return await prisma.project.findMany()
}

export async function addExpense(data: { description: string, amount: number, date: Date, projectId: string }) {
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

export async function updateExpense(id: string, data: { description: string, amount: number, date: Date, projectId: string }) {
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
