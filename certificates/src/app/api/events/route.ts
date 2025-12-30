import { NextRequest, NextResponse } from "next/server";
import { evdayApi } from "@/lib/api-client";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("evenday_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const events = await evdayApi.getEvents(token);
    return NextResponse.json({ events }, { status: 200 });
  } catch (error: any) {
    console.error("Get events error:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: error.response?.status || 500 }
    );
  }
}
