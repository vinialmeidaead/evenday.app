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
 * POST - Emitir certificado individual
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("evenday_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { templateId, eventId, attendeeId } = body;

    if (!templateId || !eventId || !attendeeId) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    // Buscar evento e participante
    const [event, attendees] = await Promise.all([
      evdayApi.getEvent(eventId, token),
      evdayApi.getAttendees(eventId, token),
    ]);

    const attendee = attendees.find((a: any) => a.id === attendeeId);
    if (!attendee) {
      return NextResponse.json(
        { error: "Attendee not found" },
        { status: 404 }
      );
    }

    // Verificar se já existe certificado
    const existing = await prisma.issuedCertificate.findFirst({
      where: {
        templateId,
        eventId,
        attendeeId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Certificate already issued for this attendee" },
        { status: 400 }
      );
    }

    // Gerar número do certificado
    const certificateNumber = generateCertificateNumber();

    // Preparar variáveis
    const variables = prepareVariablesForAttendee(
      attendee,
      event,
      certificateNumber
    );

    // Gerar PDF
    const pdfBuffer = await generateCertificatePDF({
      template: template as any,
      variables,
    });

    // Salvar PDF
    const filename = generateFilename(
      certificateNumber,
      `${attendee.first_name}-${attendee.last_name}`
    );
    const pdfUrl = await savePDF(pdfBuffer, filename);

    // Salvar no banco
    const certificate = await prisma.issuedCertificate.create({
      data: {
        templateId,
        eventId,
        attendeeId,
        certificateNumber,
        pdfUrl,
        variables,
        generatedAt: new Date(),
      },
    });

    return NextResponse.json(
      { certificate, message: "Certificate issued successfully" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Issue certificate error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to issue certificate" },
      { status: 500 }
    );
  }
}
