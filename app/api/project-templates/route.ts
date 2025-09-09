
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma as db } from "@/lib/db";

interface TaskTemplate {
  title: string;
  description: string | null;
  priority: string;
  estimatedHours: number | null;
}

// GET all project templates for the organization
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const templates = await db.projectTemplate.findMany({
      where: {
        organizationId: session.user.organizationId,
      },
      include: {
        _count: {
          select: { taskTemplates: true },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
    return NextResponse.json(templates);
  } catch (error) {
    console.error("[PROJECT_TEMPLATES_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// POST a new project template
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { name, description, tasks } = await req.json();

  if (!name) {
    return new NextResponse("Bad Request: Name is required", { status: 400 });
  }

  try {
    const newTemplate = await db.projectTemplate.create({
      data: {
        name,
        description,
        organizationId: session.user.organizationId,
        taskTemplates: {
          create: tasks.map((task: TaskTemplate) => ({
            title: task.title,
            description: task.description,
            priority: task.priority,
            estimatedHours: task.estimatedHours,
          })),
        },
      },
      include: {
        taskTemplates: true,
      },
    });
    return NextResponse.json(newTemplate, { status: 201 });
  } catch (error) {
    console.error("[PROJECT_TEMPLATES_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
