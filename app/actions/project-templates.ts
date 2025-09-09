// app/actions/project-templates.ts
'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ProjectStatus } from '@prisma/client';

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
            dependenciesOn: {
              include: {
                dependsOn: true, // Include the actual task it depends on
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
          create: project.tasks.map((task) => ({
            title: task.title,
            description: task.description,
            priority: task.priority,
            estimatedHours: task.estimatedHours,
            status: task.status, // Store original task status
            // Store dependencies as an array of task titles
            dependencies: task.dependenciesOn.length > 0
              ? task.dependenciesOn.map(dep => dep.dependsOn.title)
              : [],
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

    // Create tasks first to get their IDs
    const createdTasks = await Promise.all(
      template.taskTemplates.map(async (taskTemplate) => {
        return prisma.task.create({
          data: {
            title: taskTemplate.title,
            description: taskTemplate.description,
            priority: taskTemplate.priority,
            estimatedHours: taskTemplate.estimatedHours,
            status: taskTemplate.status, // Use status from template
            projectId: newProject.id,
          },
        });
      })
    );

    // Now, create dependencies based on the created tasks
    for (const taskTemplate of template.taskTemplates) {
      if (taskTemplate.dependencies && Array.isArray(taskTemplate.dependencies) && taskTemplate.dependencies.length > 0) {
        const dependentTask = createdTasks.find(t => t.title === taskTemplate.title);
        if (dependentTask) {
          for (const depTitle of taskTemplate.dependencies) {
            const dependsOnTask = createdTasks.find(t => t.title === depTitle);
            if (dependsOnTask) {
              await prisma.taskDependency.create({
                data: {
                  dependentId: dependentTask.id,
                  dependsOnId: dependsOnTask.id,
                },
              });
            } else {
              console.warn(`Dependent task with title '${depTitle}' not found for '${taskTemplate.title}'. Dependency not created.`);
            }
          }
        }
      }
    }

    return newProject;
  } catch (error: any) {
    console.error('Failed to create project from template:', error);
    throw new Error(`Failed to create project from template: ${error.message}`);
  }
}
