
import { NextResponse } from "next/server";
import { getTotalRevenue } from "@/lib/data";

export async function GET() {
  try {
    const data = await getTotalRevenue();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch total revenue:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
