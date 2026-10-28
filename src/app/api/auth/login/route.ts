import { NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { signToken, verifyPassword, type UserRole } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email("Correo electrónico no válido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

// H2 — hash ficticio de coste equivalente (cost 12, igual que hashPassword)
// para comparar SIEMPRE con bcrypt, incluso si el usuario no existe. Sin
// esto, un atacante distingue "usuario inexistente" (respuesta rápida,
// sin bcrypt) de "contraseña incorrecta" (respuesta lenta, con bcrypt)
// por temporización.
const DUMMY_HASH =
  "$2b$12$3tN/dS4fb0iHoHd22bhCYuQ.77HtHqKJE99YyJ3nY1enim9E5eu2.";

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  password_hash: string;
}

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

    const email = result.data.email.toLowerCase().trim();

    const rows = (await query(
      "SELECT id, email, name, role, password_hash FROM users WHERE email = $1",
      [email]
    )) as unknown as UserRow[];

    const row = rows[0];
    // H2: bcrypt SIEMPRE — contra el hash real si hay usuario, contra el
    // dummy si no, para igualar tiempos y no filtrar existencia por timing.
    const hashToCheck = row?.password_hash ?? DUMMY_HASH;
    // H2: verifyPassword SIEMPRE (sin cortocircuito) para igualar tiempos.
    const ok = await verifyPassword(result.data.password, hashToCheck);
    const valid = row !== undefined && ok;

    if (!valid || !row) {
      // Same message whether the user is missing or the password is wrong.
      return NextResponse.json(
        { error: "invalid_credentials" },
        { status: 401 }
      );
    }

    const role: UserRole = row.role === "admin" ? "admin" : "customer";
    const token = await signToken({
      id: row.id,
      email: row.email,
      name: row.name,
      role,
    });

    const response = NextResponse.json({
      user: { id: row.id, email: row.email, name: row.name, role },
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // H7: 24h (decisión CTO), igual que el JWT
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
