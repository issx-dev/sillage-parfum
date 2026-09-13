/**
 * Cupones de descuento de Sillage — catálogo server-side.
 *
 * DECISIÓN DE DISEÑO (SILLAGE2):
 * El cupón vive en código (esta tabla) en lugar de depender de un
 * Stripe promotion code creado a mano en el dashboard, porque:
 *  1. Funciona en TODOS los métodos de pago: Stripe y contra reembolso
 *     (un promotion code de Stripe solo descuenta dentro de Checkout).
 *  2. No depende de estado externo: tests deterministas, preview y prod
 *     se comportan igual sin crear el cupón en cada entorno de Stripe.
 *  3. El checkout de Stripe sigue con `allow_promotion_codes: true`, así
 *     que los códigos 100% Stripe también funcionan; el webhook los tolera
 *     verificando `total_details.amount_discount` del evento firmado
 *     (atestiguado por Stripe, no por la DB).
 *
 * Para añadir un cupón: una línea en COUPONS + tests en coupons.test.ts.
 *
 * REGLA BIENVENIDA10 (solo primer pedido):
 * - 10% sobre el total ya bundelizado, igual que SILLAGE2.
 * - `firstOrderOnly: true` → solo válido si el email NO tiene pedidos previos
 *   en `orders` (comparación por `customer_email` normalizado).
 * - La comprobación vive en `src/lib/coupon-eligibility.ts`
 *   (`isCouponEligibleForEmail`, server-only, consulta `orders`) y se aplica
 *   en: GET /api/coupons/validate (param `email`), POST /api/checkout/cod y
 *   POST /api/stripe/checkout (cuando el email se conoce).
 * - Sin email conocido no se puede verificar: el validate sin `email` acepta
 *   el código, y el cargo final lo re-valida el servidor con el email real.
 */

export interface Coupon {
  code: string;
  /** Porcentaje de descuento sobre el total ya bundelizado. */
  percentOff: number;
  /** Si true, solo válido para el primer pedido del email (ver arriba). */
  firstOrderOnly?: boolean;
}

const COUPONS: Record<string, Coupon> = {
  SILLAGE2: { code: "SILLAGE2", percentOff: 10 },
  BIENVENIDA10: { code: "BIENVENIDA10", percentOff: 10, firstOrderOnly: true },
};

/** Normaliza el input del usuario: sin espacios, en mayúsculas. */
export function normalizeCoupon(input: string): string {
  return input.trim().toUpperCase();
}

/** Devuelve el cupón si el código existe, `null` si no. */
export function getCoupon(input: string): Coupon | null {
  const code = normalizeCoupon(input);
  if (!code) return null;
  return COUPONS[code] ?? null;
}

/** Aplica el cupón a un total en euros (redondeo a 2 decimales). */
export function applyCouponToTotal(total: number, couponCode: string | null | undefined): number {
  if (!couponCode) return total;
  const coupon = getCoupon(couponCode);
  if (!coupon) return total;
  return Math.round(total * (1 - coupon.percentOff / 100) * 100) / 100;
}
