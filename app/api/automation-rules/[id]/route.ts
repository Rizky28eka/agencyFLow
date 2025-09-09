
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await request.json();
  const { name, trigger, conditions, actions } = body;

  try {
    const updatedRule = await prisma.automationRule.update({
      where: { id },
      data: {
        name,
        trigger,
        conditions,
        actions: {
          deleteMany: {},
          create: actions.map((action: { type: string, config: Record<string, unknown> }) => ({
            type: action.type,
            config: action.config,
          })),
        },
      },
      include: { actions: true },
    });

    return NextResponse.json(updatedRule);
  } catch (error) {
    return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  try {
    await prisma.automationRule.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
  }
}
