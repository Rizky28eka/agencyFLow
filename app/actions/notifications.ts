// app/actions/notifications.ts
'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { NotificationType } from '@prisma/client';

export async function createNotification(
  recipientId: string,
  message: string,
  link: string,
  type: NotificationType = NotificationType.GENERAL
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    throw new Error('Unauthorized');
  }

  try {
    const notification = await prisma.notification.create({
      data: {
        recipientId,
        message,
        link,
        type,
        organizationId: session.user.organizationId,
      },
    });
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    throw new Error('Failed to create notification');
  }
}

export async function sendSlackNotification(message: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id || !session.user.organizationId) {
        throw new Error("Unauthorized: User not authenticated.");
    }

    // For demonstration, we'll just log the message to the console.
    // In a real scenario, you'd make an API call to Slack.
    console.log(`[SLACK NOTIFICATION - from ${session.user.name || 'Unknown User'}] ${message}`);

    // You might want to add more robust error handling and logging here.
    return { success: true, message: "Slack notification simulated successfully." };
}
