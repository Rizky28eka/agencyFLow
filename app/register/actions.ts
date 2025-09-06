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

    // Basic password strength check (e.g., minimum length)
    if (password.length < 8) {
        return { success: false, message: "Password must be at least 8 characters long." };
    }

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return { success: false, message: "User with this email already exists." };
        }

        const passwordHash = await bcrypt.hash(password, 10);

        let organizationId: string;
        let roleId: string;

        // Check if any organization exists
        const existingOrganization = await prisma.organization.findFirst();

        if (!existingOrganization) {
            // If no organization exists, create a new one and assign the user as ADMIN
            const newOrganization = await prisma.organization.create({
                data: {
                    name: `${name}'s Organization`, // Default name for the first organization
                },
            });
            organizationId = newOrganization.id;

            let adminRole = await prisma.role.findUnique({
                where: { name: UserRole.ADMIN },
            });

            if (!adminRole) {
                adminRole = await prisma.role.create({
                    data: { name: UserRole.ADMIN },
                });
            }
            roleId = adminRole.id;

        } else {
            // If organizations exist, assign to the first one found and MEMBER role
            organizationId = existingOrganization.id;

            let memberRole = await prisma.role.findUnique({
                where: { name: UserRole.MEMBER },
            });

            if (!memberRole) {
                memberRole = await prisma.role.create({
                    data: { name: UserRole.MEMBER },
                });
            }
            roleId = memberRole.id;
        }

        await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                organizationId,
                roleId,
            },
        });

        return { success: true, message: "Registration successful! You can now log in." };

    } catch (error) {
        console.error(error);
        return { success: false, message: "An unexpected error occurred." };
    }
}
