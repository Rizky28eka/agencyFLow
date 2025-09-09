
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDashboardLayout, saveDashboardLayout } from '@/app/actions/dashboard';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { DashboardWidget as DashboardWidgetType } from '@prisma/client';

vi.mock('@/lib/db', () => ({
  prisma: {
    dashboardLayout: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

describe('Dashboard Widgets Actions', () => {
  const userId = 'test-user-id';

  beforeEach(() => {
    vi.clearAllMocks();
    (getServerSession as vi.Mock).mockResolvedValue({
      user: {
        id: userId,
      },
    });
  });

  it('should get dashboard layout', async () => {
    const mockLayout = {
      id: 'layout1',
      userId,
      layout: [{ i: 'widget1', x: 0, y: 0, w: 6, h: 4 }],
      widgets: [
        { id: 'widget1', type: 'section-cards', config: {}, layoutId: 'layout1', createdAt: new Date(), updatedAt: new Date() },
      ],
    };
    (prisma.dashboardLayout.findUnique as vi.Mock).mockResolvedValue(mockLayout);

    const layout = await getDashboardLayout();
    expect(layout).toEqual(mockLayout);
    expect(prisma.dashboardLayout.findUnique).toHaveBeenCalledWith({
      where: { userId },
      include: { widgets: true },
    });
  });

  it('should save dashboard layout', async () => {
    const newLayout = [{ i: 'widget1', x: 0, y: 0, w: 6, h: 4 }];
    const newWidgets: Omit<DashboardWidgetType, "layoutId" | "createdAt" | "updatedAt">[] = [
      { id: 'widget1', type: 'chart-area-interactive', config: {} },
    ];
    const savedLayout = {
      id: 'layout1',
      userId,
      layout: newLayout,
      widgets: newWidgets.map(w => ({ ...w, layoutId: 'layout1', createdAt: new Date(), updatedAt: new Date() })),
    };

    (prisma.dashboardLayout.upsert as vi.Mock).mockResolvedValue(savedLayout);

    const result = await saveDashboardLayout(newLayout, newWidgets);
    expect(result).toEqual(savedLayout);
    expect(prisma.dashboardLayout.upsert).toHaveBeenCalledWith({
      where: { userId },
      update: {
        layout: newLayout,
        widgets: {
          deleteMany: {},
          create: newWidgets.map(widget => ({
            id: widget.id,
            type: widget.type,
            config: widget.config,
          })),
        },
      },
      create: {
        userId,
        layout: newLayout,
        widgets: {
          create: newWidgets.map(widget => ({
            id: widget.id,
            type: widget.type,
            config: widget.config,
          })),
        },
      },
      include: { widgets: true },
    });
  });

  it('should throw error if unauthorized', async () => {
    (getServerSession as vi.Mock).mockResolvedValue(null);

    await expect(getDashboardLayout()).rejects.toThrow('Unauthorized');
    await expect(saveDashboardLayout([], [])).rejects.toThrow('Unauthorized');
  });
});
