'use server'

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { isManager } from "@/lib/permissions";
import { Prisma, Currency } from "@prisma/client";

export type ServiceWithRelations = Prisma.ServiceGetPayload<object>;

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

export async function getServices(): Promise<ServiceWithRelations[]> {
    const user = await getAuthenticatedUser();
    if (!isManager(user)) {
        throw new Error("Unauthorized: You do not have permission to view services.");
    }

    const services = await prisma.service.findMany({
        where: {
            organizationId: user.organizationId,
        },
        orderBy: {
            name: "asc",
        },
    });
    return services;
}

export async function addService(data: { name: string, description: string | null, defaultPrice: number, currency: Currency }) {
    const user = await getAuthenticatedUser();
    if (!isManager(user)) {
        throw new Error("Unauthorized: You do not have permission to add services.");
    }

    await prisma.service.create({
        data: {
            ...data,
            organizationId: user.organizationId,
        },
    });
    revalidatePath("/internal/services");
}

export async function updateService(id: string, data: { name?: string, description?: string | null, defaultPrice?: number, currency?: Currency }) {
    const user = await getAuthenticatedUser();
    if (!isManager(user)) {
        throw new Error("Unauthorized: You do not have permission to update services.");
    }

    await prisma.service.update({
        where: { id, organizationId: user.organizationId },
        data,
    });
    revalidatePath("/internal/services");
}

export async function deleteService(id: string) {
    const user = await getAuthenticatedUser();
    if (!isManager(user)) {
        throw new Error("Unauthorized: You do not have permission to delete services.");
    }

    await prisma.service.delete({
        where: { id, organizationId: user.organizationId },
    });
    revalidatePath("/internal/services");
}