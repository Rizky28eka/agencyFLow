import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/db'; // The actual prisma client with middleware
import { enqueueEvent } from '@/services/automationService'; // The function to mock
import { TaskStatus } from '@prisma/client';

// Mock the enqueueEvent function
vi.mock('@/services/automationService', () => ({
  enqueueEvent: vi.fn(),
  automationQueue: {
    add: vi.fn(),
    on: vi.fn(),
  }, // Mock automationQueue.on as well
}));

describe('Prisma Middleware Integration Test', () => {
  // Use a unique ID for the task to avoid conflicts with other tests
  const taskId = 'test-task-id-middleware';
  const projectId = 'test-project-id-middleware';
  const organizationId = 'test-org-id-middleware';

  beforeEach(async () => {
    vi.clearAllMocks();
    // Clean up and create a fresh task for each test
    await prisma.task.deleteMany({ where: { id: taskId } });
    await prisma.project.deleteMany({ where: { id: projectId } });
    await prisma.client.deleteMany({ where: { organizationId: organizationId } }); // Delete clients associated with the org
    await prisma.organization.deleteMany({ where: { id: organizationId } });

    await prisma.organization.create({ data: { id: organizationId, name: 'Test Org' } });
    await prisma.client.create({ data: { id: 'test-client-id', name: 'Test Client', email: 'test@client.com', organizationId: organizationId } });
    await prisma.project.create({
      data: {
        id: projectId,
        name: 'Test Project',
        organizationId: organizationId,
        clientId: 'test-client-id',
      },
    });
    await prisma.task.create({
      data: {
        id: taskId,
        title: 'Initial Task',
        status: TaskStatus.TO_DO,
        projectId: projectId,
        organizationId: organizationId,
      },
    });
  });

  it('should enqueue TASK_STATUS_CHANGED event when task status is updated', async () => {
    const newStatus = TaskStatus.IN_PROGRESS;

    await prisma.task.update({
      where: { id: taskId },
      data: { status: newStatus },
    });

    expect(enqueueEvent).toHaveBeenCalledTimes(1);
    expect(enqueueEvent).toHaveBeenCalledWith('TASK_STATUS_CHANGED', {
      organizationId: organizationId,
      task: {
        id: taskId,
        title: 'Initial Task',
        projectId: projectId,
        oldStatus: TaskStatus.TO_DO,
        newStatus: newStatus,
      },
    });
  });

  it('should not enqueue event if task status does not change', async () => {
    await prisma.task.update({
      where: { id: taskId },
      data: { title: 'Updated Title' }, // Change a non-status field
    });

    expect(enqueueEvent).not.toHaveBeenCalled();
  });
});
