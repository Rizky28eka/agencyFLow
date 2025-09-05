"use server"

import { revalidatePath } from "next/cache"
import { PrismaClient, ProjectStatus } from "@prisma/client"

const prisma = new PrismaClient()

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
        const totalExpenses = expenseSum?._sum.amount?.toNumber() ?? 0;
        const budget = project.budget?.toNumber() ?? 0;
        const profitability = budget - totalExpenses;

        return {
            ...project,
            budget: budget.toString(),
            totalExpenses: totalExpenses.toString(),
            profitability: profitability.toString(),
        };
    });
}

export async function getClients() {
    return await prisma.client.findMany()
}

export async function addProject(data: { name: string, description: string, status: ProjectStatus, clientId: string, budget: number }) {
    // In a real app, you'd get the organizationId from the user's session
    const organizationId = "cmf6tttw10000t46efkctz384";
    await prisma.project.create({
        data: {
            ...data,
            organizationId,
        },
    })
    revalidatePath("/internal/projects")
}

export async function updateProject(id: string, data: { name: string, description: string, status: ProjectStatus, clientId: string, budget: number }) {
    await prisma.project.update({
        where: { id },
        data,
    })
    revalidatePath("/internal/projects")
}

export async function deleteProject(id: string) {
    await prisma.project.delete({
        where: { id },
    })
    revalidatePath("/internal/projects")
}
