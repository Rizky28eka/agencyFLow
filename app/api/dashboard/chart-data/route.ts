
import { NextResponse } from "next/server";
import { getChartData } from "@/lib/data";

export async function GET() {
  try {
    const data = await getChartData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch chart data:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
