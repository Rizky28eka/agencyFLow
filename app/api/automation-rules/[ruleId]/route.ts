
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma as db } from "@/lib/db";

interface Action {
  type: string;
  config: any; // This can be refined later
}

// GET a single automation rule
export async function GET(
  req: Request,
  { params }: { params: { ruleId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const rule = await db.automationRule.findUnique({
      where: {
        id: params.ruleId,
        organizationId: session.user.organizationId,
      },
      include: { trigger: true, actions: true },
    });

    if (!rule) {
      return new NextResponse("Not Found", { status: 404 });
    }

    return NextResponse.json(rule);
  } catch (error) {
    console.error("[AUTOMATION_RULE_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// PUT (update) an automation rule
export async function PUT(
  req: Request,
  { params }: { params: { ruleId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { name, description, isEnabled, trigger, actions } = await req.json();

  try {
    // This is complex because we need to update the trigger and actions, potentially creating and deleting them.
    // For simplicity, we'll update the main rule fields and delete/recreate the trigger and actions.
    
    const updatedRule = await db.$transaction(async (tx) => {
        // First, delete old actions and trigger
        await tx.action.deleteMany({ where: { ruleId: params.ruleId } });
        await tx.trigger.delete({ where: { id: trigger.id } });

        // Then, update the rule and create the new trigger/actions
        return tx.automationRule.update({
            where: {
                id: params.ruleId,
                organizationId: session.user.organizationId,
            },
            data: {
                name,
                description,
                isEnabled,
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
    });

    return NextResponse.json(updatedRule);
  } catch (error) {
    console.error("[AUTOMATION_RULE_PUT]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// DELETE an automation rule
export async function DELETE(
  req: Request,
  { params }: { params: { ruleId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // The schema is set to cascade delete, so deleting the rule should delete its trigger and actions.
    await db.automationRule.delete({
      where: {
        id: params.ruleId,
        organizationId: session.user.organizationId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[AUTOMATION_RULE_DELETE]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
