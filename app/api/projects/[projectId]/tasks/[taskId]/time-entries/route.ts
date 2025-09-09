import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma as db } from "@/lib/db";

// GET all time entries for a specific task
export async function GET(
  req: Request,
  { params }: { params: { projectId: string; taskId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { taskId } = params;

  try {
    // Security: Ensure the task belongs to a project in the user's organization
    const task = await db.task.findFirst({
        where: {
            id: taskId,
            project: {
                organizationId: session.user.organizationId
            }
        }
    });

    if (!task) {
        return new NextResponse("Task not found or access denied", { status: 404 });
    }

    const timeEntries = await db.timeEntry.findMany({
      where: {
        taskId: taskId,
      },
      include: {
        user: { // Include user to show who logged the time
            select: {
                id: true,
                name: true,
                image: true
            }
        }
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(timeEntries);
  } catch (error) {
    console.error("[TIME_ENTRIES_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// POST a new time entry to a task
export async function POST(
  req: Request,
  { params }: { params: { projectId: string; taskId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { projectId, taskId } = params;
  const values = await req.json();

  try {
    // Security: Verify the task exists and belongs to the user's organization
    const task = await db.task.findFirst({
      where: {
        id: taskId,
        projectId: projectId,
        project: {
          organizationId: session.user.organizationId,
        },
      },
    });

    if (!task) {
      return new NextResponse("Task not found or access denied", { status: 404 });
    }

    const newTimeEntry = await db.timeEntry.create({
      data: {
        hours: values.hours,
        date: values.date || new Date(),
        description: values.description,
        taskId: taskId,
        projectId: projectId,
        userId: session.user.id, // Associate with the logged-in user
      },
    });

    return NextResponse.json(newTimeEntry, { status: 201 });
  } catch (error) {
    console.error("[TIME_ENTRIES_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
