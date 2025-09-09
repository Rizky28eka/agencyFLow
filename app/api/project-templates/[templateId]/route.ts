
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma as db } from "@/lib/db";

// GET a single project template
export async function GET(
  req: Request,
  { params }: { params: { templateId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const template = await db.projectTemplate.findUnique({
      where: {
        id: params.templateId,
        organizationId: session.user.organizationId,
      },
      include: {
        taskTemplates: {
          orderBy: {
            sortIndex: "asc",
          },
        },
      },
    });

    if (!template) {
      return new NextResponse("Not Found", { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("[PROJECT_TEMPLATE_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// PUT (update) a project template
export async function PUT(
  req: Request,
  { params }: { params: { templateId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { name, description } = await req.json();

  if (!name) {
    return new NextResponse("Bad Request: Name is required", { status: 400 });
  }

  try {
    // TODO: Implement upsert logic for tasks to handle creation, update, and deletion of task templates.
    const updatedTemplate = await db.projectTemplate.update({
      where: {
        id: params.templateId,
        organizationId: session.user.organizationId,
      },
      data: {
        name,
        description,
      },
    });

    return NextResponse.json(updatedTemplate);
  } catch (error) {
    console.error("[PROJECT_TEMPLATE_PUT]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// DELETE a project template
export async function DELETE(
  req: Request,
  { params }: { params: { templateId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    await db.projectTemplate.delete({
      where: {
        id: params.templateId,
        organizationId: session.user.organizationId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[PROJECT_TEMPLATE_DELETE]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
