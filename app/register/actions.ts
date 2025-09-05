'use server'

import { prisma } from "@/lib/db";
import * as bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";

export async function registerUser(prevState: { success: boolean; message: string; }, formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!name || !email || !password) {
        return { success: false, message: "All fields are required." };
    }

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return { success: false, message: "User with this email already exists." };
        }

        const passwordHash = await bcrypt.hash(password, 10);

        // Find the first organization to assign the user to.
        // In a real multi-tenant app, this would be handled differently (e.g., via invitation).
        const organization = await prisma.organization.findFirst();
        if (!organization) {
            return { success: false, message: "No organization found to assign the user to." };
        }

        // Find or create the MEMBER role
        let memberRole = await prisma.role.findUnique({
            where: { name: UserRole.MEMBER },
        });

        if (!memberRole) {
            memberRole = await prisma.role.create({
                data: { name: UserRole.MEMBER },
            });
        }

        await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                organizationId: organization.id,
                roleId: memberRole.id,
            },
        });

        return { success: true, message: "Registration successful! You can now log in." };

    } catch (error) {
        console.error(error);
        return { success: false, message: "An unexpected error occurred." };
    }
}