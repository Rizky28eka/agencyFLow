import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { TaskStatus, ProjectStatus, UserRole } from "@prisma/client";

export async function PUT(
  req: Request,
  { params }: { params: { projectId: string; taskId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { projectId, taskId } = params;
  const values = await req.json();

  try {
    // First, verify the project belongs to the user's organization
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        organizationId: session.user.organizationId,
      },
    });

    if (!project) {
      return new NextResponse("Project not found or access denied", { status: 404 });
    }

    // Now, update the task
    const updatedTask = await db.task.update({
      where: {
        id: taskId,
        projectId: projectId, // Ensure the task is within the correct project
      },
      data: {
        ...values,
      },
    });

    // AUTOMATION: If the updated task is now DONE, check if all other tasks are also done.
    if (values.status === TaskStatus.DONE) {
      const openTasksCount = await db.task.count({
        where: {
          projectId: projectId,
          NOT: {
            status: TaskStatus.DONE,
          },
        },
      });

      // If there are no other open tasks, mark the project as COMPLETED.
      if (openTasksCount === 0) {
        await db.project.update({
          where: { id: projectId },
          data: { status: ProjectStatus.COMPLETED },
        });
      }
    }

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("[TASK_PUT]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { projectId: string; taskId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { projectId, taskId } = params;

  try {
    // Use deleteMany with a comprehensive where clause for security
    // This ensures we only delete the task if it matches the project and the user's organization
    const deleteResult = await db.task.deleteMany({
      where: {
        id: taskId,
        projectId: projectId,
        project: {
          organizationId: session.user.organizationId,
        },
      },
    });

    // deleteMany does not throw an error if no record is found, it returns a count.
    if (deleteResult.count === 0) {
      return new NextResponse("Task not found or access denied", { status: 404 });
    }

    return new NextResponse(null, { status: 204 }); // 204 No Content is a standard response for a successful deletion
  } catch (error) {
    console.error("[TASK_DELETE]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
