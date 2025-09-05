"use server"

import { revalidatePath } from "next/cache"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function getClients() {
    return await prisma.client.findMany()
}

export async function addClient(data: { name: string, email: string, company: string, status: 'ACTIVE' | 'INACTIVE' }) {
    // In a real app, you'd get the organizationId from the user's session
    const organizationId = "cmf6tttw10000t46efkctz384";
    await prisma.client.create({
        data: {
            ...data,
            organizationId,
        },
    })
    revalidatePath("/internal/clients")
}

export async function updateClient(id: string, data: { name: string, email: string, company: string, status: 'ACTIVE' | 'INACTIVE' }) {
    await prisma.client.update({
        where: { id },
        data,
    })
    revalidatePath("/internal/clients")
}

export async function deleteClient(id: string) {
    await prisma.client.delete({
        where: { id },
    })
    revalidatePath("/internal/clients")
}
