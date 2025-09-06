"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db";
import { InvoiceStatus } from "@prisma/client"
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

export async function getInvoices() {
    const user = await getAuthenticatedUser();
    if (!isManager(user)) {
        throw new Error("Unauthorized: Only managers can view invoices.");
    }

    const invoices = await prisma.invoice.findMany({
        where: { organizationId: user.organizationId },
        include: {
            client: true,
            project: true,
        },
    })
    return invoices.map(invoice => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        totalAmount: invoice.totalAmount.toString(),
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        paidDate: invoice.paidDate,
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt,
        organizationId: invoice.organizationId,
        clientId: invoice.clientId,
        projectId: invoice.projectId,
        client: invoice.client,
        project: {
            id: invoice.project.id,
            name: invoice.project.name,
            description: invoice.project.description,
            status: invoice.project.status,
            budget: invoice.project.budget?.toString() ?? "0",
            startDate: invoice.project.startDate,
            endDate: invoice.project.endDate,
            createdAt: invoice.project.createdAt,
            updatedAt: invoice.project.updatedAt,
            organizationId: invoice.project.organizationId,
            clientId: invoice.project.clientId,
        },
    }))
}

export async function getClients() {
    const user = await getAuthenticatedUser();
    if (!isManager(user)) {
        throw new Error("Unauthorized: Only managers can view clients.");
    }
    return await prisma.client.findMany({
        where: { organizationId: user.organizationId }
    });
}

export async function getProjects() {
    const user = await getAuthenticatedUser();
    if (!isManager(user)) {
        throw new Error("Unauthorized: Only managers can view projects.");
    }
    const projects = await prisma.project.findMany({
        where: { organizationId: user.organizationId }
    })
    return projects.map(project => ({
        ...project,
        budget: project.budget?.toString() ?? "0",
    }))
}

export async function addInvoice(data: { invoiceNumber: string, totalAmount: string, status: InvoiceStatus, clientId: string, projectId: string, issueDate: Date, dueDate: Date }) {
    const user = await getAuthenticatedUser();
    if (!isManager(user)) {
        throw new Error("Unauthorized: Only managers can add invoices.");
    }
    await prisma.invoice.create({
        data: {
            ...data,
            organizationId: user.organizationId,
        },
    })
    revalidatePath("/internal/invoices")
}

export async function updateInvoice(id: string, data: { invoiceNumber: string, totalAmount: string, status: InvoiceStatus, clientId: string, projectId: string, issueDate: Date, dueDate: Date }) {
    const user = await getAuthenticatedUser();
    if (!isManager(user)) {
        throw new Error("Unauthorized: Only managers can update invoices.");
    }
    await prisma.invoice.update({
        where: { id, organizationId: user.organizationId },
        data,
    })
    revalidatePath("/internal/invoices")
}

export async function deleteInvoice(id: string) {
    const user = await getAuthenticatedUser();
    if (!isManager(user)) {
        throw new Error("Unauthorized: Only managers can delete invoices.");
    }
    await prisma.invoice.delete({
        where: { id, organizationId: user.organizationId },
    })
    revalidatePath("/internal/invoices")
}