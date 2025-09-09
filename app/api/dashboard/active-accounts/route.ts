
import { NextResponse } from "next/server";
import { getActiveAccountsCount } from "@/lib/data";

export async function GET() {
  try {
    const data = await getActiveAccountsCount();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch active accounts count:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
