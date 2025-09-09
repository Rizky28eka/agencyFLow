// app/actions/dashboard.ts
'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { DashboardWidget as DashboardWidgetType } from '@prisma/client';

export async function getDashboardLayout(): Promise<(DashboardLayout & { widgets: DashboardWidgetType[] }) | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    const layout = await prisma.dashboardLayout.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        widgets: true,
      },
    });
    return layout;
  } catch (error: unknown) {
    console.error('Failed to get dashboard layout:', error);
    throw new Error(`Failed to get dashboard layout: ${(error as Error).message}`);
  }
}

export async function saveDashboardLayout(layout: ReactGridLayout.Layout[], widgets: Omit<DashboardWidgetType, "layoutId" | "createdAt" | "updatedAt">[]): Promise<DashboardLayout & { widgets: DashboardWidgetType[] }> {
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
        widgets: {
          deleteMany: {},
          create: widgets.map(widget => ({
            id: widget.id,
            type: widget.type,
            config: widget.config,
          })),
        },
      },
      create: {
        userId: session.user.id,
        layout: layout,
        widgets: {
          create: widgets.map(widget => ({
            id: widget.id,
            type: widget.type,
            config: widget.config,
          })),
        },
      },
      include: {
        widgets: true,
      },
    });
    return updatedLayout;
  } catch (error: unknown) {
    console.error('Failed to save dashboard layout:', error);
    throw new Error(`Failed to save dashboard layout: ${(error as Error).message}`);
  }
}
