
import { NextResponse } from "next/server";
import { getNewCustomersCount } from "@/lib/data";

export async function GET() {
  try {
    const data = await getNewCustomersCount();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch new customers count:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
