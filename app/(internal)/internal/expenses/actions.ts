"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db";
import { createActivity } from "../activities/actions"; // Import createActivity
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { isManager } from "@/lib/permissions";

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

export async function getExpenses() {
    const user = await getAuthenticatedUser();
    if (!isManager(user)) {
        throw new Error("Unauthorized: Only managers can view expenses.");
    }

    const expenses = await prisma.expense.findMany({
        where: { organizationId: user.organizationId },
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
    const user = await getAuthenticatedUser();
    if (!isManager(user)) {
        throw new Error("Unauthorized: Only managers can view projects.");
    }

    const projects = await prisma.project.findMany({
        where: { organizationId: user.organizationId },
    })
    return projects.map(project => ({
        ...project,
        budget: project.budget?.toString() ?? "0",
    }))
}

export async function addExpense(data: { description: string, amount: string, date: Date, projectId: string }) {
    const user = await getAuthenticatedUser();
    if (!isManager(user)) {
        throw new Error("Unauthorized: Only managers can add expenses.");
    }
    
    if (!data.description || !data.amount || !data.date || !data.projectId) {
        throw new Error("Missing required fields");
    }

    const newExpense = await prisma.expense.create({
        data: {
            description: data.description,
            amount: parseFloat(data.amount),
            date: data.date,
            projectId: data.projectId,
            organizationId: user.organizationId,
        },
    });

    // Create activity
    await createActivity(
        data.projectId,
        "EXPENSE_ADDED",
        `Expense "${newExpense.description}" of ${newExpense.amount.toString()} was added.`
    );

    revalidatePath(`/internal/projects/${data.projectId}`);
    revalidatePath("/internal/expenses");
}

export async function updateExpense(id: string, projectId: string, data: { description: string, amount: string, date: Date }) {
    const user = await getAuthenticatedUser();
    if (!isManager(user)) {
        throw new Error("Unauthorized: Only managers can update expenses.");
    }

    if (!data.description || !data.amount || !data.date) {
        throw new Error("Missing required fields");
    }

    const updatedExpense = await prisma.expense.update({
        where: { id, organizationId: user.organizationId },
        data: {
            description: data.description,
            amount: parseFloat(data.amount),
            date: data.date,
        },
    });

    // Create activity
    await createActivity(
        projectId,
        "EXPENSE_UPDATED",
        `Expense "${updatedExpense.description}" was updated.`
    );

    revalidatePath(`/internal/projects/${projectId}`);
    revalidatePath("/internal/expenses");
}

export async function deleteExpense(id: string, projectId: string) {
    const user = await getAuthenticatedUser();
    if (!isManager(user)) {
        throw new Error("Unauthorized: Only managers can delete expenses.");
    }

    const deletedExpense = await prisma.expense.delete({
        where: { id, organizationId: user.organizationId },
    });

    // Create activity
    await createActivity(
        projectId,
        "EXPENSE_DELETED",
        `Expense "${deletedExpense.description}" was deleted.`
    );

    revalidatePath(`/internal/projects/${projectId}`);
    revalidatePath("/internal/expenses");
}