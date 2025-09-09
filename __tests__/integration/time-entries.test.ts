
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/db';
import { addTimeEntry, getTimeEntriesByTask } from '@/app/actions/time-entries';
import { getServerSession } from 'next-auth/next';

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

describe('Time Entries API Integration Test', () => {
  const organizationId = 'test-org-id-time';
  const userId = 'test-user-id-time';
  const clientId = 'test-client-id-time';
  const projectId = 'test-project-id-time';
  const taskId = 'test-task-id-time';

  beforeEach(async () => {
    vi.clearAllMocks();

    (getServerSession as vi.Mock).mockResolvedValue({
      user: {
        id: userId,
        organizationId: organizationId,
      },
    });

    await prisma.timeEntry.deleteMany({ where: { userId } });
    await prisma.task.deleteMany({ where: { id: taskId } });
    await prisma.project.deleteMany({ where: { id: projectId } });
    await prisma.client.deleteMany({ where: { id: clientId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.organization.deleteMany({ where: { id: organizationId } });

    await prisma.organization.create({ data: { id: organizationId, name: 'Test Org' } });
    await prisma.client.create({ data: { id: clientId, name: 'Test Client', email: 'client-time@test.com', organizationId } });
    await prisma.user.create({
      data: {
        id: userId,
        email: 'user-time@test.com',
        passwordHash: 'hash',
        organizationId,
        role: { create: { name: 'ADMIN' } },
      },
    });
    const project = await prisma.project.create({
      data: {
        id: projectId,
        name: 'Test Project',
        organizationId,
        clientId,
      },
    });
    await prisma.task.create({
      data: {
        id: taskId,
        title: 'Test Task',
        projectId: project.id,
        organizationId,
      },
    });
  });

  it('should add a time entry and retrieve it', async () => {
    const now = new Date();
    const timeEntryData = {
      taskId,
      projectId,
      startAt: now,
      endAt: new Date(now.getTime() + 1000 * 60 * 60),
      seconds: 3600,
      description: 'Test time entry',
    };

    const newTimeEntry = await addTimeEntry(timeEntryData);

    expect(newTimeEntry).toBeDefined();
    expect(newTimeEntry.description).toBe('Test time entry');

    const timeEntries = await getTimeEntriesByTask(taskId);
    expect(timeEntries.length).toBe(1);
    expect(timeEntries[0].id).toBe(newTimeEntry.id);
  });
});
