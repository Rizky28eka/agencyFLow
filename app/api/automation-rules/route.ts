
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma as db } from "@/lib/db";

interface Action {
  type: string;
  config: any; // This can be refined later
}

// GET all automation rules
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const rules = await db.automationRule.findMany({
      where: {
        organizationId: session.user.organizationId,
      },
      include: { trigger: true, actions: true },
    });
    return NextResponse.json(rules);
  } catch (error) {
    console.error("[AUTOMATION_RULES_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// POST a new automation rule
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { name, description, trigger, actions } = await req.json();

  if (!name || !trigger || !actions || actions.length === 0) {
    return new NextResponse("Bad Request: Missing required fields", { status: 400 });
  }

  try {
    const newRule = await db.automationRule.create({
      data: {
        name,
        description,
        organizationId: session.user.organizationId,
        trigger: {
          create: {
            type: trigger.type,
            config: trigger.config,
          },
        },
        actions: {
          create: actions.map((action: Action) => ({
            type: action.type,
            config: action.config,
          })),
        },
      },
      include: { trigger: true, actions: true },
    });
    return NextResponse.json(newRule, { status: 201 });
  } catch (error) {
    console.error("[AUTOMATION_RULES_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
