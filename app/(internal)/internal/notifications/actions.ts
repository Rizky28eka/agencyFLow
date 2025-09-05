"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"

export async function createNotification(data: {
  recipientId: string;
  message: string;
  link?: string;
  organizationId: string;
}) {
  await prisma.notification.create({
    data,
  });
  // Revalidate paths where notifications might be displayed (e.g., main layout)
  // For now, we don't have a specific notification display area, so revalidate a common path.
  revalidatePath("/"); // Revalidate root path for now
}

// You might also want a function to get notifications for a user
export async function getNotifications(recipientId: string, organizationId: string, limit: number = 10) {
  return await prisma.notification.findMany({
    where: {
      recipientId,
      organizationId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });
}

// And to mark as read
export async function markNotificationAsRead(id: string) {
  await prisma.notification.update({
    where: { id },
    data: { read: true },
  });
  revalidatePath("/"); // Revalidate root path
}
