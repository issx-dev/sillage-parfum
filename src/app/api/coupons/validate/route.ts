import { NextRequest, NextResponse } from "next/server";
import { getCoupon, normalizeCoupon } from "@/lib/coupons";

/**
 * Valida un cupón contra el catálogo server-side (src/lib/coupons.ts).
 * La UI lo usa para dar feedback real en el checkout; el descuento solo
 * se aplica en servidor (Stripe checkout / COD re-validan el código).
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

  return NextResponse.json({ valid: true, code: coupon.code, percentOff: coupon.percentOff });
}
