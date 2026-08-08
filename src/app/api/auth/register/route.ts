import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword, signToken } from "@/lib/auth";

const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Correo electrónico no válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Datos de registro no válidos", details: result.error.format() },
        { status: 400 }
      );
    }

    const { name, email, password } = result.data;

    // Password hashing via bcryptjs (salt factor 12)
    const hashedPassword = await hashPassword(password);
    const userId = `user_${Date.now()}`;

    // Create JWT Token via `jose`
    const token = await signToken({ id: userId, email, name });

    console.log(`[User Registered] Hash generated: ${hashedPassword.substring(0, 10)}...`);

    const response = NextResponse.json({
      success: true,
      user: { id: userId, email, name },
    });

    // Set Secure HTTP-Only Cookie
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[Register API Error]", error);
    return NextResponse.json(
      { error: "Error al registrar el usuario" },
      { status: 500 }
    );
  }
}
