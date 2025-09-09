import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organizationId');

  if (!organizationId) {
    return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
  }

  const rules = await prisma.automationRule.findMany({
    where: { organizationId },
    include: { actions: true },
  });

  return NextResponse.json(rules);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, trigger, conditions, actions, organizationId } = body;

  if (!name || !trigger || !organizationId) {
    return NextResponse.json({ error: 'name, trigger, and organizationId are required' }, { status: 400 });
  }

  const rule = await prisma.automationRule.create({
    data: {
      name,
      trigger,
      conditions,
      organizationId,
      actions: {
        create: actions.map((action: { type: string, config: Record<string, unknown> }) => ({
          type: action.type,
          config: action.config,
        })),
      },
    },
    include: { actions: true },
  });

  return NextResponse.json(rule, { status: 201 });
}