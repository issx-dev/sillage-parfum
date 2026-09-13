import { SignJWT, jwtVerify } from "jose";

export type UserRole = "customer" | "admin";

export interface UserPayload {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

/**
 * Resolve the JWT secret — required from `JWT_SECRET` env (min 32 chars).
 * No fallback: a missing/short secret throws instead of signing with a
 * hard-coded key.
 */
function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "[auth] JWT_SECRET must be set with at least 32 characters"
    );
  }
  const encoded = new TextEncoder().encode(secret);
  // Re-wrap in this realm's Uint8Array: under jsdom/vitest TextEncoder can
  // return a cross-realm instance that fails jose's `instanceof` check.
  return new Uint8Array(encoded.buffer, encoded.byteOffset, encoded.byteLength);
}

// Fail fast at import in real runtimes (dev/prod/build/Edge). Skipped under
// Vitest so unit tests can stub `process.env.JWT_SECRET` per-case.
if (!process.env.VITEST) {
  getSecretKey();
}

/**
 * Hash a plain text password using bcryptjs (cost 12).
 * Dynamically imported to keep this module Edge-safe (middleware only
 * needs verifyToken, never bcrypt).
 */
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = (await import("bcryptjs")).default;
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

/**
 * Verify a plain text password against a stored bcrypt hash.
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const bcrypt = (await import("bcryptjs")).default;
  return bcrypt.compare(password, hash);
}

/**
 * Sign a JWT token using `jose`.
 *
 * H7 (decisión CTO): expiración 24h, no 7d. Ventana de abuso de un token
 * robado limitada a un día; el usuario re-autentica al expirar.
 */
export async function signToken(payload: UserPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getSecretKey());
}

/**
 * Verify and decode a JWT token using `jose`.
 * Tokens issued before `role` existed default to `role: 'customer'`.
 */
export async function verifyToken(token: string): Promise<UserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return {
      id: payload.id as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role === "admin" ? "admin" : "customer",
    };
  } catch {
    return null;
  }
}
