// app/actions/dashboard.ts
'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function getDashboardLayout() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    const layout = await prisma.dashboardLayout.findUnique({
      where: {
        userId: session.user.id,
      },
    });
    return layout;
  } catch (error) {
    console.error('Failed to get dashboard layout:', error);
    throw new Error('Failed to get dashboard layout');
  }
}

export async function saveDashboardLayout(layout: any) { // Use 'any' for Json type for now
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    const updatedLayout = await prisma.dashboardLayout.upsert({
      where: {
        userId: session.user.id,
      },
      update: {
        layout: layout,
      },
      create: {
        userId: session.user.id,
        layout: layout,
      },
    });
    return updatedLayout;
  } catch (error) {
    console.error('Failed to save dashboard layout:', error);
    throw new Error('Failed to save dashboard layout');
  }
}
