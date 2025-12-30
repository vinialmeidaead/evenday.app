import { NextRequest, NextResponse } from "next/server";
import { evdayApi } from "@/lib/api-client";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Authenticate with evenday.app Laravel backend
    const { token, user } = await evdayApi.login(email, password);

    // Create response with user data
    const response = NextResponse.json({ user }, { status: 200 });

    // Set auth token in httpOnly cookie
    response.cookies.set("evenday_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);

    // Handle authentication errors
    if (error.response?.status === 401) {
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao fazer login. Tente novamente." },
      { status: 500 }
    );
  }
}
