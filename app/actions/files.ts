'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { FileApprovalStatus, UserRole, NotificationType } from '@prisma/client';
import { createNotification } from './notifications';

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

        // Implement notification to the client associated with the project
        const project = await prisma.project.findUnique({
          where: { id: file.projectId },
          select: { clientId: true },
        });

        if (project?.clientId) {
          const clientUser = await prisma.user.findFirst({
            where: {
              clientId: project.clientId,
              role: { name: UserRole.CLIENT },
              organizationId: session.user.organizationId,
            },
          });

          if (clientUser) {
            await createNotification(
              clientUser.id,
              `${session.user.name} has requested your approval for file '${file.name}'.`,
              `/client/projects/${file.projectId}/files/${file.id}`, // Assuming a file detail page
              NotificationType.FILE
            );
          }
        }
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

        // Implement notification to the team member who uploaded the file
        const uploaderUser = await prisma.user.findUnique({
          where: { id: updatedFile.uploadedById },
        });

        if (uploaderUser) {
          await createNotification(
            uploaderUser.id,
            `${session.user.name} has ${status === FileApprovalStatus.APPROVED ? 'approved' : 'requested revisions for'} file '${updatedFile.name}'.`,
            `/internal/projects/${updatedFile.projectId}/files/${updatedFile.id}`, // Assuming a file detail page
            NotificationType.FILE
          );
        }
        return updatedFile;
      } catch (error) {
    console.error('Failed to update file approval status:', error);
    throw new Error('Failed to update file approval status');
  }
}

export async function getProjectFiles(projectId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session?.user?.organizationId) {
    throw new Error('Unauthorized');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { role: true },
  });

  const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.MEMBER, UserRole.CLIENT];
  if (!user || !allowedRoles.includes(user.role.name)) {
    throw new Error('Forbidden: You do not have permission to view these files.');
  }

  try {
    // First, verify the project exists and belongs to the user's organization.
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
        organizationId: session.user.organizationId,
      },
    });

    if (!project) {
      throw new Error("Project not found or you don't have permission to access it.");
    }

    // Role-based access control
    const userRole = user.role.name;
    if (userRole === UserRole.CLIENT) {
      if (project.clientId !== user.clientId) {
        throw new Error("Forbidden: You do not have permission to access this project's files.");
      }
    } else if (userRole === UserRole.PROJECT_MANAGER || userRole === UserRole.MEMBER) {
      const taskCount = await prisma.task.count({
        where: { projectId: projectId },
      });

      if (taskCount > 0) {
        const assignment = await prisma.task.findFirst({
          where: {
            projectId: projectId,
            assigneeId: user.id,
          },
        });
        if (!assignment) {
          throw new Error("Forbidden: You are not assigned to this project.");
        }
      }
    }

    const files = await prisma.file.findMany({
      where: {
        projectId: projectId,
        organizationId: session.user.organizationId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    return files;
  } catch (error) {
    console.error('Failed to get project files:', error);
    throw new Error('Failed to get project files');
  }
}


