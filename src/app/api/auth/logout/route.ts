import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });
  // H12: el borrado debe igualar los atributos del set original (login y
  // register fijan httpOnly + secure-en-prod + sameSite:lax + path:/).
  // Si no coinciden, el navegador conserva la cookie viva en otro scope.
  response.cookies.set("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(0),
    path: "/",
  });
  return response;
}
