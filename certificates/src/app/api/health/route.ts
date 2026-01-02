import { NextResponse } from "next/server";

/**
 * Health check endpoint para monitoramento
 * Usado pelo Docker healthcheck e ferramentas de monitoramento
 */
export async function GET() {
  try {
    // Verificações básicas de saúde
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    };

    return NextResponse.json(health, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}
