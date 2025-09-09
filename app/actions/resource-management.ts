// app/actions/resource-management.ts
'use server';

import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { User } from '@prisma/client'; // Import User model

export async function getUsersWithCapacity(): Promise<User[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    throw new Error('Unauthorized or organization ID not found.');
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        organizationId: session.user.organizationId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        dailyCapacityHours: true,
        // Add other fields if needed for capacity planning visualization
      },
    });
    return users;
  } catch (error) {
    console.error("Failed to fetch users with capacity:", error);
    throw new Error("Failed to fetch users with capacity.");
  }
}

// Placeholder for future function to calculate allocated hours
// export async function getAllocatedHoursForUser(userId: string, startDate: Date, endDate: Date): Promise<number> {
//   // Logic to sum up hours from tasks or time entries
//   return 0;
// }

export async function getAllocatedHoursForUsers(startDate: Date, endDate: Date): Promise<Array<{ userId: string; allocatedHours: number }>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    throw new Error('Unauthorized or organization ID not found.');
  }

  try {
    const allocatedHours = await prisma.task.groupBy({
      by: ['assigneeId'],
      where: {
        projectId: {
          in: (await prisma.project.findMany({
            where: { organizationId: session.user.organizationId },
            select: { id: true },
          })).map(p => p.id),
        },
        dueDate: {
          gte: startDate,
          lte: endDate,
        },
        assigneeId: {
          not: null,
        },
      },
      _sum: {
        estimatedHours: true,
      },
    });

    return allocatedHours.map(entry => ({
      userId: entry.assigneeId!,
      allocatedHours: entry._sum.estimatedHours?.toNumber() || 0,
    }));
  } catch (error) {
    console.error("Failed to fetch allocated hours for users:", error);
    throw new Error("Failed to fetch allocated hours for users.");
  }
}