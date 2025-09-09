"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { TaskStatus, Priority, Prisma } from "@prisma/client";
import { createNotification } from "../notifications/actions";
import { createActivity } from "../activities/actions"; // Import createActivity
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isManager } from "@/lib/permissions";

export type Task = Prisma.TaskGetPayload<object>;
export type User = Prisma.UserGetPayload<object>;

export type TaskWithRelations = Omit<Prisma.TaskGetPayload<{
  include: {
    project: {
      select: {
        name: true;
      };
    };
    assignee: {
      select: {
        name: true;
      };
    };
    // Add these for dependencies
    dependenciesOn: {
      include: {
        dependsOn: {
          select: {
            id: true;
            title: true;
          };
        };
      };
    };
    dependentTasks: {
      include: {
        dependent: {
          select: {
            id: true;
            title: true;
          };
        };
      };
    };
  };
}>, 'estimatedHours' | 'actualHours'> & {
  estimatedHours: number | null;
  actualHours: number | null;
};

export async function getProjectTasksForDependencies(projectId: string, excludeTaskId?: string) {
  const user = await getAuthenticatedUser();
  if (!isManager(user)) {
    throw new Error("Unauthorized: You do not have permission to view tasks.");
  }

  const whereClause: Prisma.TaskWhereInput = {
    projectId: projectId,
  };

  if (excludeTaskId) {
    whereClause.id = { not: excludeTaskId };
  }

  const tasks = await prisma.task.findMany({
    where: whereClause,
    select: {
      id: true,
      title: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return tasks;
}


async function getAuthenticatedUser() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id || !session.user.organizationId || !session.user.role) {
        throw new Error("Unauthorized: User not authenticated.");
    }
    const user = await prisma.user.findUnique({ 
        where: { id: session.user.id },
        include: { role: true }
    });
    if (!user) {
        throw new Error("Unauthorized: User not found.");
    }
    return user;
}

export async function getTasks() {
  const user = await getAuthenticatedUser();
  if (!isManager(user)) {
    throw new Error("Unauthorized: You do not have permission to view tasks.");
  }

  const tasks = await prisma.task.findMany({
    where: {
      project: {
        organizationId: user.organizationId,
      },
    },
    include: {
      project: {
        select: {
          name: true,
        },
      },
      assignee: {
        select: {
          name: true,
        },
      },
      dependenciesOn: {
        include: {
          dependsOn: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
      dependentTasks: {
        include: {
          dependent: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return tasks;
}

export async function addTask(data: {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: Date | null;
  startDate?: Date | null; // Add startDate
  estimatedHours?: number | null; // Add estimatedHours
  projectId: string;
  assigneeId?: string | null;
}): Promise<Task> {
  const user = await getAuthenticatedUser();
  if (!isManager(user)) {
    throw new Error("Unauthorized: Only managers can add tasks.");
  }

  const task = await prisma.task.create({
    data: {
      ...data,
      assigneeId: data.assigneeId === "" ? null : data.assigneeId,
      estimatedHours: data.estimatedHours, // Save estimatedHours
      startDate: data.startDate, // Save startDate
    },
  });

  const project = await prisma.project.findUnique({
    where: { id: data.projectId },
    select: { name: true, organizationId: true },
  });

  if (task.assigneeId && project) {
    await createNotification({
      recipientId: task.assigneeId,
      message: `You have been assigned a new task: "${task.title}" in project "${project.name}".`,
      link: `/internal/projects/${task.projectId}`,
      organizationId: project.organizationId,
    });
  }

  // Create activity
  await createActivity(
    data.projectId,
    "TASK_CREATED",
    `Task "${task.title}" was created.`
  );

  revalidatePath(`/internal/projects/${data.projectId}`);

  return task;
}

export async function updateTask(
  id: string,
  projectId: string,
  data: {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: Priority;
    dueDate?: Date | null;
    startDate?: Date | null;
    estimatedHours?: number | null; // Add estimatedHours
    assigneeId?: string | null;
  }
) {
  const user = await getAuthenticatedUser();
  if (!isManager(user)) {
    throw new Error("Unauthorized: Only managers can update tasks.");
  }

  const existingTask = await prisma.task.findUnique({
    where: { id },
    select: { assigneeId: true, title: true, projectId: true },
  });

  const updatedTask = await prisma.task.update({
    where: { id },
    data: {
      ...data,
      assigneeId: data.assigneeId === "" ? null : data.assigneeId,
      estimatedHours: data.estimatedHours, // Save estimatedHours
      startDate: data.startDate, // Save startDate
    },
  });

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { name: true, organizationId: true },
  });

  if (
    project &&
    updatedTask.assigneeId &&
    updatedTask.assigneeId !== existingTask?.assigneeId
  ) {
    await createNotification({
      recipientId: updatedTask.assigneeId,
      message: `You have been assigned task: "${updatedTask.title}" in project "${project.name}".`,
      link: `/internal/projects/${updatedTask.projectId}`,
      organizationId: project.organizationId,
    });
  }

  // Create activity
  await createActivity(
    projectId,
    "TASK_UPDATED",
    `Task "${updatedTask.title}" was updated.`
  );

  revalidatePath(`/internal/projects/${projectId}`);
}

export async function deleteTask(id: string, projectId: string) {
  const user = await getAuthenticatedUser();
  if (!isManager(user)) {
    throw new Error("Unauthorized: Only managers can delete tasks.");
  }

  const deletedTask = await prisma.task.delete({
    where: { id },
  });

  // Create activity
  await createActivity(
    projectId,
    "TASK_DELETED",
    `Task "${deletedTask.title}" was deleted.`
  );

  revalidatePath(`/internal/projects/${projectId}`);
}

export async function addTaskDependency(
  dependentId: string,
  dependsOnId: string
) {
  const user = await getAuthenticatedUser();
  if (!isManager(user)) {
    throw new Error("Unauthorized: Only managers can add task dependencies.");
  }

  // 1. Check for self-dependency
  if (dependentId === dependsOnId) {
    throw new Error("A task cannot depend on itself.");
  }

  // 2. Check for circular dependencies
  // This requires traversing the dependency graph.
  // For now, a placeholder. Will implement a helper function for this.
  const isCircular = await checkCircularDependency(dependentId, dependsOnId);
  if (isCircular) {
    throw new Error("Adding this dependency would create a circular dependency.");
  }

  await prisma.taskDependency.create({
    data: {
      dependentId,
      dependsOnId,
    },
  });
  // No specific project ID here, so revalidate a broader path or skip activity for now
  revalidatePath(`/internal/projects`);
}

// Helper function for circular dependency check
async function checkCircularDependency(startNodeId: string, targetNodeId: string): Promise<boolean> {
  const visited = new Set<string>();
  const queue: string[] = [targetNodeId]; // Start traversal from the dependency

  while (queue.length > 0) {
    const current = queue.shift();

    if (current === startNodeId) {
      return true; // Found a cycle
    }

    if (current && !visited.has(current)) {
      visited.add(current);

      // Find tasks that 'current' depends on
      const dependencies = await prisma.taskDependency.findMany({
        where: {
          dependentId: current,
        },
        select: {
          dependsOnId: true,
        },
      });

      for (const dep of dependencies) {
        queue.push(dep.dependsOnId);
      }
    }
  }
  return false; // No cycle found
}

export async function removeTaskDependency(dependentId: string, dependsOnId: string) {
  const user = await getAuthenticatedUser();
  if (!isManager(user)) {
    throw new Error("Unauthorized: Only managers can remove task dependencies.");
  }

  await prisma.taskDependency.deleteMany({ // Use deleteMany in case of multiple (though @@unique should prevent)
    where: {
      dependentId: dependentId,
      dependsOnId: dependsOnId,
    },
  });
  // No specific project ID here, so revalidate a broader path or skip activity for now
  revalidatePath(`/internal/projects`);
}
