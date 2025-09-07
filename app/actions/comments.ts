// app/actions/comments.ts
'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
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

  try {
    const comment = await prisma.comment.create({
      data: {
        entityType,
        entityId,
        content,
        authorId: session.user.id,
        organizationId: session.user.organizationId,
      },
    });
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
