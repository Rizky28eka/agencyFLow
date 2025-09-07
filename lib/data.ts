import { prisma } from "./db";

/**
 * Fetch all projects
 */
export async function getProjects() {
  try {
    const projects = await prisma.project.findMany();
    return projects || [];
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    throw new Error("Failed to fetch projects.");
  }
}

/**
 * Fetch total revenue
 */
export async function getTotalRevenue() {
  try {
    const totalRevenue = await prisma.invoice.aggregate({
      _sum: {
        totalAmount: true,
      },
    });
    return totalRevenue?._sum?.totalAmount ?? 0;
  } catch (error) {
    console.error("Failed to fetch total revenue:", error);
    throw new Error("Failed to fetch total revenue.");
  }
}

/**
 * Fetch total number of clients
 */
export async function getNewCustomersCount() {
  try {
    const count = await prisma.client.count();
    return count;
  } catch (error) {
    console.error("Failed to fetch new customers count:", error);
    throw new Error("Failed to fetch new customers count.");
  }
}

/**
 * Fetch total number of users
 */
export async function getActiveAccountsCount() {
  try {
    const count = await prisma.user.count();
    return count;
  } catch (error) {
    console.error("Failed to fetch active accounts count:", error);
    throw new Error("Failed to fetch active accounts count.");
  }
}

/**
 * Calculate growth rate of revenue (current month vs previous month)
 */
export async function getGrowthRate() {
  try {
    const today = new Date();
    const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const startOfPreviousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    const currentMonthRevenue = await prisma.invoice.aggregate({
      _sum: { totalAmount: true },
      where: {
        issueDate: { gte: startOfCurrentMonth, lt: startOfNextMonth },
      },
    });

    const previousMonthRevenue = await prisma.invoice.aggregate({
      _sum: { totalAmount: true },
      where: {
        issueDate: { gte: startOfPreviousMonth, lt: startOfCurrentMonth },
      },
    });

    const current = Number(currentMonthRevenue?._sum?.totalAmount ?? 0);
    const previous = Number(previousMonthRevenue?._sum?.totalAmount ?? 0);

    if (previous === 0) return current > 0 ? 100 : 0;

    const growth = ((current - previous) / previous) * 100;
    return parseFloat(growth.toFixed(2));
  } catch (error) {
    console.error("Failed to fetch growth rate:", error);
    throw new Error("Failed to fetch growth rate.");
  }
}

/**
 * Fetch daily new users for chart (last 90 days)
 */
export async function getChartData() {
  try {
    const today = new Date();
    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setDate(today.getDate() - 90);

    const users = await prisma.user.findMany({
      where: { createdAt: { gte: ninetyDaysAgo } },
      select: { createdAt: true },
    });

    const dailyMap: Record<string, number> = {};
    users.forEach(user => {
      const date = user.createdAt.toISOString().split("T")[0]; // YYYY-MM-DD
      dailyMap[date] = (dailyMap[date] || 0) + 1;
    });

    const chartData = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({
        date,
        desktop: count, // all users counted as desktop
        mobile: 0,      // no mobile data yet
      }));

    return chartData;
      } catch (error) {
        console.error("Failed to fetch chart data:", error);
        throw new Error("Failed to fetch chart data.");
      }
    }

    