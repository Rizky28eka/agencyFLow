import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { endOfMonth, startOfMonth, parseISO } from "date-fns";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get("month"); // e.g., "2023-10-01"
  
  const targetDate = monthParam ? parseISO(monthParam) : new Date();
  const startDate = startOfMonth(targetDate);
  const endDate = endOfMonth(targetDate);

  try {
    const usersWithTasks = await db.user.findMany({
      where: {
        organizationId: session.user.organizationId,
        role: {
          name: {
            in: ["ADMIN", "PROJECT_MANAGER", "MEMBER"],
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        dailyCapacityHours: true,
        assignedTasks: {
          where: {
            status: { 
                notIn: ['DONE', 'CANCELLED']
            },
            OR: [
              { startDate: { gte: startDate, lte: endDate } },
              { dueDate: { gte: startDate, lte: endDate } },
              { AND: [{ startDate: { lte: startDate } }, { dueDate: { gte: endDate } }] },
            ],
          },
          select: {
            id: true,
            title: true,
            estimatedHours: true,
            startDate: true,
            dueDate: true,
            project: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // The chart component expects only users with tasks, so we filter them here.
    const activeUsers = usersWithTasks.filter(user => user.assignedTasks.length > 0);

    return NextResponse.json(activeUsers);
  } catch (error) {
    console.error("[WORKLOAD_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
