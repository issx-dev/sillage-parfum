import { NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { hashPassword, signToken, type UserRole } from "@/lib/auth";

const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Correo electrónico no válido"),
  // H13: mínimo 8 caracteres.
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

// H13 — denylist de contraseñas triviales (comparación en minúsculas).
const PASSWORD_DENYLIST = new Set([
  "password",
  "password1",
  "password123",
  "12345678",
  "123456789",
  "qwerty123",
  "qwertyuiop",
  "letmein123",
  "welcome123",
  "admin123",
  "changeme",
  "abc12345",
  "11111111",
  "00000000",
  "iloveyou",
  "sillage",
  "sillage123",
]);

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: string;
}

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

    const name = result.data.name.trim();
    const email = result.data.email.toLowerCase().trim();

    // H13: rechazar contraseñas de la denylist con el mismo 400 genérico.
    if (PASSWORD_DENYLIST.has(result.data.password.toLowerCase())) {
      return NextResponse.json(
        { error: "Datos de registro no válidos" },
        { status: 400 }
      );
    }

    const existing = await query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);
    if (existing.length > 0) {
      // H3 — anti-enumeración: email existente responde 200 genérico, SIN
      // revelar duplicado (nada de 409/email_exists) y SIN fijar cookie de
      // sesión. El cliente redirige a /cuenta y el middleware lo lleva a
      // /login?next=/cuenta si no hay sesión.
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const passwordHash = await hashPassword(result.data.password);
    const rows = (await query(
      "INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, role",
      [email, passwordHash, name]
    )) as unknown as UserRow[];

    const row = rows[0];
    if (!row) {
      console.error("[Register API Error] INSERT returned no rows");
      return NextResponse.json(
        { error: "Error al registrar el usuario" },
        { status: 500 }
      );
    }
    const role: UserRole = row.role === "admin" ? "admin" : "customer";
    const token = await signToken({
      id: row.id,
      email: row.email,
      name: row.name,
      role,
    });

    const response = NextResponse.json(
      { user: { id: row.id, email: row.email, name: row.name, role } },
      { status: 201 }
    );

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // H7: 24h (decisión CTO), igual que el JWT
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
