
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/workload/route';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { Decimal } from '@prisma/client/runtime/library';

vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

describe('Workload API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getServerSession as vi.Mock).mockResolvedValue({
      user: {
        id: 'user1',
        organizationId: 'org1',
      },
    });
  });

  it('should return workload data for users', async () => {
    (prisma.user.findMany as vi.Mock).mockResolvedValue([
      {
        id: 'user1',
        name: 'User One',
        dailyCapacityHours: new Decimal(8),
        assignedTasks: [
          { estimatedHours: new Decimal(4) },
          { estimatedHours: new Decimal(2) },
        ],
        timeEntries: [
          { seconds: 3600 }, // 1 hour
          { seconds: 1800 }, // 0.5 hours
        ],
      },
      {
        id: 'user2',
        name: 'User Two',
        dailyCapacityHours: new Decimal(7),
        assignedTasks: [
          { estimatedHours: new Decimal(5) },
        ],
        timeEntries: [
          { seconds: 7200 }, // 2 hours
        ],
      },
    ]);

    const request = new Request('http://localhost/api/workload');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([
      {
        userId: 'user1',
        userName: 'User One',
        dailyCapacityHours: 8,
        totalEstimatedHours: 6,
        totalLoggedHours: 1.5,
      },
      {
        userId: 'user2',
        userName: 'User Two',
        dailyCapacityHours: 7,
        totalEstimatedHours: 5,
        totalLoggedHours: 2,
      },
    ]);
  });

  it('should return 401 if unauthorized', async () => {
    (getServerSession as vi.Mock).mockResolvedValue(null);

    const request = new Request('http://localhost/api/workload');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Unauthorized' });
  });
});
