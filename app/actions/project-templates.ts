// app/actions/project-templates.ts
'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ProjectStatus, Task } from '@prisma/client';

export async function saveProjectAsTemplate(
  projectId: string,
  templateName: string,
  templateDescription: string
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.organizationId) {
    throw new Error('Unauthorized');
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
              include: {
                role: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      throw new Error('Project not found.');
    }

    const newTemplate = await prisma.projectTemplate.create({
      data: {
        name: templateName,
        description: templateDescription,
        organizationId: session.user.organizationId,
        taskTemplates: {
          create: project.tasks.map((task, index) => ({
            title: task.title,
            description: task.description,
            priority: task.priority,
            estimatedHours: task.estimatedHours,
            templateTaskId: task.id, // Save original task id
            assignedRole: task.assignee?.role.name,
            stageIndex: index,
          })),
        },
      },
    });

    return newTemplate;
  } catch (error: any) {
    console.error('Failed to save project as template:', error);
    throw new Error(`Failed to save project as template: ${error.message}`);
  }
}

export async function createProjectFromTemplate(
  templateId: string,
  newProjectName: string,
  newProjectClientId: string
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.organizationId) {
    throw new Error('Unauthorized');
  }

  try {
    const template = await prisma.projectTemplate.findUnique({
      where: {
        id: templateId,
        organizationId: session.user.organizationId,
      },
      include: {
        taskTemplates: true,
      },
    });

    if (!template) {
      throw new Error('Project template not found.');
    }

    const newProject = await prisma.project.create({
      data: {
        name: newProjectName,
        description: template.description,
        status: ProjectStatus.PLANNING, // Default status for new project
        organizationId: session.user.organizationId,
        clientId: newProjectClientId,
      },
    });

    const createdTasksMap = new Map<string, Task>();

    for (const taskTemplate of template.taskTemplates) {
      let assigneeId: string | undefined = undefined;
      if (taskTemplate.assignedRole) {
        const userWithRole = await prisma.user.findFirst({
          where: {
            organizationId: session.user.organizationId,
            role: {
              name: taskTemplate.assignedRole as any,
            },
          },
        });
        if (userWithRole) {
          assigneeId = userWithRole.id;
        }
      }

      const createdTask = await prisma.task.create({
        data: {
          title: taskTemplate.title,
          description: taskTemplate.description,
          priority: taskTemplate.priority,
          estimatedHours: taskTemplate.estimatedHours,
          projectId: newProject.id,
          assigneeId: assigneeId,
          organizationId: session.user.organizationId,
        },
      });

      if (taskTemplate.templateTaskId) {
        createdTasksMap.set(taskTemplate.templateTaskId, createdTask);
      }
    }

    // This is a simplified dependency resolution. A real implementation would need to handle complex dependency graphs.

    return newProject;
  } catch (error: any) {
    console.error('Failed to create project from template:', error);
    throw new Error(`Failed to create project from template: ${error.message}`);
  }
}
