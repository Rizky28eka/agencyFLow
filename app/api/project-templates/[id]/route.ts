import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { UserRole, Priority } from "@prisma/client";

// GET a single project template by ID
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const template = await db.projectTemplate.findUnique({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
      include: {
        taskTemplates: true, // Include task templates for editing
      },
    });

    if (!template) {
      return new NextResponse("Template not found", { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("[PROJECT_TEMPLATES_ID_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// PUT (update) a project template by ID
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (![UserRole.ADMIN, UserRole.PROJECT_MANAGER].includes(session.user.role as UserRole)) {
    return new NextResponse("Forbidden: You do not have permission to update templates.", { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, description, tasks } = body;

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    // Update template details
    const updatedTemplate = await db.projectTemplate.update({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
      data: {
        name,
        description,
      },
    });

    // Handle task templates: delete existing and create new ones
    // This is a simple approach. For more complex scenarios,
    // you might want to compare and update existing tasks.
    await db.taskTemplate.deleteMany({
      where: {
        projectTemplateId: params.id,
      },
    });

    if (tasks && tasks.length > 0) {
      await db.taskTemplate.createMany({
        data: tasks.map((task: any) => ({
          projectTemplateId: params.id,
          title: task.title,
          description: task.description,
          priority: task.priority as Priority,
          estimatedHours: task.estimatedHours,
        })),
      });
    }

    return NextResponse.json(updatedTemplate);
  } catch (error) {
    console.error("[PROJECT_TEMPLATES_ID_PUT]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// DELETE a project template by ID
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (![UserRole.ADMIN, UserRole.PROJECT_MANAGER].includes(session.user.role as UserRole)) {
    return new NextResponse("Forbidden: You do not have permission to delete templates.", { status: 403 });
  }

  try {
    await db.projectTemplate.delete({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[PROJECT_TEMPLATES_ID_DELETE]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}