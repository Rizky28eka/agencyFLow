'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { FileApprovalStatus, UserRole } from '@prisma/client';

export async function requestFileApproval(fileId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session?.user?.organizationId) {
    throw new Error('Unauthorized');
  }

  // Ensure the user is a team member (ADMIN, PROJECT_MANAGER, MEMBER)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { role: true },
  });

  const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.MEMBER];
  if (!user || !allowedRoles.includes(user.role.name)) {
    throw new Error('Forbidden: Only team members can request file approval.');
  }

  try {
    const file = await prisma.file.update({
      where: { id: fileId, organizationId: session.user.organizationId },
      data: {
        approvalStatus: FileApprovalStatus.PENDING,
        approvedById: null, // Reset approval info when requesting new approval
        approvedAt: null,
        clientFeedback: null,
      },
    });
    // TODO: Implement notification to the client associated with the project
    return file;
  } catch (error) {
    console.error('Failed to request file approval:', error);
    throw new Error('Failed to request file approval');
  }
}

export async function updateFileApprovalStatus(
  fileId: string,
  status: FileApprovalStatus,
  feedback?: string
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session?.user?.organizationId) {
    throw new Error('Unauthorized');
  }

  // Ensure the user is a CLIENT
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { role: true },
  });

  if (!user || user.role.name !== UserRole.CLIENT) {
    throw new Error('Forbidden: Only clients can update file approval status.');
  }

  try {
    // Verify that the client is associated with the project of the file
    const file = await prisma.file.findUnique({
      where: { id: fileId, organizationId: session.user.organizationId },
      select: {
        project: {
          select: {
            clientId: true,
          },
        },
      },
    });

    if (!file || file.project.clientId !== user.clientId) {
      throw new Error('Forbidden: You are not authorized to approve this file.');
    }

    const updatedFile = await prisma.file.update({
      where: { id: fileId },
      data: {
        approvalStatus: status,
        approvedById: session.user.id,
        approvedAt: new Date(),
        clientFeedback: status === FileApprovalStatus.REVISION_NEEDED ? feedback : null,
      },
    });
    // TODO: Implement notification to the team member who uploaded the file
    return updatedFile;
  } catch (error) {
    console.error('Failed to update file approval status:', error);
    throw new Error('Failed to update file approval status');
  }
}
