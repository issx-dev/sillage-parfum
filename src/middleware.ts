import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./lib/auth";

// ---------------------------------------------------------------------------
// Auth gate (server-side): runs BEFORE rate limiting / CSP.
// ---------------------------------------------------------------------------

function isAccountPath(pathname: string): boolean {
  return pathname === "/cuenta" || pathname.startsWith("/cuenta/");
}

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

async function authGate(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;
  if (!isAccountPath(pathname) && !isAdminPath(pathname)) return null;

  const token = request.cookies.get("auth_token")?.value;
  const user = token ? await verifyToken(token) : null;

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminPath(pathname) && user.role !== "admin") {
    const deniedUrl = request.nextUrl.clone();
    deniedUrl.pathname = "/cuenta";
    deniedUrl.search = "?forbidden=1";
    return NextResponse.redirect(deniedUrl);
  }

  // El admin no tiene panel de usuario: /cuenta redirige a su backoffice.
  if (isAccountPath(pathname) && user.role === "admin") {
    const adminUrl = request.nextUrl.clone();
    adminUrl.pathname = "/admin/resumen";
    adminUrl.search = "";
    return NextResponse.redirect(adminUrl);
  }

  return null;
}

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
  // Auth routes: 5/min per IP+bucket (H1 — anti brute-force / enumeración).
  const isAuth = path.startsWith("/api/auth/");
  // Stripe routes: 10/min per IP
  const isStripe = path.startsWith("/api/stripe/");
  // Search routes: 30/min per IP
  const isSearch = path.startsWith("/api/search");

  if (!isAuth && !isStripe && !isSearch) return null;

  const bucket = isAuth ? "auth" : isStripe ? "stripe" : "search";
  const limit = isAuth ? 5 : isStripe ? 10 : 30;

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

      const { success, remaining } = await ratelimit.limit(`${bucket}:${ip}`);
      return { success, remaining };
    } catch (err) {
      console.warn("[rate-limit] Upstash unavailable, falling back to in-memory:", err);
      // Fall through to in-memory fallback
    }
  }

  // In-memory fallback (not suitable for production multi-instance)
  return inMemoryRateLimit(ip, limit, bucket);
}

// ---------------------------------------------------------------------------
// In-memory rate limiter (fallback when Upstash is unavailable)
// ---------------------------------------------------------------------------
export const rateLimitMap = new Map<string, number[]>();
export const WINDOW_MS = 60_000;

export function inMemoryRateLimit(
  ip: string,
  limit: number,
  // H9 — bucket namespace: the map key is `ip:bucket` so buckets with
  // different limits (auth=5, stripe=10, search=30) never share counters.
  // Defaults to String(limit) to keep the 2-arg call shape working.
  bucket: string = String(limit)
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const key = `${ip}:${bucket}`;

  // Stale entry cleanup — purge on each call to prevent unbounded map growth.
  // Delete entries where all timestamps are outside the window; for entries
  // with a mix of stale and recent timestamps, keep only the recent ones.
  rateLimitMap.forEach((timestamps, key) => {
    const recent = timestamps.filter((t) => t > windowStart);
    if (recent.length === 0) {
      rateLimitMap.delete(key);
    } else if (recent.length !== timestamps.length) {
      rateLimitMap.set(key, recent);
    }
  });

  const timestamps = rateLimitMap.get(key) ?? [];
  const recent = timestamps.filter((t) => t > windowStart);

  if (recent.length >= limit) {
    return { success: false, remaining: 0 };
  }

  recent.push(now);
  rateLimitMap.set(key, recent);
  return { success: true, remaining: limit - recent.length };
}

// ---------------------------------------------------------------------------
// CSP helper
// ---------------------------------------------------------------------------
function buildCSP(nonce: string): string {
  const isDev = process.env.NODE_ENV !== "production";

  const scriptSrc = isDev
    ? `script-src 'self' 'nonce-${nonce}' 'unsafe-eval' https://js.stripe.com`
    : `script-src 'self' 'nonce-${nonce}' https://js.stripe.com`;

  const connectSrc = isDev
    ? `connect-src 'self' https://api.stripe.com ws://localhost:* ws://127.0.0.1:*`
    : `connect-src 'self' https://api.stripe.com`;

  return [
    `default-src 'self'`,
    scriptSrc,
    // H11 justification: `style-src 'unsafe-inline'` is required because
    // Tailwind/Next inject runtime inline <style> tags and Google Fonts
    // serves its CSS from fonts.googleapis.com — neither can carry our
    // per-request nonce. Scripts stay nonce-gated (no unsafe-inline there),
    // and style-src cannot execute JS, so residual risk is style-only.
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `img-src 'self' data: https://images.unsplash.com https://*.sillage.com`,
    connectSrc,
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

  // Nonce first: H10 requires CSP on EVERY response, including auth-gate
  // redirects and 429s (no header-less responses).
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
  const csp = buildCSP(nonce);

  // 0. Auth gate for /cuenta and /admin/* — before everything else.
  const gated = await authGate(request);
  if (gated) {
    gated.headers.set("Content-Security-Policy", csp); // H10
    return gated;
  }

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
      {
        status: 429,
        headers: {
          "Retry-After": "60",
          "Content-Security-Policy": csp, // H10
        },
      }
    );
  }

  // 3. Process request
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // 4. Set CSP header
  response.headers.set("Content-Security-Policy", csp);

  return response;
}

export const config = {
  matcher: ["/cuenta/:path*", "/admin/:path*", "/api/auth/:path*", "/api/stripe/:path*", "/api/search", "/((?!_next/static|_next/image|favicon.svg).*)"],
};