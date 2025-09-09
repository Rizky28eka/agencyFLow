// app/actions/project-views.ts
'use server';

import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Project, Task, TaskDependency } from '@prisma/client'; // Import TaskDependency

interface ProjectViewData { // Renamed interface
  project: Project;
  tasks: (Task & {
    dependenciesOn: TaskDependency[]; // Include dependencies
  })[];
}

export async function getProjectViewData(projectId: string): Promise<ProjectViewData | null> { // Renamed function
  const session = await getServerSession(authOptions);

  if (!session?.user?.organizationId) {
    throw new Error('Unauthorized or organization ID not found.');
  }

  try {
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
        organizationId: session.user.organizationId,
      },
      include: {
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
              },
            },
            dependenciesOn: true,
          },
        },
      },
    });

    if (!project) {
      return null;
    }

    // Manually serialize the data to ensure it's safe for client components
    const serializableProject = {
      ...project,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      startDate: project.startDate?.toISOString() || null,
      endDate: project.endDate?.toISOString() || null,
    };

    const serializableTasks = project.tasks.map(task => ({
      ...task,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      startDate: task.startDate?.toISOString() || null,
      dueDate: task.dueDate?.toISOString() || null,
    }));

    return {
      project: serializableProject,
      tasks: serializableTasks,
    } as ProjectViewData; // Cast as any to avoid type mismatch with original Prisma types
  } catch (error) {
    console.error("Failed to fetch project view data:", error); // Updated error message
    throw new Error("Failed to fetch project view data."); // Updated error message
  }
}
