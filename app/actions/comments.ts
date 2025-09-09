// app/actions/comments.ts
'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { CommentEntityType } from '@prisma/client';

export async function addComment(
  entityType: CommentEntityType,
  entityId: string,
  content: string
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session?.user?.organizationId) {
    throw new Error('Unauthorized');
  }

  // 1. Parse mentions from the content
  const mentionRegex = /@(\w+)/g;
  const mentionedUsernames = content.match(mentionRegex)?.map(m => m.substring(1)) || [];
  
  let mentionedUserIds = [];
  if (mentionedUsernames.length > 0) {
    const users = await prisma.user.findMany({
      where: {
        name: { in: mentionedUsernames },
        organizationId: session.user.organizationId,
      },
      select: { id: true },
    });
    mentionedUserIds = users.map(u => ({ id: u.id }));
  }

  try {
    const comment = await prisma.comment.create({
      data: {
        entityType,
        entityId,
        content,
        authorId: session.user.id,
        organizationId: session.user.organizationId,
        mentionedUsers: {
          connect: mentionedUserIds,
        },
      },
      include: {
        author: true, // Include author details in the return
      }
    });

    // Trigger WebSocket event
    try {
      await fetch(`${process.env.NEXT_PUBLIC_URL}/api/internal/socket/emit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: `comment:new:${entityType}:${entityId}`,
          data: comment,
        }),
      });
    } catch (e) {
      console.error("Failed to emit socket event", e);
    }

    return comment;
  } catch (error) {
    console.error('Failed to add comment:', error);
    throw new Error('Failed to add comment');
  }
}

export async function getComments(
  entityType: CommentEntityType,
  entityId: string
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    throw new Error('Unauthorized');
  }

  try {
    const comments = await prisma.comment.findMany({
      where: {
        entityType,
        entityId,
        organizationId: session.user.organizationId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    return comments;
  } catch (error) {
    console.error('Failed to get comments:', error);
    throw new Error('Failed to get comments');
  }
}
