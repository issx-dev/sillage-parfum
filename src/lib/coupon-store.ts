import "server-only";
import { z } from "zod";
import { query } from "@/lib/db";
import { getCoupon, normalizeCoupon, type Coupon } from "./coupons";

/**
 * Capa DB de cupones (backoffice). `coupons.ts` sigue siendo el catálogo
 * síncrono de fallback; aquí vive la fuente editable: tabla `coupons`
 * (migración docs/database/migrations/002_coupons.sql).
 */

// Código: mayúsculas, dígitos y guiones, 3–24 caracteres. El trim +
// upper se aplican ANTES de validar, igual que el checkout vía
// normalizeCoupon (el admin puede teclear en minúsculas).
export const couponCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .min(3, "El código necesita al menos 3 caracteres.")
  .max(24, "Máximo 24 caracteres.")
  .regex(/^[A-Z0-9-]+$/, "Solo mayúsculas, dígitos y guiones.");

export const couponInputSchema = z.object({
  code: couponCodeSchema,
  percentOff: z.coerce
    .number()
    .int("El descuento debe ser un entero.")
    .min(1, "Mínimo 1%.")
    .max(90, "Máximo 90% (nunca gratis)."),
  firstOrderOnly: z.boolean().default(false),
  active: z.boolean().default(true),
});

export type CouponInput = z.infer<typeof couponInputSchema>;

interface CouponRow {
  code: string;
  percent_off: number;
  first_order_only: boolean;
  active: boolean;
}

function toCoupon(row: CouponRow): Coupon & { active: boolean } {
  return {
    code: row.code,
    percentOff: Number(row.percent_off),
    ...(row.first_order_only ? { firstOrderOnly: true as const } : {}),
    active: row.active,
  };
}

/** Todos los cupones (activos e inactivos) para el backoffice. */
export async function listCoupons(): Promise<(Coupon & { active: boolean })[]> {
  const rows = (await query(
    `SELECT code, percent_off, first_order_only, active FROM coupons ORDER BY code ASC`
  )) as unknown as CouponRow[];
  return rows.map(toCoupon);
}

/** Cupón activo por código (normalizado), o null. Lo usa el checkout. */
export async function findActiveCoupon(code: string): Promise<Coupon | null> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;
  const rows = (await query(
    `SELECT code, percent_off, first_order_only, active FROM coupons WHERE code = $1 AND active = true LIMIT 1`,
    [normalized]
  )) as unknown as CouponRow[];
  const row = rows[0];
  if (!row) return null;
  const { active: _active, ...coupon } = toCoupon(row);
  return coupon;
}

export async function createCoupon(input: CouponInput): Promise<void> {
  const rows = (await query(
    `INSERT INTO coupons (code, percent_off, first_order_only, active)
     VALUES ($1, $2, $3, $4) ON CONFLICT (code) DO NOTHING RETURNING code`,
    [input.code, input.percentOff, input.firstOrderOnly, input.active]
  )) as unknown[];
  if (rows.length === 0) {
    throw new Error(`El código ${input.code} ya existe.`);
  }
}

export async function updateCoupon(
  code: string,
  input: Omit<CouponInput, "code">
): Promise<void> {
  const rows = (await query(
    `UPDATE coupons SET percent_off = $2, first_order_only = $3, active = $4, updated_at = NOW()
     WHERE code = $1 RETURNING code`,
    [code.trim().toUpperCase(), input.percentOff, input.firstOrderOnly, input.active]
  )) as unknown[];
  if (rows.length === 0) {
    throw new Error(`El código ${code} no existe.`);
  }
}

export async function setCouponActive(code: string, active: boolean): Promise<void> {
  const rows = (await query(
    `UPDATE coupons SET active = $2, updated_at = NOW() WHERE code = $1 RETURNING code`,
    [code.trim().toUpperCase(), active]
  )) as unknown[];
  if (rows.length === 0) {
    throw new Error(`El código ${code} no existe.`);
  }
}

/**
 * Resolución con DB + fallback al catálogo en código.
 * - La DB manda: si la consulta funciona, su respuesta es final (cupón
 *   encontrado, inexistente o desactivado → null). Desactivar un código
 *   en el panel lo apaga de verdad, aunque exista en el fallback.
 * - Fallback solo ante error (sin tabla, sin conexión): SILLAGE2 /
 *   BIENVENIDA10. Nunca rompe el checkout por un fallo de DB.
 * Solo servidor (este módulo lleva `server-only`): los llamadores son
 * pricing, coupon-eligibility y la ruta de validación.
 */
export async function getCouponAsync(input: string): Promise<Coupon | null> {
  const code = normalizeCoupon(input);
  if (!code) return null;
  try {
    return await findActiveCoupon(code);
  } catch {
    // Sin DB o sin tabla: cae al catálogo en código (fail-open a lo conocido).
    return getCoupon(code);
  }
}
