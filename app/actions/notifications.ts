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

    const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;

    if (!slackWebhookUrl) {
        console.warn("SLACK_WEBHOOK_URL is not set. Skipping Slack notification.");
        return { success: false, message: "Slack webhook URL not configured." };
    }

    try {
        const response = await fetch(slackWebhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: message }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to send Slack notification: ${response.status} - ${errorText}`);
            return { success: false, message: `Failed to send Slack notification: ${errorText}` };
        }

        console.log(`[SLACK NOTIFICATION - from ${session.user.name || 'Unknown User'}] ${message}`);
        return { success: true, message: "Slack notification sent successfully." };
    } catch (error) {
        console.error("Error sending Slack notification:", error);
        return { success: false, message: "An unexpected error occurred while sending Slack notification." };
    }
}
