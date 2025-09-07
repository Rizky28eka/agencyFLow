'use server'

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db";
import { ProjectStatus, Prisma } from "@prisma/client"
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { isManager } from "@/lib/permissions";

export type ProjectWithCalculatedFields = Omit<Prisma.ProjectGetPayload<{
    include: {
        expenses: true;
        client: true;
    };
}>, 'budget' | 'expenses'> & {
    totalExpenses: number;
    profitability: number;
    budget: number | null;
    expenses: (Omit<Prisma.ExpenseGetPayload<object>, 'amount'> & { amount: number })[];
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

export async function getProjects(): Promise<ProjectWithCalculatedFields[]> {
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
            amount: parseFloat(expense.amount.toString()), // Convert Decimal to number
        }));
        const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        // Add a new property 'totalExpenses' to the project object
        return {
            ...project,
            expenses: expenses,
            totalExpenses: totalExpenses,
            // Also calculate profitability here if needed, or in page.tsx
            profitability: (project.budget ? parseFloat(project.budget.toString()) : 0) - totalExpenses,
            budget: project.budget ? parseFloat(project.budget.toString()) : null,
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
                    project: {
                        select: {
                            name: true,
                        },
                    },
                    assignee: {
                        select: {
                            name: true,
                        },
                    },
                    dependenciesOn: {
                        include: {
                            dependsOn: {
                                select: {
                                    id: true,
                                    title: true,
                                },
                            },
                        },
                    },
                    dependentTasks: {
                        include: {
                            dependent: {
                                select: {
                                    id: true,
                                    title: true,
                                },
                            },
                        },
                    },
                },
            },
            expenses: true,
        },
    });

    if (!project) {
        return null;
    }

    const totalExpenses = project.expenses.reduce((sum, expense) => sum + parseFloat(expense.amount.toString()), 0);
    const profitability = (project.budget ? parseFloat(project.budget.toString()) : 0) - totalExpenses;

    const expenses = project.expenses.map(expense => ({
        ...expense,
        amount: parseFloat(expense.amount.toString()), // Convert Decimal to number
    }));

    return {
        ...project,
        expenses: expenses,
        totalExpenses,
        profitability,
        budget: project.budget ? parseFloat(project.budget.toString()) : null, // Convert budget to number
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

export async function createProjectFromQuotation(quotationId: string) {
    const user = await getAuthenticatedUser();
    if (!isManager(user)) {
        throw new Error("Unauthorized: You do not have permission to create projects from quotations.");
    }

    const quotation = await prisma.quotation.findUnique({
        where: { id: quotationId, organizationId: user.organizationId },
        include: {
            items: true,
            client: true,
        },
    });

    if (!quotation) {
        throw new Error("Quotation not found.");
    }

    if (quotation.status !== "APPROVED") {
        throw new Error("Only approved quotations can be converted to projects.");
    }

    // Create a new project
    const newProject = await prisma.project.create({
        data: {
            name: `Project from Quotation ${quotation.quotationNumber}`,
            description: `Project created from approved quotation ${quotation.quotationNumber}. Total amount: ${quotation.totalAmount} ${quotation.currency}.`,
            status: "PLANNING", // Default status for new projects
            clientId: quotation.clientId,
            budget: quotation.totalAmount,
            budgetCurrency: quotation.currency,
            startDate: new Date(), // Project starts now
            organizationId: user.organizationId,
        },
    });

    // Update the quotation to link it to the new project
    await prisma.quotation.update({
        where: { id: quotationId },
        data: {
            projectId: newProject.id,
        },
    });

    // Optionally, create tasks from quotation items
    // For now, we'll just create the project. Task creation can be a separate step or more complex logic.
    // if (quotation.items && quotation.items.length > 0) {
    //     for (const item of quotation.items) {
    //         await prisma.task.create({
    //             data: {
    //                 title: item.description,
    //                 projectId: newProject.id,
    //                 organizationId: user.organizationId, // Assuming tasks also need organizationId
    //                 status: "TO_DO",
    //                 priority: "MEDIUM",
    //                 estimatedHours: item.quantity * 8, // Example: 8 hours per item quantity
    //             },
    //         });
    //     }
    // }

    revalidatePath("/internal/projects");
    return newProject;
}
