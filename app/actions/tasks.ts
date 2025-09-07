'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function getMyTasks() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    const tasks = await prisma.task.findMany({
      where: {
        assigneeId: session.user.id,
      },
      include: {
        project: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });
    return tasks;
  } catch (error) {
    console.error('Failed to get tasks:', error);
    throw new Error('Failed to get tasks');
  }
}
