import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

function getTokenFromCookieHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const pair = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("auth_token="));
  if (!pair) return null;
  return pair.slice("auth_token=".length);
}

export async function GET(req: Request) {
  const token = getTokenFromCookieHeader(req.headers.get("cookie"));

  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = await verifyToken(token);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
}

/**
 * @deprecated Legacy logout — kept for one release. New clients must call
 * `POST /api/auth/logout`.
 */
export async function POST() {
  const response = NextResponse.json({ success: true });
  // H12: igualar atributos del set original al borrar.
  response.cookies.set("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(0),
    path: "/",
  });
  return response;
}
