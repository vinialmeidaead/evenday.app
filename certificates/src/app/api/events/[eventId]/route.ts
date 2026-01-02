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

    const resolvedParams = await params;
    const eventId = parseInt(resolvedParams.eventId);
    const event = await evdayApi.getEvent(eventId, token);

    return NextResponse.json({ event }, { status: 200 });
  } catch (error: any) {
    console.error("Get event error:", error);
    console.error("Error details:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    return NextResponse.json(
      {
        error: "Failed to fetch event",
        details: error.response?.data || error.message,
      },
      { status: error.response?.status || 500 }
    );
  }
}
