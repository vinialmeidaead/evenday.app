import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("evenday_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    const where = eventId ? { eventId: parseInt(eventId) } : {};

    const certificates = await prisma.issuedCertificate.findMany({
      where,
      include: {
        template: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        generatedAt: "desc",
      },
    });

    return NextResponse.json({ certificates });
  } catch (error: any) {
    console.error("Get certificates error:", error);
    return NextResponse.json(
      { error: "Failed to fetch certificates" },
      { status: 500 }
    );
  }
}
