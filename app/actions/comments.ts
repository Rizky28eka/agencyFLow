'use server';

import { prisma } from '@/lib/db';
import { Comment, CommentEntityType, User, NotificationType } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export type CommentWithAuthorAndMentions = Comment & {
  author: User;
  mentionedUsers: User[];
};

export async function createComment(
  entityType: CommentEntityType,
  entityId: string,
  content: string
): Promise<CommentWithAuthorAndMentions> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.organizationId) {
    throw new Error('Unauthorized');
  }

  // Parse mentions from content (e.g., @[Eka](userId))
  const mentionRegex = /@\[(.*?)\]\((.*?)\)/g;
  const mentions: { id: string; display: string }[] = [];
  let match;
  let processedContent = content;

  while ((match = mentionRegex.exec(content)) !== null) {
    const [fullMatch, displayName, userId] = match;
    mentions.push({ id: userId, display: displayName });
    // Replace mention with a styled span for display
    processedContent = processedContent.replace(fullMatch, `<span class="text-blue-500 font-semibold">@${displayName}</span>`);
  }

  const newComment = await prisma.comment.create({
    data: {
      entityType,
      entityId,
      content: processedContent,
      authorId: session.user.id,
      organizationId: session.user.organizationId,
      mentionedUsers: {
        connect: mentions.map(m => ({ id: m.id })),
      },
    },
    include: {
      author: true,
      mentionedUsers: true,
    },
  });

  // Create notifications for mentioned users
  for (const mention of mentions) {
    await prisma.notification.create({
      data: {
        recipientId: mention.id,
        message: `${session.user.name || session.user.email} mentioned you in a comment on a ${entityType.toLowerCase()}`,
        type: NotificationType.GENERAL, // Or a more specific type if available
        link: `/internal/${entityType.toLowerCase()}s/${entityId}`, // Adjust link based on entityType
        organizationId: session.user.organizationId,
      },
    });
  }

  revalidatePath(`/internal/${entityType.toLowerCase()}s/${entityId}`);
  return newComment;
}

export async function getCommentsByEntity(
  entityType: CommentEntityType,
  entityId: string
): Promise<CommentWithAuthorAndMentions[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.organizationId) {
    throw new Error('Unauthorized');
  }

  const comments = await prisma.comment.findMany({
    where: {
      entityType,
      entityId,
      organizationId: session.user.organizationId,
    },
    include: {
      author: true,
      mentionedUsers: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return comments;
}