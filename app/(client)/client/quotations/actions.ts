'use server'

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { QuotationStatus, Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createProjectFromQuotation } from "@/app/(internal)/internal/projects/actions"; // Re-use the project creation logic

export type Quotation = Prisma.QuotationGetPayload<{
    include: {
        client: true;
        items: true;
    };
}>;

async function getAuthenticatedClientUser() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id || !session.user.organizationId || session.user.role !== "CLIENT") {
        throw new Error("Unauthorized: Client not authenticated.");
    }
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { role: true, client: true } // Include client relation for client users
    });
    if (!user || user.role?.name !== "CLIENT" || !user.client) {
        throw new Error("Unauthorized: Client user not found or not associated with a client.");
    }
    return user;
}

export async function getClientQuotationById(id: string) {
    const user = await getAuthenticatedClientUser();

    const quotation = await prisma.quotation.findUnique({
        where: { id, clientId: user.client?.id, organizationId: user.organizationId },
        include: {
            client: true,
            items: true,
        },
    });

    return quotation;
}

export async function updateClientQuotationStatus(id: string, status: QuotationStatus) {
    const user = await getAuthenticatedClientUser();

    // Only allow APPROVED or REJECTED status changes from client side
    if (status !== "APPROVED" && status !== "REJECTED") {
        throw new Error("Invalid status update from client.");
    }

    const updatedQuotation = await prisma.quotation.update({
        where: { id, clientId: user.client?.id, organizationId: user.organizationId },
        data: { status },
    });

    if (status === "APPROVED") {
        // Check if a project is already linked to avoid creating duplicates
        if (!updatedQuotation.projectId) {
            await createProjectFromQuotation(id);
        }
    }

    revalidatePath(`/client/quotations/${id}`);
    return updatedQuotation;
}
