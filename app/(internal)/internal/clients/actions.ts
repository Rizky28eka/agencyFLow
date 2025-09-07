'use server'

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canManageClients } from "@/lib/permissions";

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

export async function getClients() {
    const user = await getAuthenticatedUser();
    if (!canManageClients(user)) {
        throw new Error("Unauthorized");
    }
    return await prisma.client.findMany({
        where: { organizationId: user.organizationId }
    });
}

export async function addClient(data: { name: string, email: string, company: string, status: 'ACTIVE' | 'INACTIVE', phone: string | null, address: string | null }) {
    const user = await getAuthenticatedUser();
    if (!canManageClients(user)) {
        throw new Error("Unauthorized");
    }

    await prisma.client.create({
        data: {
            ...data,
            organizationId: user.organizationId,
        },
    })
    revalidatePath("/internal/clients")
}

export async function updateClient(id: string, data: { name: string, email: string, company: string, status: 'ACTIVE' | 'INACTIVE', phone: string | null, address: string | null }) {
    const user = await getAuthenticatedUser();
    if (!canManageClients(user)) {
        throw new Error("Unauthorized");
    }
    await prisma.client.update({
        where: { id, organizationId: user.organizationId },
        data,
    })
    revalidatePath("/internal/clients")
}

export async function deleteClient(id: string) {
    const user = await getAuthenticatedUser();
    if (!canManageClients(user)) {
        throw new Error("Unauthorized");
    }
    await prisma.client.delete({
        where: { id, organizationId: user.organizationId },
    })
    revalidatePath("/internal/clients")
}

// --- Function for populating select dropdowns ---
export async function getClientsForSelection(): Promise<{ id: string; name: string; }[]> {
    const user = await getAuthenticatedUser();
    if (!canManageClients(user)) {
        return [];
    }

    try {
        const clients = await prisma.client.findMany({
            where: {
                organizationId: user.organizationId,
                status: 'ACTIVE', // Only show active clients
            },
            select: {
                id: true,
                name: true,
            },
            orderBy: {
                name: 'asc',
            },
        });
        return clients;
    } catch (error) {
        console.error("Failed to fetch clients for selection:", error);
        return [];
    }
}