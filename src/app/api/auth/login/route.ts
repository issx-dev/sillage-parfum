import { NextResponse } from "next/server";
import { z } from "zod";
import { signToken } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email("Correo electrónico no válido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Credenciales incompletas", details: result.error.format() },
        { status: 400 }
      );
    }

    const { email } = result.data;
    const userId = `user_${email.replace(/[^a-zA-Z0-9]/g, "")}`;
    const name = email.split("@")[0] || "Usuario";

    // Issue JWT token via `jose`
    const token = await signToken({ id: userId, email, name });

    const response = NextResponse.json({
      success: true,
      user: { id: userId, email, name },
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[Login API Error]", error);
    return NextResponse.json(
      { error: "Error en el servidor al iniciar sesión" },
      { status: 500 }
    );
  }
}
