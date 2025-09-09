import { Prisma } from '@prisma/client';
import { enqueueEvent } from '@/services/automationService';
import { prisma } from '@/lib/db'; // Import prisma instance
import { automationQueue } from '@/lib/queue';

console.log('Registering Prisma middleware for automation.');

export const automationMiddleware: Prisma.Middleware = async (params, next) => {
  // Detect Task status changes
  if (params.model === 'Task' && params.action === 'update') {
    const oldTask = await prisma.task.findUnique({
      where: params.args.where,
      select: { status: true, projectId: true, organizationId: true, id: true, title: true },
    });

    const result = await next(params);

    if (oldTask && result && oldTask.status !== result.status) {
      // Enqueue TASK_STATUS_CHANGED event
      await enqueueEvent(automationQueue, 'TASK_STATUS_CHANGED', {
        organizationId: oldTask.organizationId,
        task: {
          id: oldTask.id,
          title: oldTask.title,
          projectId: oldTask.projectId,
          oldStatus: oldTask.status,
          newStatus: result.status,
        },
      });
    }
    return result;
  }

  // Add more event triggers here (e.g., 'Task' 'create', 'Comment' 'create')

  return next(params);
};
