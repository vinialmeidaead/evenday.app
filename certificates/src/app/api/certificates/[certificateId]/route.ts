import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deletePDF } from "@/lib/storage";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ certificateId: string }> }
) {
  try {
    const token = request.cookies.get("evenday_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { certificateId } = await params;

    // Buscar certificado
    const certificate = await prisma.issuedCertificate.findUnique({
      where: { id: certificateId },
    });

    if (!certificate) {
      return NextResponse.json(
        { error: "Certificate not found" },
        { status: 404 }
      );
    }

    // Deletar PDF do storage
    if (certificate.pdfUrl) {
      try {
        await deletePDF(certificate.pdfUrl);
      } catch (error) {
        console.error("Error deleting PDF from storage:", error);
        // Continue mesmo se falhar ao deletar do storage
      }
    }

    // Deletar do banco
    await prisma.issuedCertificate.delete({
      where: { id: certificateId },
    });

    return NextResponse.json({ success: true, message: "Certificate deleted" });
  } catch (error: any) {
    console.error("Delete certificate error:", error);
    return NextResponse.json(
      { error: "Failed to delete certificate" },
      { status: 500 }
    );
  }
}
