"use server"

import { revalidatePath } from "next/cache"
import { PrismaClient, InvoiceStatus } from "@prisma/client"

const prisma = new PrismaClient()

export async function getInvoices() {
    const invoices = await prisma.invoice.findMany({
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
    return await prisma.client.findMany()
}

export async function getProjects() {
    const projects = await prisma.project.findMany()
    return projects.map(project => ({
        ...project,
        budget: project.budget?.toString() ?? "0",
    }))
}

export async function addInvoice(data: { invoiceNumber: string, totalAmount: string, status: InvoiceStatus, clientId: string, projectId: string, issueDate: Date, dueDate: Date }) {
    // In a real app, you'd get the organizationId from the user's session
    const organizationId = "cmf6tttw10000t46efkctz384";
    await prisma.invoice.create({
        data: {
            ...data,
            organizationId,
        },
    })
    revalidatePath("/internal/invoices")
}

export async function updateInvoice(id: string, data: { invoiceNumber: string, totalAmount: string, status: InvoiceStatus, clientId: string, projectId: string, issueDate: Date, dueDate: Date }) {
    await prisma.invoice.update({
        where: { id },
        data,
    })
    revalidatePath("/internal/invoices")
}

export async function deleteInvoice(id: string) {
    await prisma.invoice.delete({
        where: { id },
    })
    revalidatePath("/internal/invoices")
}
