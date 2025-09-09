
import { prisma as db } from "@/lib/db";
import { TriggerType, ActionType, Task, TaskStatus, UserRole } from "@prisma/client";

interface TaskStatusChangedConfig {
  fromStatus?: TaskStatus;
  toStatus?: TaskStatus;
}

// The main event data structure
interface AutomationEvent {
  organizationId: string;
  type: TriggerType;
  payload: any;
}

// Type guard for payload
interface TaskStatusChangedPayload {
  task: Task;
  oldStatus: TaskStatus;
}

async function executeAction(action: { type: ActionType; config: any }, task: Task) {
  console.log(`Executing action: ${action.type} for task ${task.id}`);

  switch (action.type) {
    case ActionType.CHANGE_TASK_STATUS:
      const { status } = action.config;
      if (status) {
        await db.task.update({
          where: { id: task.id },
          data: { status: status },
        });
        console.log(`  -> Changed task ${task.id} status to ${status}`);
      }
      break;

    case ActionType.ASSIGN_USER:
      const { assigneeId } = action.config;
       if (assigneeId === 'PROJECT_MANAGER') {
        const project = await db.project.findUnique({
            where: { id: task.projectId },
            include: {
                organization: {
                    include: {
                        users: {
                            where: { role: { name: UserRole.PROJECT_MANAGER } },
                            take: 1 // Get one project manager
                        }
                    }
                }
            }
        });
        const projectManager = project?.organization?.users[0];
        if (projectManager) {
            await db.task.update({
                where: { id: task.id },
                data: { assigneeId: projectManager.id },
            });
            console.log(`  -> Assigned task ${task.id} to Project Manager ${projectManager.name}`);
        } else {
            console.log(`  -> No Project Manager found for organization. Task ${task.id} not assigned.`);
        }
      } else if (assigneeId) {
        await db.task.update({
          where: { id: task.id },
          data: { assigneeId: assigneeId },
        });
        console.log(`  -> Assigned task ${task.id} to user ${assigneeId}`);
      }
      break;

    case ActionType.SEND_NOTIFICATION:
      // Notification logic would go here.
      // This is highly dependent on the notification system.
      console.log(`  -> Would send notification (logic to be implemented)`);
      break;

    case ActionType.SEND_SLACK_MESSAGE:
        const { message: slackMessageTemplate } = action.config;
        if (slackMessageTemplate) {
            // Basic variable substitution (can be expanded)
            const finalMessage = slackMessageTemplate
                .replace('{task.title}', task.title)
                .replace('{task.status}', task.status)
                .replace('{task.id}', task.id);
            // Add more variables as needed, e.g., project.name, assignee.name

            await sendSlackNotification(finalMessage);
            console.log(`  -> Sent Slack message: ${finalMessage}`);
        }
        break;

    default:
      console.warn(`Unknown action type: ${action.type}`);
  }
}

export async function processAutomations(event: AutomationEvent) {
  const { organizationId, type, payload } = event;

  const rules = await db.automationRule.findMany({
    where: {
      organizationId: organizationId,
      isEnabled: true,
      trigger: {
        type: type,
      },
    },
    include: {
      trigger: true,
      actions: true,
    },
  });

  if (rules.length === 0) {
    return; // No rules for this event type
  }

  console.log(`Found ${rules.length} rules for event type ${type}`);

  for (const rule of rules) {
    let isTriggered = false;

    // Check if the trigger conditions are met
    if (type === TriggerType.TASK_STATUS_CHANGED) {
      const { task, oldStatus } = payload as TaskStatusChangedPayload;
      const { fromStatus, toStatus } = rule.trigger.config as TaskStatusChangedConfig;

      if (
        (!fromStatus || fromStatus === oldStatus) &&
        (!toStatus || toStatus === task.status)
      ) {
        isTriggered = true;
      }
    }

    // If triggered, execute all actions for that rule
    if (isTriggered) {
      console.log(`Rule "${rule.name}" triggered for task ${payload.task.id}`);
      for (const action of rule.actions) {
        await executeAction(action, payload.task);
      }
    }
  }
}
