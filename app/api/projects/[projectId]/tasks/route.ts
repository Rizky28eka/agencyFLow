import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { UserRole, Prisma } from "@prisma/client"; // Import Prisma

export async function GET(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { projectId } = params;
  const { searchParams } = new URL(req.url);
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'asc';
  const filter = searchParams.get('filter') || '';

  // Define a flexible where clause for security
  const whereClause: Prisma.TaskWhereInput = {
    projectId: projectId,
    project: {
      organizationId: session.user.organizationId,
      // If the user is a client, they can only access their own projects.
      ...(session.user.role === UserRole.CLIENT && {
        clientId: session.user.clientId,
      }),
    },
  };

  // Add filtering by title or description
  if (filter) {
    whereClause.OR = [
      { title: { contains: filter, mode: 'insensitive' } },
      { description: { contains: filter, mode: 'insensitive' } },
    ];
  }

  // Define orderBy clause
  const orderByClause: Prisma.TaskOrderByWithRelationInput = {};
  if (sortBy === 'dueDate') {
    orderByClause.dueDate = sortOrder as Prisma.SortOrder;
  } else if (sortBy === 'priority') {
    orderByClause.priority = sortOrder as Prisma.SortOrder;
  } else if (sortBy === 'status') {
    orderByClause.status = sortOrder as Prisma.SortOrder;
  } else if (sortBy === 'title') {
    orderByClause.title = sortOrder as Prisma.SortOrder;
  } else {
    orderByClause.createdAt = sortOrder as Prisma.SortOrder; // Default sort
  }

  try {
    // First, get the tasks for the project, ensuring user has access
    const tasks = await db.task.findMany({
      where: whereClause,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: orderByClause, // Apply dynamic orderBy
    });

    if (tasks.length === 0) {
      // Before returning empty, check if the project exists at all for the user
      // This helps differentiate between "no tasks" and "no access"
      const projectExists = await db.project.findFirst({ where: { id: projectId, organizationId: session.user.organizationId }});
      if (!projectExists) {
        return new NextResponse("Project not found or access denied", { status: 404 });
      }
    }

    // Then, get the sum of hours for all tasks in a single query
    const taskIds = tasks.map(task => task.id);
    const timeAggregates = await db.timeEntry.groupBy({
      by: ['taskId'],
      where: {
        taskId: {
          in: taskIds,
        },
      },
      _sum: {
        hours: true,
      },
    });

    // Create a map for easy lookup
    const hoursMap = timeAggregates.reduce((acc, curr) => {
      if (curr.taskId) {
        acc[curr.taskId] = curr._sum.hours || 0;
      }
      return acc;
    }, {} as Record<string, number>);

    // Merge the total hours into each task object
    const tasksWithTime = tasks.map(task => ({
      ...task,
      totalHoursLogged: hoursMap[task.id] || 0,
    }));

    return NextResponse.json(tasksWithTime);
  } catch (error) {
    console.error("[TASKS_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { projectId } = params;
  const values = await req.json();

  try {
    // Verify that the project belongs to the user's organization before creating a task
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        organizationId: session.user.organizationId,
      },
    });

    if (!project) {
      return new NextResponse("Project not found or access denied", {
        status: 404,
      });
    }

    const task = await db.task.create({
      data: {
        projectId: projectId,
        ...values,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("[TASKS_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
