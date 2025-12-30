import { NextRequest, NextResponse } from "next/server";
import { evdayApi } from "@/lib/api-client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const token = request.cookies.get("evenday_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { eventId: eventIdStr } = await params;
    const eventId = parseInt(eventIdStr);
    const attendees = await evdayApi.getAttendees(eventId, token);

    return NextResponse.json({ attendees }, { status: 200 });
  } catch (error: any) {
    console.error("Get attendees error:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendees" },
      { status: error.response?.status || 500 }
    );
  }
}
