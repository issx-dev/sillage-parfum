import "server-only";
import { query } from "@/lib/db";
import { getCoupon } from "@/lib/coupons";

export interface Eligibility {
  eligible: boolean;
  reason?: string;
}

/** ¿Tiene este email al menos un pedido en `orders`? (email normalizado). */
export async function hasPriorOrders(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  const rows = (await query(
    `SELECT 1 FROM orders WHERE lower(customer_email) = $1 LIMIT 1`,
    [normalized]
  )) as unknown[];
  return rows.length > 0;
}

/**
 * Elegibilidad de un cupón para un email.
 * - Cupón inexistente → no elegible ("no válido").
 * - Cupón `firstOrderOnly` + email con pedidos previos → no elegible.
 * - Sin email (desconocido) no se puede verificar: se acepta y el cargo
 *   final re-valida con el email real (COD / Stripe checkout).
 */
export async function isCouponEligibleForEmail(
  couponCode: string,
  email?: string | null
): Promise<Eligibility> {
  const coupon = getCoupon(couponCode);
  if (!coupon) return { eligible: false, reason: "Código de descuento no válido" };
  if (coupon.firstOrderOnly && email?.trim()) {
    if (await hasPriorOrders(email)) {
      return {
        eligible: false,
        reason: `${coupon.code} solo es válido para tu primer pedido`,
      };
    }
  }
  return { eligible: true };
}
