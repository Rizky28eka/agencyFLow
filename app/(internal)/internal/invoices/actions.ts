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
    return invoices.map(invoice => ({ ...invoice, totalAmount: invoice.totalAmount.toString() }))
}

export async function getClients() {
    return await prisma.client.findMany()
}

export async function getProjects() {
    return await prisma.project.findMany()
}

export async function addInvoice(data: { invoiceNumber: string, totalAmount: number, status: InvoiceStatus, clientId: string, projectId: string, issueDate: Date, dueDate: Date }) {
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

export async function updateInvoice(id: string, data: { invoiceNumber: string, totalAmount: number, status: InvoiceStatus, clientId: string, projectId: string, issueDate: Date, dueDate: Date }) {
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
