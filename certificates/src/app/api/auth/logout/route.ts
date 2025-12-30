import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Clear authentication cookie
  const response = NextResponse.json({ success: true }, { status: 200 });

  response.cookies.delete("evenday_token");

  return response;
}
