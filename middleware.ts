import { NextRequest, NextResponse } from "next/server";

// PoC: in-memory rate limiter. Replace with Upstash/Vercel KV for production
// to guarantee cross-instance consistency on serverless platforms.
const rateLimit = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/api/stripe/")) return NextResponse.next();

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? request.headers.get("x-vercel-proxied-for")
    ?? "127.0.0.1";

  const now = Date.now();
  const timestamps = rateLimit.get(ip) ?? [];
  const windowStart = now - WINDOW_MS;

  // Purge timestamps outside the window
  const recent = timestamps.filter((t) => t > windowStart);

  if (recent.length >= MAX_REQUESTS) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again in 60 seconds." },
      { status: 429 }
    );
  }

  recent.push(now);
  rateLimit.set(ip, recent);
  return NextResponse.next();
}

export const config = {
  matcher: "/api/stripe/:path*",
};
