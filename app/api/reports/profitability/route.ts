import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { UserRole, InvoiceStatus } from "@prisma/client";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Optional: Restrict access to certain roles
  if (![UserRole.ADMIN, UserRole.PROJECT_MANAGER].includes(session.user.role as UserRole)) {
      return new NextResponse("Forbidden: You do not have permission to view this report.", { status: 403 });
  }

  try {
    const projects = await db.project.findMany({
      where: {
        organizationId: session.user.organizationId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    const profitabilityData = await Promise.all(
      projects.map(async (project) => {
        // 1. Calculate total revenue from paid invoices
        const revenue = await db.invoice.aggregate({
          _sum: { totalAmount: true },
          where: {
            projectId: project.id,
            status: InvoiceStatus.PAID,
          },
        });

        // 2. Calculate total expenses
        const expenses = await db.expense.aggregate({
          _sum: { amount: true },
          where: {
            projectId: project.id,
          },
        });

        // 3. Calculate total labor cost
        const timeEntries = await db.timeEntry.findMany({
          where: { projectId: project.id },
          include: {
            user: {
              select: { hourlyCost: true },
            },
          },
        });

        const laborCost = timeEntries.reduce((acc, entry) => {
          const hours = entry.hours.toNumber();
          const costRate = entry.user.hourlyCost?.toNumber() || 0;
          return acc + hours * costRate;
        }, 0);

        const totalRevenue = revenue._sum.totalAmount?.toNumber() || 0;
        const totalExpenses = expenses._sum.amount?.toNumber() || 0;
        const profit = totalRevenue - totalExpenses - laborCost;

        return {
          projectId: project.id,
          projectName: project.name,
          revenue: totalRevenue,
          expenses: totalExpenses,
          laborCost: laborCost,
          profit: profit,
        };
      })
    );

    return NextResponse.json(profitabilityData);

  } catch (error) {
    console.error("[REPORTS_PROFITABILITY_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
