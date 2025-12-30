import { NextRequest, NextResponse } from "next/server";
import { evdayApi } from "@/lib/api-client";

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const token = request.cookies.get("evenday_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const eventId = parseInt(params.eventId);
    const event = await evdayApi.getEvent(eventId, token);

    return NextResponse.json({ event }, { status: 200 });
  } catch (error: any) {
    console.error("Get event error:", error);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: error.response?.status || 500 }
    );
  }
}
