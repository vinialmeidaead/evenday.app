import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evdayApi } from "@/lib/api-client";
import {
  generateCertificatePDF,
  prepareVariablesForAttendee,
} from "@/lib/pdf-generator";
import { savePDF, generateFilename } from "@/lib/storage";
import { generateCertificateNumber } from "@/lib/certificate-utils";

/**
 * POST - Emitir certificados em lote
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("evenday_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { templateId, eventId, attendeeIds } = body;

    if (
      !templateId ||
      !eventId ||
      !attendeeIds ||
      !Array.isArray(attendeeIds)
    ) {
      return NextResponse.json(
        { error: "Missing or invalid required fields" },
        { status: 400 }
      );
    }

    // Buscar template
    const template = await prisma.certificateTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Buscar evento e participantes
    const [event, attendees] = await Promise.all([
      evdayApi.getEvent(eventId, token),
      evdayApi.getAttendees(eventId, token),
    ]);

    const selectedAttendees = attendees.filter((a: any) =>
      attendeeIds.includes(a.id)
    );

    if (selectedAttendees.length === 0) {
      return NextResponse.json(
        { error: "No valid attendees found" },
        { status: 400 }
      );
    }

    const results = {
      success: [] as any[],
      failed: [] as any[],
      skipped: [] as any[],
    };

    // Processar cada participante
    for (const attendee of selectedAttendees) {
      try {
        // Verificar se já existe
        const existing = await prisma.issuedCertificate.findFirst({
          where: {
            templateId,
            eventId,
            attendeeId: attendee.id,
          },
        });

        if (existing) {
          results.skipped.push({
            attendeeId: attendee.id,
            name: `${attendee.first_name} ${attendee.last_name}`,
            reason: "Already issued",
          });
          continue;
        }

        // Gerar certificado
        const certificateNumber = generateCertificateNumber();
        const variables = prepareVariablesForAttendee(
          attendee,
          event,
          certificateNumber
        );

        const pdfBuffer = await generateCertificatePDF({
          template: template as any,
          variables,
        });

        const filename = generateFilename(
          certificateNumber,
          `${attendee.first_name}-${attendee.last_name}`
        );
        const pdfUrl = await savePDF(pdfBuffer, filename);

        const certificate = await prisma.issuedCertificate.create({
          data: {
            templateId,
            eventId,
            attendeeId: attendee.id,
            certificateNumber,
            pdfUrl,
            variables,
            generatedAt: new Date(),
          },
        });

        results.success.push({
          attendeeId: attendee.id,
          name: `${attendee.first_name} ${attendee.last_name}`,
          certificateNumber,
          pdfUrl,
        });
      } catch (error: any) {
        results.failed.push({
          attendeeId: attendee.id,
          name: `${attendee.first_name} ${attendee.last_name}`,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      message: "Batch certificate issuance completed",
      summary: {
        total: attendeeIds.length,
        success: results.success.length,
        failed: results.failed.length,
        skipped: results.skipped.length,
      },
      results,
    });
  } catch (error: any) {
    console.error("Batch issue error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to issue certificates" },
      { status: 500 }
    );
  }
}
