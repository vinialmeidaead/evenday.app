import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema de validação
const templateSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  width: z.number().default(1754),
  height: z.number().default(1240),
  design: z.any(),
  variables: z.record(z.string()).default({}),
  isDefault: z.boolean().default(false),
});

// GET - Listar todos os templates do usuário
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("evenday_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // TODO: Pegar userId do token
    // Por enquanto, retornar todos os templates
    const templates = await prisma.certificateTemplate.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ templates }, { status: 200 });
  } catch (error) {
    console.error("Get templates error:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

// POST - Criar novo template
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("evenday_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = templateSchema.parse(body);

    // TODO: Pegar userId real do token
    const userId = 1; // Placeholder

    const template = await prisma.certificateTemplate.create({
      data: {
        userId,
        name: validatedData.name,
        description: validatedData.description,
        width: validatedData.width,
        height: validatedData.height,
        design: validatedData.design,
        variables: validatedData.variables,
        isDefault: validatedData.isDefault,
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error: any) {
    console.error("Create template error:", error);
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
