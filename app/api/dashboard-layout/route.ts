
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma as db } from "@/lib/db";

// GET user's dashboard layout
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const layout = await db.dashboardLayout.findUnique({
      where: { userId: session.user.id },
    });

    if (!layout) {
      // Return a default layout if none exists
      return NextResponse.json({ layout: [] }); 
    }

    return NextResponse.json(layout);
  } catch (error) {
    console.error("[DASHBOARD_LAYOUT_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// PUT (update/create) user's dashboard layout
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { layout } = await req.json();

  if (!Array.isArray(layout)) {
    return new NextResponse("Bad Request: Layout must be an array", { status: 400 });
  }

  try {
    const updatedLayout = await db.dashboardLayout.upsert({
      where: { userId: session.user.id },
      update: { layout: layout },
      create: {
        userId: session.user.id,
        layout: layout,
      },
    });
    return NextResponse.json(updatedLayout);
  } catch (error) {
    console.error("[DASHBOARD_LAYOUT_PUT]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
