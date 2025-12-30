import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("evenday_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get total certificates issued
    const totalCertificates = await prisma.issuedCertificate.count();

    // Get total templates
    const totalTemplates = await prisma.certificateTemplate.count();

    // Get recent certificates
    const recentCertificates = await prisma.issuedCertificate.findMany({
      take: 10,
      orderBy: { generatedAt: "desc" },
      include: {
        template: {
          select: {
            name: true,
          },
        },
      },
    });

    // Get certificates by event (top 5)
    const certificatesByEvent = await prisma.issuedCertificate.groupBy({
      by: ["eventId"],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 5,
    });

    return NextResponse.json({
      stats: {
        totalCertificates,
        totalTemplates,
      },
      recentCertificates,
      certificatesByEvent,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
