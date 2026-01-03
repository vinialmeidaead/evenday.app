import { NextRequest, NextResponse } from "next/server";

// Cache temporário para dados de renderização (em memória)
// Em produção, você pode usar Redis ou outro cache distribuído
const renderDataCache = new Map<
  string,
  {
    data: any;
    expires: number;
  }
>();

// Limpar cache expirado periodicamente
function cleanExpiredCache() {
  const now = Date.now();
  for (const [key, value] of renderDataCache.entries()) {
    if (now > value.expires) {
      renderDataCache.delete(key);
    }
  }
}

// POST - Armazenar dados de renderização
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { design, variables, width, height } = body;

    if (!design || !width || !height) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Gerar ID único
    const renderId = `render_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Armazenar dados com expiração de 5 minutos
    renderDataCache.set(renderId, {
      data: { design, variables, width, height },
      expires: Date.now() + 5 * 60 * 1000,
    });

    // Limpar cache expirado
    cleanExpiredCache();

    return NextResponse.json({ renderId });
  } catch (error: any) {
    console.error("Error storing render data:", error);
    return NextResponse.json(
      { error: "Failed to store render data" },
      { status: 500 }
    );
  }
}

// GET - Recuperar dados de renderização
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const renderId = searchParams.get("id");

    if (!renderId) {
      return NextResponse.json({ error: "Missing render ID" }, { status: 400 });
    }

    const cached = renderDataCache.get(renderId);

    if (!cached) {
      return NextResponse.json(
        { error: "Render data not found or expired" },
        { status: 404 }
      );
    }

    if (Date.now() > cached.expires) {
      renderDataCache.delete(renderId);
      return NextResponse.json(
        { error: "Render data expired" },
        { status: 404 }
      );
    }

    // Retornar dados e remover do cache (uso único)
    renderDataCache.delete(renderId);

    return NextResponse.json(cached.data);
  } catch (error: any) {
    console.error("Error retrieving render data:", error);
    return NextResponse.json(
      { error: "Failed to retrieve render data" },
      { status: 500 }
    );
  }
}
