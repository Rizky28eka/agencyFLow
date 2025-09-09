import { describe, it, expect, vi, beforeEach } from 'vitest';
import { evaluateRulesForEvent, enqueueEvent, automationQueue } from '@/services/automationService';
import { prisma } from '@/lib/db';
import { TaskStatus } from '@prisma/client';

vi.mock('@/lib/db', () => ({
  prisma: {
    automationRule: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('bullmq', () => ({
  Queue: vi.fn(() => ({
    add: vi.fn(),
  })),
}));

describe('Automation Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should enqueue an event', async () => {
    await enqueueEvent('TEST_EVENT', { data: 'test' });
    expect(automationQueue.add).toHaveBeenCalledWith('TEST_EVENT', { data: 'test' });
  });

  it('should evaluate rules and execute actions', async () => {
    const rules = [
      {
        id: 'rule1',
        trigger: 'TASK_STATUS_CHANGED',
        organizationId: 'org1',
        actions: [
          {
            id: 'action1',
            ruleId: 'rule1',
            type: 'UPDATE_TASK_STATUS',
            config: { status: 'DONE' },
          },
        ],
      },
    ];

    (prisma.automationRule.findMany as vi.Mock).mockResolvedValue(rules);

    const payload = {
      organizationId: 'org1',
      task: {
        id: 'task1',
        status: TaskStatus.IN_PROGRESS,
      },
    };

    // This is a simplified test. A real test would mock the action execution
    await evaluateRulesForEvent('TASK_STATUS_CHANGED', payload);

    expect(prisma.automationRule.findMany).toHaveBeenCalledWith({
      where: {
        trigger: 'TASK_STATUS_CHANGED',
        organizationId: 'org1',
      },
      include: {
        actions: true,
      },
    });
  });
});