import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * API Pública de Validação de Certificados
 * GET /api/validate/[code]
 * 
 * Valida um certificado usando seu código de validação único
 * Esta rota é pública e não requer autenticação
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const { code } = await params;

        if (!code) {
            return NextResponse.json(
                { error: "Código de validação não fornecido" },
                { status: 400 }
            );
        }

        // Buscar certificado pelo código de validação
        const certificate = await prisma.issuedCertificate.findUnique({
            where: {
                validationCode: code,
            },
            include: {
                template: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        if (!certificate) {
            return NextResponse.json(
                {
                    valid: false,
                    message: "Certificado não encontrado",
                },
                { status: 404 }
            );
        }

        // Buscar informações do evento da API principal do Evenday
        let eventData = null;
        try {
            const eventResponse = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/events/${certificate.eventId}`
            );
            if (eventResponse.ok) {
                const data = await eventResponse.json();
                eventData = data.event;
            }
        } catch (error) {
            console.error("Erro ao buscar dados do evento:", error);
        }

        // Forçar tipagem das variáveis para evitar erro de build
        const variables = (certificate.variables as any) || {};

        // Retornar informações públicas do certificado
        return NextResponse.json({
            valid: true,
            certificate: {
                certificateNumber: certificate.certificateNumber,
                participantName: variables.participant_name || "N/A",
                eventTitle: variables.event_title || eventData?.title || "N/A",
                eventDate: variables.event_date ||
                    (eventData?.start_date ? new Date(eventData.start_date).toLocaleDateString("pt-BR") : "N/A"),
                issueDate: new Date(certificate.generatedAt).toLocaleDateString("pt-BR"),
                templateName: certificate.template.name,
                hours: variables.hours || variables.event_duration || null,
                eventDuration: variables.event_duration || null,
            },
        });
    } catch (error: any) {
        console.error("Erro ao validar certificado:", error);
        return NextResponse.json(
            { error: "Erro ao validar certificado", details: error.message },
            { status: 500 }
        );
    }
}
