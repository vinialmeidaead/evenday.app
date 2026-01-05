import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evdayApi } from "@/lib/api-client";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("evenday_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await evdayApi.getUser(token);
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    const where: any = {
      template: {
        userId: user.id,
      },
    };

    if (eventId) {
      where.eventId = parseInt(eventId);
    }

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
