"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isManager } from "@/lib/permissions";
export type Activity = Awaited<
  ReturnType<typeof prisma.activity.findMany>
>[number];

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    !session.user?.id ||
    !session.user.organizationId ||
    !session.user.role
  ) {
    throw new Error("Unauthorized: User not authenticated.");
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { role: true },
  });
  if (!user) {
    throw new Error("Unauthorized: User not found.");
  }
  return user;
}

export async function createActivity(
  projectId: string,
  type: string,
  description: string,
  userId?: string
) {
  const user = await getAuthenticatedUser();

  try {
    await prisma.activity.create({
      data: {
        projectId: projectId,
        type: type,
        description: description,
        userId: userId || user.id,
        organizationId: user.organizationId,
      },
    });

    revalidatePath(`/internal/projects/${projectId}`);
  } catch (error) {
    console.error("Failed to create activity:", error);
  }
}

export async function getProjectActivities(projectId: string) {
  const user = await getAuthenticatedUser();
  if (!isManager(user)) {
    throw new Error(
      "Unauthorized: You do not have permission to view project activities."
    );
  }

  try {
    const activities = await prisma.activity.findMany({
      where: {
        projectId: projectId,
        organizationId: user.organizationId,
      },
      include: {
        user: {
          select: { name: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });
    return activities;
  } catch (error) {
    console.error("Failed to fetch project activities:", error);
    return [];
  }
}
