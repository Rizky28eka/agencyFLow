import { prisma } from "@/lib/db";
import { ProjectStatus, Prisma } from "@prisma/client";
import { User } from "@prisma/client"; // Assuming User type is available from Prisma client

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

export async function getProjectsService(user: User): Promise<ProjectWithCalculatedFields[]> {
    const projects = await prisma.project.findMany({
        where: {
            organizationId: user.organizationId,
            deletedAt: null, // Filter out soft-deleted projects
        },
        include: {
            client: true,
            expenses: true,
            timeEntries: true, // Include timeEntries
        },
    });

    const projectsWithCalculatedFields = projects.map(project => {
        const expenses = project.expenses.map(expense => ({
            ...expense,
            amount: parseFloat(expense.amount.toString()),
        }));
        const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

        const timeEntries = project.timeEntries.map(entry => ({
            ...entry,
            hours: parseFloat(entry.hours.toString()),
            hourlyRate: entry.hourlyRate ? parseFloat(entry.hourlyRate.toString()) : null,
        }));
        const totalBillableTime = timeEntries.reduce((sum, entry) => sum + (entry.hours * (entry.hourlyRate || 0)), 0);

        return {
            ...project,
            expenses: expenses,
            totalExpenses: totalExpenses,
            timeEntries: timeEntries,
            totalBillableTime: totalBillableTime,
            profitability: (project.budget ? parseFloat(project.budget.toString()) : 0) - totalExpenses + totalBillableTime,
            budget: project.budget ? parseFloat(project.budget.toString()) : null,
        };
    });

    return projectsWithCalculatedFields;
}

export async function getProjectByIdService(id: string, user: User) {
    const project = await prisma.project.findUnique({
        where: { id, organizationId: user.organizationId, deletedAt: null }, // Filter out soft-deleted projects
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
            timeEntries: true, // Include timeEntries
        },
    });

    if (!project) {
        return null;
    }

    const totalExpenses = project.expenses.reduce((sum, expense) => sum + parseFloat(expense.amount.toString()), 0);

    const timeEntries = project.timeEntries.map(entry => ({
        ...entry,
        hours: parseFloat(entry.hours.toString()),
        hourlyRate: entry.hourlyRate ? parseFloat(entry.hourlyRate.toString()) : null,
    }));
    const totalBillableTime = timeEntries.reduce((sum, entry) => sum + (entry.hours * (entry.hourlyRate || 0)), 0);

    const profitability = (project.budget ? parseFloat(project.budget.toString()) : 0) - totalExpenses + totalBillableTime;

    const expenses = project.expenses.map(expense => ({
        ...expense,
        amount: parseFloat(expense.amount.toString()),
    }));

    return {
        ...project,
        expenses: expenses,
        totalExpenses,
        timeEntries: timeEntries,
        totalBillableTime: totalBillableTime,
        profitability,
        budget: project.budget ? project.budget.toNumber() : null,
        hourlyRate: project.hourlyRate ? project.hourlyRate.toNumber() : null,
        tasks: project.tasks.map(task => ({
            ...task,
            estimatedHours: task.estimatedHours ? task.estimatedHours.toNumber() : null,
            actualHours: task.actualHours ? task.actualHours.toNumber() : null,
        })),
    };
}

export async function addProjectService(data: { name: string, description: string, status: ProjectStatus, clientId: string, budget: string, startDate: Date | null, endDate: Date | null }, user: User) {
    if (!data.clientId) {
        throw new Error("Client is required.");
    }

    await prisma.project.create({
        data: {
            ...data,
            organizationId: user.organizationId,
        },
    });
}

export async function updateProjectService(id: string, data: { name: string, description: string, status: ProjectStatus, clientId: string, budget: string, startDate: Date | null, endDate: Date | null }, user: User) {
    if (!data.clientId) {
        throw new Error("Client is required.");
    }

    const oldProject = await prisma.project.findUnique({
        where: { id, organizationId: user.organizationId },
    });

    if (!oldProject) {
        throw new Error("Project not found.");
    }

    const dataWithNumberBudget = {
        ...data,
        budget: parseFloat(data.budget),
    };

    const updatedProject = await prisma.project.update({
        where: { id, organizationId: user.organizationId },
        data: dataWithNumberBudget,
    });

    // Log audit trail
    await prisma.auditLog.create({
        data: {
            entityType: "Project",
            entityId: updatedProject.id,
            action: "UPDATE",
            oldValue: JSON.stringify(oldProject), // Store old data
            newValue: JSON.stringify(updatedProject), // Store new data
            changedByUserId: user.id,
            organizationId: user.organizationId,
        },
    });
}

export async function deleteProjectService(id: string, user: User) {
    await prisma.project.update({
        where: { id, organizationId: user.organizationId },
        data: { deletedAt: new Date() }, // Soft delete
    });
}

export async function getProjectsForSelectionService(user: User): Promise<{ id: string; name: string; }[]> {
    try {
        const projects = await prisma.project.findMany({
            where: {
                organizationId: user.organizationId,
                status: { in: ['PLANNING', 'ON_GOING'] },
                deletedAt: null, // Filter out soft-deleted projects
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

export async function createProjectFromQuotationService(quotationId: string, user: User) {
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

    const newProject = await prisma.project.create({
        data: {
            name: `Project from Quotation ${quotation.quotationNumber}`,
            description: `Project created from approved quotation ${quotation.quotationNumber}. Total amount: ${quotation.totalAmount} ${quotation.currency}.`,
            status: "PLANNING",
            clientId: quotation.clientId,
            budget: quotation.totalAmount,
            budgetCurrency: quotation.currency,
            startDate: new Date(),
            organizationId: user.organizationId,
        },
    });

    await prisma.quotation.update({
        where: { id: quotationId },
        data: {
            projectId: newProject.id,
        },
    });

    return newProject;
}
