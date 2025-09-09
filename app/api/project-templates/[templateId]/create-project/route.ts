
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { ProjectStatus } from "@prisma/client";

// POST to create a new project from a template
export async function POST(
  req: Request,
  { params }: { params: { templateId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { projectName, clientId, startDate, endDate } = await req.json();

  if (!projectName || !clientId) {
    return new NextResponse("Bad Request: Project name and client are required", {
      status: 400,
    });
  }

  try {
    // 1. Find the template
    const template = await db.projectTemplate.findUnique({
      where: {
        id: params.templateId,
        organizationId: session.user.organizationId,
      },
      include: {
        taskTemplates: true,
      },
    });

    if (!template) {
      return new NextResponse("Template not found", { status: 404 });
    }

    // 2. Create the new project
    const newProject = await db.project.create({
      data: {
        name: projectName,
        clientId: clientId,
        status: ProjectStatus.PLANNING,
        organizationId: session.user.organizationId,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        description: template.description, // copy description from template
        tasks: {
          create: template.taskTemplates.map((taskTemplate) => ({
            title: taskTemplate.title,
            description: taskTemplate.description,
            priority: taskTemplate.priority,
            estimatedHours: taskTemplate.estimatedHours,
            status: "TO_DO", // Default status
          })),
        },
      },
      include: {
        tasks: true,
      },
    });

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error("[PROJECT_FROM_TEMPLATE_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
