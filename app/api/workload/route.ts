import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const users = await prisma.user.findMany({
    where: { organizationId: session.user.organizationId },
    select: {
      id: true,
      name: true,
      dailyCapacityHours: true,
      assignedTasks: {
        where: {
          dueDate: {
            gte: startDate ? new Date(startDate) : undefined,
            lte: endDate ? new Date(endDate) : undefined,
          },
        },
        select: {
          estimatedHours: true,
        },
      },
      timeEntries: {
        where: {
          startAt: {
            gte: startDate ? new Date(startDate) : undefined,
            lte: endDate ? new Date(endDate) : undefined,
          },
        },
        select: {
          seconds: true,
        },
      },
    },
  });

  const workloadData = users.map(user => {
    const totalEstimatedHours = user.assignedTasks.reduce((sum, task) => sum + (task.estimatedHours?.toNumber() || 0), 0);
    const totalLoggedHours = user.timeEntries.reduce((sum, entry) => sum + (entry.seconds / 3600), 0);

    return {
      userId: user.id,
      userName: user.name,
      dailyCapacityHours: user.dailyCapacityHours?.toNumber() || 0,
      totalEstimatedHours,
      totalLoggedHours,
    };
  });

  return NextResponse.json(workloadData);
}