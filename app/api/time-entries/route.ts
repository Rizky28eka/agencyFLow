
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('taskId');
  const projectId = searchParams.get('projectId');
  const userId = searchParams.get('userId');

  const where: { organizationId: string, taskId?: string, projectId?: string, userId?: string } = { organizationId: session.user.organizationId as string };
  if (taskId) where.taskId = taskId;
  if (projectId) where.projectId = projectId;
  if (userId) where.userId = userId;

  const timeEntries = await prisma.timeEntry.findMany({ where });

  return NextResponse.json(timeEntries);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { taskId, projectId, startAt, endAt, seconds, description } = body;

  if (!taskId || !projectId || !startAt || !seconds) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const timeEntry = await prisma.timeEntry.create({
    data: {
      taskId,
      projectId,
      userId: session.user.id,
      startAt,
      endAt,
      seconds,
      description,
    },
  });

  return NextResponse.json(timeEntry, { status: 201 });
}
