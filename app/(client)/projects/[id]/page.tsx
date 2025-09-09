
import { prisma as db } from "@/lib/db";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { CommentEntityType } from "@/types/db-models";
import CommentSection from "@/components/comments/comment-section";
import { ClientTaskView } from "@/components/client-dashboard/ClientTaskView";
import { ProjectCalendarView } from "@/components/project-calendar-view";
import { GanttChart } from "@/components/gantt-chart";
import { ClientFileSection } from "@/components/files/client-file-section";

async function getProjectForClient(projectId: string, userId: string) {
  const project = await db.project.findFirst({
    where: {
      id: projectId,
      client: {
        users: {
          some: { id: userId },
        },
      },
    },
    include: {
      files: {
        include: {
          uploadedBy: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
  return project;
}

export default async function ClientProjectDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return notFound();
  }

  const project = await getProjectForClient(params.id, session.user.id);

  if (!project) {
    return notFound();
  }

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">{project.name}</h1>
        <p className="text-muted-foreground">Here you can see the latest progress on your project.</p>
      </div>

      {/* Client-facing Task View */}
      <ClientTaskView projectId={project.id} />

      {/* File Approval Section */}
      <div className="mt-8">
        <ClientFileSection initialFiles={project.files} />
      </div>

      {/* Project-level comments remain for communication */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Project-Level Comments</h2>
        <CommentSection entityType={CommentEntityType.PROJECT} entityId={project.id} />
      </div>

      {/* Project Calendar View */}
      <div className="mt-8">
        <ProjectCalendarView projectId={project.id} />
      </div>

      {/* Project Gantt Chart */}
      <div className="mt-8">
        <GanttChart projectId={project.id} />
      </div>
    </div>
  );
}
