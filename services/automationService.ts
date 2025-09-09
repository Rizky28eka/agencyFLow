import { prisma } from '@/lib/db';
import { AutomationAction } from '@prisma/client';
import { Queue } from 'bullmq';

export async function enqueueEvent(queue: Queue, eventType: string, payload: Record<string, unknown>) {
  await queue.add(eventType, payload);
}

export async function evaluateRulesForEvent(eventType: string, payload:  Record<string, unknown>) {
  const rules = await prisma.automationRule.findMany({
    where: {
      trigger: eventType,
      organizationId: payload.organizationId as string,
    },
    include: {
      actions: true,
    },
  });

  for (const rule of rules) {
    // In a real-world scenario, you'd evaluate conditions here
    // For now, we'll just execute the actions
    for (const action of rule.actions) {
      await executeAction(action, payload);
    }
  }
}

async function executeAction(action: AutomationAction, payload: Record<string, unknown>) {
  switch (action.type) {
    case 'ASSIGN_USER':
      // Implementation for assigning a user
      console.log('Assigning user', payload);
      break;
    case 'SEND_NOTIFICATION':
      // Implementation for sending a notification
      console.log('Sending notification', payload);
      break;
    case 'UPDATE_TASK_STATUS':
      // Implementation for updating task status
      console.log('Updating task status', payload);
      break;
    case 'CREATE_SUBTASK':
      // Implementation for creating a subtask
      console.log('Creating subtask', payload);
      break;
    default:
      console.warn(`Unknown action type: ${action.type}`);
  }
}