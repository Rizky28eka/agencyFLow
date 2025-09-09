import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createProjectFromTemplate } from "@/app/actions/project-templates";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.organizationId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { projectName, clientId } = body; // startDate and endDate are not needed by createProjectFromTemplate

    if (!projectName || !clientId) {
      return new NextResponse("Project name and client ID are required", { status: 400 });
    }

    const newProject = await createProjectFromTemplate(
      params.id, // templateId
      projectName,
      clientId
    );

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error("[CREATE_PROJECT_FROM_TEMPLATE_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}