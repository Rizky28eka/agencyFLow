
import { NextResponse } from "next/server";
import { getGrowthRate } from "@/lib/data";

export async function GET() {
  try {
    const data = await getGrowthRate();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch growth rate:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
