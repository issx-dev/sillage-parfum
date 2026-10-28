import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";

const newsletterSchema = z.object({
  email: z.string().trim().email("Email inválido"),
  source: z.string().trim().max(50).optional().default("lead_modal"),
});

/**
 * POST /api/newsletter — suscribe un email al club (tabla
 * `newsletter_subscribers`). Email normalizado (lower(trim())).
 * - 201 { success: true } en alta nueva.
 * - 409 elegante si el email ya estaba suscrito (UNIQUE, sin error técnico).
 * - 400 si el email no es válido.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de petición inválido" }, { status: 400 });
  }

  const parsed = newsletterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Indique un email válido" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const source = parsed.data.source || "lead_modal";

  try {
    const rows = (await query(
      `INSERT INTO newsletter_subscribers (email, source) VALUES ($1, $2)
       ON CONFLICT (email) DO NOTHING RETURNING id`,
      [email, source]
    )) as unknown[];

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Este email ya está suscrito a nuestro club", alreadySubscribed: true },
        { status: 409 }
      );
    }
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("[newsletter] subscribe failed", err);
    return NextResponse.json(
      { error: "No pudimos completar la suscripción. Inténtelo de nuevo." },
      { status: 500 }
    );
  }
}
