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

        let organizationId: string = '';
        let roleId: string = '';

        // Ensure an organization exists for client registration
        const existingOrganization = await prisma.organization.findFirst();

        if (!existingOrganization) {
            return { success: false, message: "No organization found. Please contact an administrator to set up the initial organization." };
        }

        organizationId = existingOrganization.id;

        let clientRole = await prisma.role.findUnique({
            where: { name: UserRole.CLIENT },
        });

        if (!clientRole) {
            clientRole = await prisma.role.create({
                data: { name: UserRole.CLIENT },
            });
        }
        roleId = clientRole.id; // Assign CLIENT role

        // Ensure a client is associated with a client record
        let clientRecord = await prisma.client.findUnique({
            where: { email },
        });

        if (!clientRecord) {
            clientRecord = await prisma.client.create({
                data: {
                    name,
                    email,
                    organizationId,
                },
            });
        }

        await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                organizationId,
                roleId,
                clientId: clientRecord.id, // Link user to client record
            },
        });

        return { success: true, message: "Registration successful! You can now log in." };

    } catch (error) {
        console.error(error);
        return { success: false, message: "An unexpected error occurred." };
    }
}