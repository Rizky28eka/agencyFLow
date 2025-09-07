'use server'

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { QuotationStatus, Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { isManager } from "@/lib/permissions";
import { createProjectFromQuotation } from "@/app/(internal)/internal/projects/actions"; // Import the new function

export type Quotation = Prisma.QuotationGetPayload<{
    include: {
        client: true;
        items: true;
    };
}>;

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

export async function getQuotations() {
    const user = await getAuthenticatedUser();
    if (!isManager(user)) {
        throw new Error("Unauthorized: You do not have permission to view quotations.");
    }

    const quotations = await prisma.quotation.findMany({
        where: {
            organizationId: user.organizationId,
        },
        include: {
            client: true,
            items: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return quotations;
}

export async function getQuotationById(id: string) {
    const user = await getAuthenticatedUser();
    if (!isManager(user)) {
        throw new Error("Unauthorized: You do not have permission to view this quotation.");
    }

    const quotation = await prisma.quotation.findUnique({
        where: { id, organizationId: user.organizationId },
        include: {
            client: true,
            items: true,
        },
    });

    return quotation;
}

export async function addQuotation(data: {
    clientId: string;
    issueDate: Date;
    expiryDate?: Date;
    items: { description: string; quantity: number; unitPrice: number; discountPct?: number; taxPct?: number; serviceId?: string; }[];
}) {
    const user = await getAuthenticatedUser();
    if (!isManager(user)) {
        throw new Error("Unauthorized: You do not have permission to add quotations.");
    }

    // Generate quotation number (simple example, can be more robust)
    const lastQuotation = await prisma.quotation.findFirst({
        where: { organizationId: user.organizationId },
        orderBy: { quotationNumber: 'desc' },
        select: { quotationNumber: true },
    });

    const currentYear = new Date().getFullYear();
    let nextNumber = 1;
    if (lastQuotation && lastQuotation.quotationNumber) {
        const lastNumMatch = lastQuotation.quotationNumber.match(/(\d+)$/);
        if (lastNumMatch) {
            nextNumber = parseInt(lastNumMatch[1]) + 1;
        }
    }
    const quotationNumber = `QTN-${currentYear}-${String(nextNumber).padStart(4, '0')}`;

    let subtotal = 0;
    let totalAmount = 0;

    const quotationItemsData = data.items.map(item => {
        const lineTotal = (item.quantity * item.unitPrice) * (1 - (item.discountPct || 0) / 100) * (1 + (item.taxPct || 0) / 100);
        subtotal += (item.quantity * item.unitPrice);
        totalAmount += lineTotal;
        return {
            description: item.description,
            quantity: item.quantity,
            unitPrice: new Prisma.Decimal(item.unitPrice),
            discountPct: item.discountPct,
            taxPct: item.taxPct,
            lineTotal: new Prisma.Decimal(lineTotal),
            service: item.serviceId ? { connect: { id: item.serviceId } } : undefined,
        };
    });

    await prisma.quotation.create({
        data: {
            quotationNumber,
            status: "DRAFT",
            issueDate: data.issueDate,
            expiryDate: data.expiryDate,
            clientId: data.clientId,
            organizationId: user.organizationId,
            subtotal: new Prisma.Decimal(subtotal),
            totalAmount: new Prisma.Decimal(totalAmount),
            items: {
                create: quotationItemsData,
            },
        },
    });

    revalidatePath("/internal/quotations");
}

export async function updateQuotation(id: string, data: {
    clientId: string;
    issueDate: Date;
    expiryDate?: Date;
    status: QuotationStatus;
    items: { id?: string; description: string; quantity: number; unitPrice: number; discountPct?: number; taxPct?: number; serviceId?: string; }[];
}) {
    const user = await getAuthenticatedUser();
    if (!isManager(user)) {
        throw new Error("Unauthorized: You do not have permission to update quotations.");
    }

    let subtotal = 0;
    let totalAmount = 0;

    const quotationItemsData = data.items.map(item => {
        const lineTotal = (item.quantity * item.unitPrice) * (1 - (item.discountPct || 0) / 100) * (1 + (item.taxPct || 0) / 100);
        subtotal += (item.quantity * item.unitPrice);
        totalAmount += lineTotal;
        return {
            id: item.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: new Prisma.Decimal(item.unitPrice),
            discountPct: item.discountPct,
            taxPct: item.taxPct,
            lineTotal: new Prisma.Decimal(lineTotal),
            serviceId: item.serviceId,
        };
    });

    // Get existing items to determine which ones to delete
    const existingQuotation = await prisma.quotation.findUnique({
        where: { id, organizationId: user.organizationId },
        include: { items: true },
    });

    const existingItemIds = existingQuotation?.items.map(item => item.id) || [];
    const newItemIds = data.items.filter(item => item.id).map(item => item.id!);
    const itemsToDelete = existingItemIds.filter(id => !newItemIds.includes(id));

    await prisma.$transaction([
        // Delete items that are no longer in the updated list
        prisma.quotationItem.deleteMany({
            where: {
                id: { in: itemsToDelete },
                quotationId: id,
            },
        }),
        // Update existing items and create new ones
        prisma.quotation.update({
            where: { id, organizationId: user.organizationId },
            data: {
                clientId: data.clientId,
                issueDate: data.issueDate,
                expiryDate: data.expiryDate,
                status: data.status,
                subtotal: new Prisma.Decimal(subtotal),
                totalAmount: new Prisma.Decimal(totalAmount),
                items: {
                    upsert: quotationItemsData.map(item => ({
                        where: { id: item.id || "new-item" }, // Use a dummy ID for new items
                        update: {
                            description: item.description,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            discountPct: item.discountPct,
                            taxPct: item.taxPct,
                            lineTotal: item.lineTotal,
                            service: item.serviceId ? { connect: { id: item.serviceId } } : { disconnect: true },
                        },
                        create: {
                            description: item.description,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            discountPct: item.discountPct,
                            taxPct: item.taxPct,
                            lineTotal: item.lineTotal,
                            service: item.serviceId ? { connect: { id: item.serviceId } } : undefined,
                        },
                    })),
                },
            },
        }),
    ]);

    // If status is approved, convert to project
    if (data.status === "APPROVED") {
        const existingQuotation = await prisma.quotation.findUnique({
            where: { id, organizationId: user.organizationId },
            select: { projectId: true },
        });
        if (!existingQuotation?.projectId) { // Only create project if not already linked
            await createProjectFromQuotation(id);
        }
    }

    revalidatePath("/internal/quotations");
}

export async function deleteQuotation(id: string) {
    const user = await getAuthenticatedUser();
    if (!isManager(user)) {
        throw new Error("Unauthorized: You do not have permission to delete quotations.");
    }

    await prisma.quotation.delete({
        where: { id, organizationId: user.organizationId },
    });

    revalidatePath("/internal/quotations");
}

export async function updateQuotationStatus(id: string, status: QuotationStatus) {
    const user = await getAuthenticatedUser();
    if (!isManager(user)) {
        throw new Error("Unauthorized: You do not have permission to update quotation status.");
    }

    const updatedQuotation = await prisma.quotation.update({
        where: { id, organizationId: user.organizationId },
        data: { status },
    });

    if (status === "APPROVED") {
        // Check if a project is already linked to avoid creating duplicates
        if (!updatedQuotation.projectId) {
            await createProjectFromQuotation(id);
        }
    }

    revalidatePath("/internal/quotations");
    return updatedQuotation;
}

// Helper to get clients for dropdowns
export async function getClientsForSelection(): Promise<{ id: string; name: string; }[]> {
    const user = await getAuthenticatedUser();
    if (!isManager(user)) {
        return [];
    }
    try {
        const clients = await prisma.client.findMany({
            where: {
                organizationId: user.organizationId,
                status: "ACTIVE",
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

// Helper to get services for dropdowns
export async function getServicesForSelection(): Promise<{ id: string; name: string; defaultPrice: Prisma.Decimal; }[]> {
    const user = await getAuthenticatedUser();
    if (!isManager(user)) {
        return [];
    }
    try {
        const services = await prisma.service.findMany({
            where: {
                organizationId: user.organizationId,
            },
            select: {
                id: true,
                name: true,
                defaultPrice: true,
            },
            orderBy: {
                name: 'asc',
            },
        });
        return services.map(service => ({
            ...service,
            defaultPrice: service.defaultPrice, // Keep as Decimal for now, convert in UI if needed
        }));
    } catch (error) {
        console.error("Failed to fetch services for selection:", error);
        return [];
    }
}