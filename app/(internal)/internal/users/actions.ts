'use server'

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Prisma } from "@prisma/client";
import * as bcrypt from "bcryptjs";

// Define types for User and Role based on Prisma schema
export type User = Prisma.UserGetPayload<object>;
export type Role = Prisma.RoleGetPayload<object>;
export type UserWithRole = Prisma.UserGetPayload<{ include: { role: true } }>;

async function getCurrentUser() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id || !session.user?.organizationId || !session.user?.role) {
        return null;
    }
    return session.user;
}

// Helper to check if current user has permission to view users
async function hasPermissionToViewUsers() {
    const currentUser = await getCurrentUser();
    return currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'PROJECT_MANAGER');
}

export async function getUsersByOrganization(): Promise<UserWithRole[]> {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        throw new Error("Unauthorized: User not authenticated.");
    }

    if (!await hasPermissionToViewUsers()) {
        throw new Error("Unauthorized: You do not have permission to view users.");
    }

    try {
        const users = await prisma.user.findMany({
            where: {
                organizationId: currentUser.organizationId,
            },
            include: {
                role: true, // Include role details
            },
            orderBy: {
                createdAt: "asc",
            },
        });
        return users as UserWithRole[];
    } catch (error) {
        console.error("Failed to fetch users:", error);
        throw new Error("Failed to fetch users.");
    }
}

export async function getRoles() {
    // Roles are public for selection in forms, no specific auth needed here
    try {
        const roles = await prisma.role.findMany();
        return roles;
    } catch (error) {
        console.error("Failed to fetch roles:", error);
        throw new Error("Failed to fetch roles.");
    }
}

export async function createUser(prevState: { success: boolean; message: string; }, formData: FormData) {
    if (!await hasPermissionToViewUsers()) { // Changed from isAdmin()
        throw new Error("Unauthorized: Only admins can create users.");
    }
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        throw new Error("Unauthorized: User not authenticated.");
    }

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const roleId = formData.get("roleId") as string;

    if (!name || !email || !password || !roleId) {
        throw new Error("All fields are required.");
    }

    // Basic email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Invalid email format.");
    }

    // Check if email already exists in this organization
    const existingUser = await prisma.user.findFirst({
        where: {
            email: email,
            organizationId: currentUser.organizationId,
        },
    });

    if (existingUser) {
        throw new Error("User with this email already exists in your organization.");
    }

    const hashedPassword = await bcrypt.hash(password, 10); // Hash password

    try {
        await prisma.user.create({
            data: {
                name,
                email,
                passwordHash: hashedPassword,
                roleId,
                organizationId: currentUser.organizationId,
            },
        });
        revalidatePath("/internal/users");
        return { success: true, message: "User created successfully!" };
    } catch (error) {
        console.error("Failed to create user:", error);
        throw new Error("Failed to create user.");
    }
}

export async function updateUser(prevState: { success: boolean; message: string; }, formData: FormData) {
    if (!await hasPermissionToViewUsers()) { // Changed from isAdmin()
        throw new Error("Unauthorized: Only admins can update users.");
    }
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        throw new Error("Unauthorized: User not authenticated.");
    }

    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const roleId = formData.get("roleId") as string;
    const password = formData.get("password") as string | null; // Password is optional for update

    if (!id || !name || !email || !roleId) {
        throw new Error("All fields are required.");
    }

    // Basic email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Invalid email format.");
    }

    // Ensure the user being updated belongs to the current admin's organization
    const userToUpdate = await prisma.user.findUnique({
        where: { id: id },
        select: { organizationId: true },
    });

    if (!userToUpdate || userToUpdate.organizationId !== currentUser.organizationId) {
        throw new Error("Unauthorized: Cannot update user outside your organization.");
    }

    const updateData: Prisma.UserUpdateInput = {
        name,
        email,
        role: { connect: { id: roleId } },
    };

    if (password) {
        updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    try {
        await prisma.user.update({
            where: { id: id },
            data: updateData,
        });
        revalidatePath("/internal/users");
        return { success: true, message: "User updated successfully!" };
    } catch (error) {
        console.error("Failed to update user:", error);
        throw new Error("Failed to update user.");
    }
}

export async function deleteUser(id: string) {
    if (!await hasPermissionToViewUsers()) { // Changed from isAdmin()
        throw new Error("Unauthorized: Only admins can delete users.");
    }
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        throw new Error("Unauthorized: User not authenticated.");
    }

    // Prevent admin from deleting themselves
    if (id === currentUser.id) {
        throw new Error("Cannot delete your own admin account.");
    }

    // Ensure the user being deleted belongs to the current admin's organization
    const userToDelete = await prisma.user.findUnique({
        where: { id: id },
        select: { organizationId: true },
    });

    if (!userToDelete || userToDelete.organizationId !== currentUser.organizationId) {
        throw new Error("Unauthorized: Cannot delete user outside your organization.");
    }

    try {
        await prisma.user.delete({
            where: { id: id },
        });
        revalidatePath("/internal/users");
        return { success: true, message: "User deleted successfully!" };
    } catch (error) {
        console.error("Failed to delete user:", error);
        throw new Error("Failed to delete user.");
    }
}