
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/db';
import { requestFileApproval, updateFileApprovalStatus } from '@/app/actions/files';
import { getServerSession } from 'next-auth/next';
import { FileApprovalStatus, UserRole } from '@prisma/client';
import * as notifications from '@/app/actions/notifications';

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/app/actions/notifications', () => ({
  createNotification: vi.fn(),
}));

describe('File Approval Workflow Integration Test', () => {
  const organizationId = 'test-org-id-file-approval';
  const adminUserId = 'test-admin-user-id';
  const clientUserId = 'test-client-user-id';
  const projectId = 'test-project-id-file-approval';
  const clientId = 'test-client-id-file-approval';
  let fileId: string;

  beforeEach(async () => {
    vi.clearAllMocks();

    await prisma.file.deleteMany({ where: { projectId } });
    await prisma.project.deleteMany({ where: { id: projectId } });
    await prisma.client.deleteMany({ where: { id: clientId } });
    await prisma.user.deleteMany({ where: { OR: [{ id: adminUserId }, { id: clientUserId }] } });
    await prisma.organization.deleteMany({ where: { id: organizationId } });

    await prisma.organization.create({ data: { id: organizationId, name: 'Test Org' } });
    await prisma.client.create({ data: { id: clientId, name: 'Test Client', email: 'client-file@test.com', organizationId } });

    await prisma.user.create({
      data: {
        id: adminUserId,
        email: 'admin-file@test.com',
        passwordHash: 'hash',
        organizationId,
        role: { create: { name: UserRole.ADMIN } },
      },
    });

    await prisma.user.create({
      data: {
        id: clientUserId,
        email: 'client-user-file@test.com',
        passwordHash: 'hash',
        organizationId,
        role: { create: { name: UserRole.CLIENT } },
        clientId: clientId,
      },
    });

    const project = await prisma.project.create({
      data: {
        id: projectId,
        name: 'File Approval Project',
        organizationId,
        clientId,
      },
    });

    const file = await prisma.file.create({
      data: {
        name: 'document.pdf',
        url: 'http://example.com/doc.pdf',
        projectId: project.id,
        uploadedById: adminUserId,
        organizationId,
        approvalStatus: FileApprovalStatus.NONE,
      },
    });
    fileId = file.id;
  });

  it('should allow an admin to request file approval', async () => {
    (getServerSession as vi.Mock).mockResolvedValue({
      user: {
        id: adminUserId,
        organizationId: organizationId,
        role: { name: UserRole.ADMIN },
      },
    });

    await requestFileApproval(fileId, projectId);

    const updatedFile = await prisma.file.findUnique({ where: { id: fileId } });
    expect(updatedFile?.approvalStatus).toBe(FileApprovalStatus.PENDING);
    expect(notifications.createNotification).toHaveBeenCalledTimes(1);
    expect(notifications.createNotification).toHaveBeenCalledWith(
      clientUserId,
      expect.stringContaining('requested your approval'),
      expect.any(String),
      expect.any(String)
    );
  });

  it('should allow a client to approve a file', async () => {
    // First, set the file to PENDING status
    await prisma.file.update({
      where: { id: fileId },
      data: { approvalStatus: FileApprovalStatus.PENDING },
    });

    (getServerSession as vi.Mock).mockResolvedValue({
      user: {
        id: clientUserId,
        organizationId: organizationId,
        role: { name: UserRole.CLIENT },
        clientId: clientId,
      },
    });

    await updateFileApprovalStatus(fileId, FileApprovalStatus.APPROVED);

    const updatedFile = await prisma.file.findUnique({ where: { id: fileId } });
    expect(updatedFile?.approvalStatus).toBe(FileApprovalStatus.APPROVED);
    expect(updatedFile?.approvedById).toBe(clientUserId);
    expect(updatedFile?.approvedAt).toBeInstanceOf(Date);
    expect(notifications.createNotification).toHaveBeenCalledTimes(1);
    expect(notifications.createNotification).toHaveBeenCalledWith(
      adminUserId,
      expect.stringContaining('approved file'),
      expect.any(String),
      expect.any(String)
    );
  });

  it('should allow a client to request revision for a file', async () => {
    // First, set the file to PENDING status
    await prisma.file.update({
      where: { id: fileId },
      data: { approvalStatus: FileApprovalStatus.PENDING },
    });

    (getServerSession as vi.Mock).mockResolvedValue({
      user: {
        id: clientUserId,
        organizationId: organizationId,
        role: { name: UserRole.CLIENT },
        clientId: clientId,
      },
    });

    const feedback = 'Needs more details in section 3.';
    await updateFileApprovalStatus(fileId, FileApprovalStatus.REVISION_NEEDED, feedback);

    const updatedFile = await prisma.file.findUnique({ where: { id: fileId } });
    expect(updatedFile?.approvalStatus).toBe(FileApprovalStatus.REVISION_NEEDED);
    expect(updatedFile?.approvedById).toBe(clientUserId);
    expect(updatedFile?.approvedAt).toBeInstanceOf(Date);
    expect(updatedFile?.clientFeedback).toBe(feedback);
    expect(notifications.createNotification).toHaveBeenCalledTimes(1);
    expect(notifications.createNotification).toHaveBeenCalledWith(
      adminUserId,
      expect.stringContaining('requested revisions for file'),
      expect.any(String),
      expect.any(String)
    );
  });

  it('should prevent non-team members from requesting approval', async () => {
    (getServerSession as vi.Mock).mockResolvedValue({
      user: {
        id: clientUserId,
        organizationId: organizationId,
        role: { name: UserRole.CLIENT },
      },
    });

    await expect(requestFileApproval(fileId, projectId)).rejects.toThrow(
      'Forbidden: Only team members can request file approval.'
    );
  });

  it('should prevent non-clients from updating approval status', async () => {
    (getServerSession as vi.Mock).mockResolvedValue({
      user: {
        id: adminUserId,
        organizationId: organizationId,
        role: { name: UserRole.ADMIN },
      },
    });

    await expect(updateFileApprovalStatus(fileId, FileApprovalStatus.APPROVED)).rejects.toThrow(
      'Forbidden: Only clients can update file approval status.'
    );
  });
});
