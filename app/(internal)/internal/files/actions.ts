'use server'

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { createActivity } from "../activities/actions"; // Import createActivity

async function getCurrentUser() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
        return null;
    }
    return session.user;
}

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// Ensure upload directory exists
async function ensureUploadDir() {
    try {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
    } catch (error) {
        console.error("Failed to create upload directory:", error);
        throw new Error("Failed to prepare upload directory.");
    }
}

export async function uploadFile(prevState: { success: boolean; message: string; }, formData: FormData) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return { success: false, message: "User not authenticated." };
    }

    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;

    if (!file || !projectId) {
        return { success: false, message: "File and Project ID are required." };
    }

    if (file.size === 0) {
        return { success: false, message: "Uploaded file is empty." };
    }

    await ensureUploadDir();

    try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const fileExtension = path.extname(file.name);
        const uniqueFileName = `${uuidv4()}${fileExtension}`;
        const filePath = path.join(UPLOAD_DIR, uniqueFileName);
        const fileUrl = `/uploads/${uniqueFileName}`;

        await fs.writeFile(filePath, buffer);

        const newFile = await prisma.file.create({
            data: {
                name: file.name,
                url: fileUrl,
                fileType: file.type,
                size: file.size,
                projectId: projectId,
                uploadedById: currentUser.id,
                organizationId: currentUser.organizationId,
            },
        });

        // Create activity
        await createActivity(
            projectId,
            "FILE_UPLOADED",
            `Uploaded file "${newFile.name}".`
        );

        revalidatePath(`/internal/projects/${projectId}`);
        return { success: true, message: "File uploaded successfully!" };
    } catch (error) {
        console.error("Error uploading file:", error);
        return { success: false, message: "Failed to upload file." };
    }
}

export async function deleteFile(fileId: string, projectId: string) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return { success: false, message: "User not authenticated." };
    }

    try {
        const fileRecord = await prisma.file.findUnique({
            where: { id: fileId },
        });

        if (!fileRecord) {
            return { success: false, message: "File not found." };
        }

        // Delete file from file system
        const filePath = path.join(process.cwd(), 'public', fileRecord.url);
        await fs.unlink(filePath);

        // Delete record from database
        const deletedFile = await prisma.file.delete({
            where: { id: fileId },
        });

        // Create activity
        await createActivity(
            projectId,
            "FILE_DELETED",
            `Deleted file "${deletedFile.name}".`
        );

        revalidatePath(`/internal/projects/${projectId}`);
        return { success: true, message: "File deleted successfully!" };
    } catch (error) {
        console.error("Error deleting file:", error);
        return { success: false, message: "Failed to delete file." };
    }
}

export async function getProjectFiles(projectId: string) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return [];
    }

    try {
        const files = await prisma.file.findMany({
            where: {
                projectId: projectId,
                organizationId: currentUser.organizationId,
            },
            include: {
                uploadedBy: {
                    select: { name: true },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        return files;
    } catch (error) {
        console.error("Error fetching project files:", error);
        return [];
    }
}
