'use server'

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";

async function getCurrentUser() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
        return null;
    }
    return session.user;
}

export async function getUserProfile() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: currentUser.id,
    },
    include: {
      role: true,
    },
  });
  return user;
}

export async function updateUserProfile(prevState: { success: boolean; message: string; }, formData: FormData) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return { success: false, message: "User not authenticated." };
    }

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;

    try {
        await prisma.user.update({
            where: {
                id: currentUser.id,
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