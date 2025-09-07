'use server'

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as bcrypt from "bcryptjs";
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads');

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

export async function getUserProfile() {
  const user = await getAuthenticatedUser();

  const profile = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
    include: {
      role: true,
    },
  });
  return profile;
}

export async function updateUserCapacity(prevState: { success: boolean; message: string; }, formData: FormData) {
    const user = await getAuthenticatedUser();

    const dailyCapacityHours = formData.get("dailyCapacityHours") as string;

    if (!dailyCapacityHours) {
        return { success: false, message: "Daily capacity is required." };
    }

    const capacity = parseFloat(dailyCapacityHours);

    if (isNaN(capacity) || capacity < 0 || capacity > 24) {
        return { success: false, message: "Invalid capacity value. Please enter a number between 0 and 24." };
    }

    try {
        await prisma.user.update({
            where: {
                id: user.id,
            },
            data: {
                dailyCapacityHours: capacity,
            },
        });
        revalidatePath("/profile");
        revalidatePath("/settings");
        revalidatePath("/internal/resource-management");
        return { success: true, message: "Capacity updated successfully!" };
    } catch (error) {
        console.error(error);
        return { success: false, message: "Failed to update capacity." };
    }
}

export async function updateUserProfile(prevState: { success: boolean; message: string; }, formData: FormData) {
    const user = await getAuthenticatedUser();

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;

    try {
        await prisma.user.update({
            where: {
                id: user.id,
            },
            data: {
                name,
                email,
            },
        });
        revalidatePath("/profile");
        revalidatePath("/settings");
        return { success: true, message: "Profile updated successfully!" };
    } catch (error) {
        console.error(error);
        return { success: false, message: "Failed to update profile." };
    }
}

export async function updatePassword(prevState: { success: boolean; message: string; }, formData: FormData) {
    const user = await getAuthenticatedUser();

    const oldPassword = formData.get("oldPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmNewPassword = formData.get("confirmNewPassword") as string;

    if (!oldPassword || !newPassword || !confirmNewPassword) {
        return { success: false, message: "All fields are required." };
    }

    if (newPassword !== confirmNewPassword) {
        return { success: false, message: "New passwords do not match." };
    }

    if (newPassword.length < 6) { // Example: minimum password length
        return { success: false, message: "New password must be at least 6 characters long." };
    }

    const userRecord = await prisma.user.findUnique({
        where: { id: user.id },
        select: { passwordHash: true },
    });

    if (!userRecord || !userRecord.passwordHash) {
        return { success: false, message: "User not found or password not set." };
    }

    const isPasswordCorrect = await bcrypt.compare(oldPassword, userRecord.passwordHash);

    if (!isPasswordCorrect) {
        return { success: false, message: "Incorrect old password." };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    try {
        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: hashedPassword },
        });
        revalidatePath("/profile");
        revalidatePath("/settings");
        return { success: true, message: "Password updated successfully!" };
    } catch (error) {
        console.error(error);
        return { success: false, message: "Failed to update password." };
    }
}

export async function updateProfileImage(prevState: { success: boolean; message: string; }, formData: FormData) {
    const user = await getAuthenticatedUser();

    const file = formData.get('profileImage') as File;

    if (!file || file.size === 0) {
        return { success: false, message: "No image file provided." };
    }

    // Validate file type (optional, but recommended)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        return { success: false, message: "Invalid file type. Only JPEG, PNG, GIF, WEBP are allowed." };
    }

    try {
        // Ensure upload directory exists
        await fs.mkdir(UPLOAD_DIR, { recursive: true });

        // Generate unique file name
        const fileExtension = path.extname(file.name);
        const uniqueFileName = `${uuidv4()}${fileExtension}`;
        const filePath = path.join(UPLOAD_DIR, uniqueFileName);
        const fileUrl = `/uploads/${uniqueFileName}`; // URL to be stored in DB

        // Write file to disk
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await fs.writeFile(filePath, buffer);

        // Update user's profile image URL in the database
        await prisma.user.update({
            where: { id: user.id },
            data: { image: fileUrl },
        });

        revalidatePath("/profile");
        revalidatePath("/settings");
        return { success: true, message: "Profile image updated successfully!", imageUrl: fileUrl };
    } catch (error) {
        console.error(error);
        return { success: false, message: "Failed to upload profile image." };
    }
}
