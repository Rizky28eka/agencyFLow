'use server'

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Prisma } from "@prisma/client";
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { canManageContracts } from "@/lib/permissions";

// Define types for Contract
export type ClientContract = Omit<Prisma.ContractGetPayload<{
    include: {
        client: true,
        project: true,
    }
}>, 'amount' | 'project'> & {
    amount: string;
    project: (Omit<Prisma.ProjectGetPayload<object>, 'budget'> & { budget: string | null }) | null;
};

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

// --- Get all contracts ---
export async function getContracts(): Promise<ClientContract[]> {
    const user = await getAuthenticatedUser();
    if (!canManageContracts(user)) {
        throw new Error("Unauthorized: You do not have permission to view contracts.");
    }

    try {
        const contracts = await prisma.contract.findMany({
            where: {
                organizationId: user.organizationId,
            },
            include: {
                client: true, // Include client details
                project: true, // Include project details
            },
            orderBy: {
                endDate: 'desc',
            },
        });

        // Convert Decimal types to string for client-side consumption
        const contractsForClient = contracts.map(contract => ({
            ...contract,
            amount: contract.amount.toString(),
            project: contract.project ? {
                ...contract.project,
                budget: contract.project.budget ? contract.project.budget.toString() : null,
            } : null,
        }));

        return contractsForClient as ClientContract[];
    } catch (error) {
        console.error("Failed to fetch contracts:", error);
        throw new Error("Failed to fetch contracts.");
    }
}

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// --- Create a new contract ---
export async function createContract(prevState: { success: boolean; message: string; data?: ClientContract | null }, formData: FormData) {
    const user = await getAuthenticatedUser();
    if (!canManageContracts(user)) {
        return { success: false, message: "Unauthorized" };
    }

    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const clientId = formData.get('clientId') as string;
    const projectId = formData.get('projectId') as string | null;
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;
    const amount = formData.get('amount') as string;

    if (!file || !title || !clientId || !startDate || !endDate || !amount) {
        return { success: false, message: "All fields except project are required." };
    }

    if (file.size === 0) {
        return { success: false, message: "Contract file cannot be empty." };
    }

    try {
        // Handle file upload
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileExtension = path.extname(file.name);
        const uniqueFileName = `${uuidv4()}${fileExtension}`;
        const filePath = path.join(UPLOAD_DIR, uniqueFileName);
        const fileUrl = `/uploads/${uniqueFileName}`;
        await fs.writeFile(filePath, buffer);

        // Create contract record
        const newContract = await prisma.contract.create({
            data: {
                title,
                clientId,
                projectId: projectId || undefined,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                amount: parseFloat(amount),
                status: 'DRAFT',
                fileUrl,
                organizationId: user.organizationId,
            },
            include: {
                client: true,
                project: true,
            }
        });

        // Convert Decimal types to string for client-side consumption
        const newContractForClient = {
            ...newContract,
            amount: newContract.amount.toString(),
            project: newContract.project ? {
                ...newContract.project,
                budget: newContract.project.budget ? newContract.project.budget.toString() : null,
            } : null,
        };

        revalidatePath("/internal/contracts");
        return { success: true, message: "Contract created successfully!", data: newContractForClient as ClientContract };

    } catch (error) {
        console.error("Error creating contract:", error);
        return { success: false, message: "Failed to create contract." };
    }
}

// --- Delete a contract ---
export async function deleteContract(id: string) {
    const user = await getAuthenticatedUser();
    if (!canManageContracts(user)) {
        throw new Error("Unauthorized");
    }

    try {
        const contract = await prisma.contract.findUnique({
            where: { id, organizationId: user.organizationId },
        });

        if (!contract) {
            throw new Error("Contract not found or you do not have permission to delete it.");
        }

        // Delete file from filesystem
        const filePath = path.join(process.cwd(), 'public', contract.fileUrl);
        try {
            await fs.unlink(filePath);
        } catch (fileError) {
            // Log the error but proceed to delete the DB record
            console.error(`Failed to delete contract file, but proceeding with DB record deletion: ${filePath}`, fileError);
        }

        // Delete record from database
        await prisma.contract.delete({
            where: { id },
        });

        revalidatePath("/internal/contracts");
        return { success: true, message: "Contract deleted successfully!" };

    } catch (error) {
        console.error("Error deleting contract:", error);
        throw new Error((error as Error).message || "Failed to delete contract.");
    }
}