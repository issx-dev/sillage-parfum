import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------
// Upstash Ratelimit for production; in-memory Map fallback for dev/offline.
//_lazy-loaded to avoid import errors when env vars are missing.

type RateLimitResult = { success: boolean; remaining: number };

async function checkRateLimit(
  ip: string,
  path: string
): Promise<RateLimitResult | null> {
  // Stripe routes: 10/min per IP
  const isStripe = path.startsWith("/api/stripe/");
  // Search routes: 30/min per IP
  const isSearch = path.startsWith("/api/search");

  if (!isStripe && !isSearch) return null;

  const limit = isStripe ? 10 : 30;

  // Try Upstash Ratelimit if env vars are available
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisUrl && redisToken) {
    try {
      const { Ratelimit } = await import("@upstash/ratelimit");
      const { Redis } = await import("@upstash/redis");

      const redis = new Redis({ url: redisUrl, token: redisToken });
      const ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, "60 s"),
      });

      const { success, remaining } = await ratelimit.limit(ip);
      return { success, remaining };
    } catch (err) {
      console.warn("[rate-limit] Upstash unavailable, falling back to in-memory:", err);
      // Fall through to in-memory fallback
    }
  }

  // In-memory fallback (not suitable for production multi-instance)
  return inMemoryRateLimit(ip, limit);
}

// ---------------------------------------------------------------------------
// In-memory rate limiter (fallback when Upstash is unavailable)
// ---------------------------------------------------------------------------
const rateLimitMap = new Map<string, number[]>();
const WINDOW_MS = 60_000;

function inMemoryRateLimit(ip: string, limit: number): RateLimitResult {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) ?? [];
  const windowStart = now - WINDOW_MS;
  const recent = timestamps.filter((t) => t > windowStart);

  if (recent.length >= limit) {
    return { success: false, remaining: 0 };
  }

  recent.push(now);
  rateLimitMap.set(ip, recent);
  return { success: true, remaining: limit - recent.length };
}

// ---------------------------------------------------------------------------
// CSP helper
// ---------------------------------------------------------------------------
function buildCSP(nonce: string): string {
  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' https://js.stripe.com`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `img-src 'self' data: https://images.unsplash.com https://*.sillage.com`,
    `connect-src 'self' https://api.stripe.com`,
    `frame-src https://js.stripe.com https://hooks.stripe.com`,
    `base-uri 'self'`,
    `form-action 'self' https://checkout.stripe.com`,
    `object-src 'none'`,
  ].join("; ");
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Rate limiting for API routes
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-vercel-proxied-for") ??
    "127.0.0.1";

  const rateResult = await checkRateLimit(ip, pathname);
  if (rateResult && !rateResult.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again in 60 seconds." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  // 2. Generate CSP nonce (Web Crypto API — Edge Runtime compatible)
  let nonce: string;
  try {
    nonce = btoa(crypto.randomUUID());
  } catch {
    // Fallback: crypto.getRandomValues when randomUUID is unavailable
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    nonce = btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(""));
    console.warn("[middleware] crypto.randomUUID unavailable, using getRandomValues fallback");
  }

  // 3. Process request
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // 4. Set CSP header
  response.headers.set("Content-Security-Policy", buildCSP(nonce));

  return response;
}

export const config = {
  matcher: ["/api/stripe/:path*", "/api/search", "/((?!_next/static|_next/image|favicon.svg).*)"],
};