"use server";

import { prisma } from "@/lib/db";
import { endOfMonth, startOfMonth } from "date-fns";

export async function getTeamWorkload(date?: Date) {
  const targetDate = date || new Date();
  const startDate = startOfMonth(targetDate);
  const endDate = endOfMonth(targetDate);

  try {
    const usersWithTasks = await prisma.user.findMany({
      where: {
        role: {
          name: {
            in: ["ADMIN", "PROJECT_MANAGER", "MEMBER"],
          },
        },
      },
      include: {
        assignedTasks: {
          where: {
            OR: [
              {
                // Tasks that start within the month
                startDate: {
                  gte: startDate,
                  lte: endDate,
                },
              },
              {
                // Tasks that end within the month
                dueDate: {
                  gte: startDate,
                  lte: endDate,
                },
              },
              {
                // Tasks that start before and end after the month (span the whole month)
                AND: [
                  { startDate: { lte: startDate } },
                  { dueDate: { gte: endDate } },
                ],
              },
            ],
          },
          include: {
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

    // We only want to return users who have tasks in the given month
    const activeUsers = usersWithTasks.filter(user => user.assignedTasks.length > 0);

    return activeUsers;
  } catch (error) {
    console.error("Error fetching team workload:", error);
    throw new Error("Failed to fetch team workload data.");
  }
}

export type TeamWorkloadData = Awaited<ReturnType<typeof getTeamWorkload>>;
