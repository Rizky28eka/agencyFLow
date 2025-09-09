
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/db';
import { saveProjectAsTemplate, createProjectFromTemplate } from '@/app/actions/project-templates';
import { TaskStatus, UserRole } from '@prisma/client';
import { getServerSession } from 'next-auth/next';

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

describe('Project Templates Integration Test', () => {
  const organizationId = 'test-org-id-templates';
  const userId = 'test-user-id-templates';
  const clientId = 'test-client-id-templates';
  const projectId = 'test-project-id-templates';

  beforeEach(async () => {
    vi.clearAllMocks();

    (getServerSession as vi.Mock).mockResolvedValue({
      user: {
        id: userId,
        organizationId: organizationId,
      },
    });

    await prisma.projectTemplate.deleteMany({ where: { organizationId } });
    await prisma.project.deleteMany({ where: { id: projectId } });
    await prisma.client.deleteMany({ where: { id: clientId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.organization.deleteMany({ where: { id: organizationId } });

    await prisma.organization.create({ data: { id: organizationId, name: 'Test Org' } });
    await prisma.client.create({ data: { id: clientId, name: 'Test Client', email: 'client@test.com', organizationId } });
    await prisma.user.create({
      data: {
        id: userId,
        email: 'user@test.com',
        passwordHash: 'hash',
        organizationId,
        role: { create: { name: UserRole.ADMIN } },
      },
    });
    await prisma.project.create({
      data: {
        id: projectId,
        name: 'Test Project',
        organizationId,
        clientId,
        tasks: {
          create: [
            { title: 'Task 1', status: TaskStatus.TO_DO, organizationId },
            { title: 'Task 2', status: TaskStatus.IN_PROGRESS, organizationId },
          ],
        },
      },
    });
  });

  it('should save a project as a template and then create a new project from it', async () => {
    const template = await saveProjectAsTemplate(projectId, 'Test Template', 'Test Description');

    expect(template).toBeDefined();
    expect(template.name).toBe('Test Template');

    const newProject = await createProjectFromTemplate(template.id, 'New Project From Template', clientId);

    expect(newProject).toBeDefined();
    expect(newProject.name).toBe('New Project From Template');

    const tasks = await prisma.task.findMany({ where: { projectId: newProject.id } });
    expect(tasks.length).toBe(2);
  });
});
