import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const templateUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  design: z.any().optional(),
  variables: z.record(z.string()).optional(),
  isDefault: z.boolean().optional(),
});

// GET - Buscar template específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const token = request.cookies.get("evenday_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { templateId } = await params;
    const template = await prisma.certificateTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ template }, { status: 200 });
  } catch (error) {
    console.error("Get template error:", error);
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const token = request.cookies.get("evenday_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { templateId } = await params;
    const body = await request.json();
    const validatedData = templateUpdateSchema.parse(body);

    const template = await prisma.certificateTemplate.update({
      where: { id: templateId },
      data: validatedData,
    });

    return NextResponse.json({ template }, { status: 200 });
  } catch (error: any) {
    console.error("Update template error:", error);
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

// DELETE - Deletar template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const token = request.cookies.get("evenday_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { templateId } = await params;
    await prisma.certificateTemplate.delete({
      where: { id: templateId },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Delete template error:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
