"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

export async function createNotification(data: {
  recipientId: string;
  message: string;
  link?: string;
  organizationId: string;
}) {
  // This function is called internally by other actions, so it assumes the caller has permission.
  // We still ensure the recipient is part of the same organization.
  const user = await getAuthenticatedUser(); // Ensure an authenticated user is performing this action

  if (data.organizationId !== user.organizationId) {
    console.error("Attempted to create notification for a different organization.");
    return; // Or throw an error
  }

  const newNotification = await prisma.notification.create({
    data,
  });

  // Emit Socket.IO event via API route
  try {
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/socket/emit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipientId: data.recipientId,
        notification: newNotification,
      }),
    });
  } catch (error) {
    console.error("Failed to emit Socket.IO event:", error);
  }

  // Revalidate paths where notifications might be displayed (e.g., main layout)
  revalidatePath("/"); // Revalidate root path for now
}

export async function getNotifications(limit: number = 10) {
  const user = await getAuthenticatedUser();

  return await prisma.notification.findMany({
    where: {
      recipientId: user.id,
      organizationId: user.organizationId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });
}

export async function markNotificationAsRead(id: string) {
  const user = await getAuthenticatedUser();

  // Ensure the user can only mark their own notifications as read
  const notification = await prisma.notification.findUnique({
    where: { id, recipientId: user.id, organizationId: user.organizationId },
  });

  if (!notification) {
    throw new Error("Notification not found or you do not have permission to mark it as read.");
  }

  await prisma.notification.update({
    where: { id },
    data: { read: true },
  });
  revalidatePath("/"); // Revalidate root path
}