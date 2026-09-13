import { NextRequest, NextResponse } from "next/server";
import { getCoupon, normalizeCoupon } from "@/lib/coupons";
import { isCouponEligibleForEmail } from "@/lib/coupon-eligibility";

/**
 * Valida un cupón contra el catálogo server-side (src/lib/coupons.ts).
 * La UI lo usa para dar feedback real en el checkout; el descuento solo
 * se aplica en servidor (Stripe checkout / COD re-validan el código).
 *
 * Param opcional `email`: si se indica y el cupón es `firstOrderOnly`
 * (BIENVENIDA10), se verifica contra `orders` que sea su primer pedido.
 */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("code") ?? "";
  const code = normalizeCoupon(raw);

  if (!code) {
    return NextResponse.json(
      { valid: false, error: "Indique un código de descuento" },
      { status: 400 }
    );
  }

  const coupon = getCoupon(code);
  if (!coupon) {
    return NextResponse.json(
      { valid: false, error: `El código ${code} no es válido` },
      { status: 404 }
    );
  }

  const email = request.nextUrl.searchParams.get("email");
  const eligibility = await isCouponEligibleForEmail(code, email);
  if (!eligibility.eligible) {
    return NextResponse.json(
      { valid: false, code: coupon.code, error: eligibility.reason },
      { status: 422 }
    );
  }

  return NextResponse.json({ valid: true, code: coupon.code, percentOff: coupon.percentOff });
}
