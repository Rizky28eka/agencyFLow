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
