import { NextResponse } from "next/server";
import { getNotifications } from "../../(internal)/internal/notifications/actions";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const orgId = searchParams.get("orgId");

  if (!userId || !orgId) {
    return NextResponse.json({ error: "Missing userId or orgId" }, { status: 400 });
  }

  try {
    const notifications = await getNotifications(10);
    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}
