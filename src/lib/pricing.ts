/**
 * Precio server-side compartido por Stripe checkout, COD y webhook.
 *
 * FUENTE ÚNICA DE VERDAD del total cobrado: la UI muestra
 * `cartStore.getDiscountedTotal()` (oferta multi-compra Chogan 70ml:
 * 2×63€, 3×84€) y el servidor DEBE cobrar exactamente eso — ni el precio
 * plano del cliente ni `variant.price` sin descuentos.
 *
 * Reglas (mismo orden en los tres caminos):
 *  1. Precio unitario = `applyDiscount(variant.price, discount_percent)`.
 *     El carrito ya guarda el precio con descuento de producto, así que el
 *     servidor lo recalcula desde DB y nunca confía en el del cliente.
 *  2. Bundles multi-compra sobre unidades estándar (70ml a 35€ base):
 *     packs de 3 → 84€, packs de 2 → 63€, resto a 35€.
 *  3. Cupón server-side (SILLAGE2, ver `coupons.ts`): −10% sobre el total
 *     bundelizado.
 *
 * Todo en céntimos enteros. El reparto se hace a nivel de UNIDAD (resto
 * mayor) y una línea solo se parte en dos `chargeLines` cuando sus
 * unidades caen a caballo entre dos céntimos; así
 * Σ(unitAmountCents × quantity) === totalCents SIEMPRE, que es lo que
 * Stripe cobra y lo que el webhook verifica.
 */
import { getCoupon } from "./coupons";

export interface PricingLine {
  variantId: string;
  sizeMl: number;
  /** Precio unitario en euros YA con discount_percent aplicado. */
  unitPrice: number;
  quantity: number;
}

/** Línea lista para `stripe.checkout.sessions.create({ line_items })`. */
export interface ChargeLine {
  variantId: string;
  unitAmountCents: number;
  quantity: number;
}

export interface PricedCart {
  chargeLines: ChargeLine[];
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  appliedCoupon: string | null;
}

/** Criterio de "perfume estándar Chogan": el único con oferta multi-compra. */
export function isStandard70ml(sizeMl: number, unitPrice: number): boolean {
  return sizeMl === 70 && unitPrice === 35;
}

function toCents(eur: number): number {
  return Math.round(eur * 100);
}

/**
 * Reparte `total` céntimos entre `weights` devolviendo importes enteros
 * que suman exactamente `total` (resto mayor, determinista).
 */
function distribute(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (weights.length === 0) return [];
  if (sum <= 0 || total <= 0) return weights.map(() => 0);
  const exact = weights.map((w) => (total * w) / sum);
  const floored = exact.map(Math.floor);
  let remainder = total - floored.reduce((a, b) => a + b, 0);
  const order = exact
    .map((v, i) => ({ frac: v - Math.floor(v), i: i as number }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (const { i } of order) {
    if (remainder <= 0) break;
    floored[i as number]! += 1;
    remainder -= 1;
  }
  return floored;
}

export function priceLines(lines: PricingLine[], couponCode?: string | null): PricedCart {
  const clean = lines
    .filter((l) => l.quantity > 0)
    .map((l) => ({ ...l, quantity: Math.floor(l.quantity) }));

  const stdQty = clean
    .filter((l) => isStandard70ml(l.sizeMl, l.unitPrice))
    .reduce((s, l) => s + l.quantity, 0);

  const packsOf3 = Math.floor(stdQty / 3);
  const packsOf2 = Math.floor((stdQty % 3) / 2);
  const singles = stdQty % 3 % 2;
  const bundleTotal = packsOf3 * 8400 + packsOf2 * 6300 + singles * 3500;

  // Valor exacto (fraccionario) por unidad estándar dentro del bundle.
  const stdUnitExact = stdQty > 0 ? bundleTotal / stdQty : 0;

  // Expande a unidades para el reparto exacto al céntimo.
  const unitLineIdx: number[] = [];
  const unitWeights: number[] = [];
  clean.forEach((l, i) => {
    const w = isStandard70ml(l.sizeMl, l.unitPrice) ? stdUnitExact : toCents(l.unitPrice);
    for (let k = 0; k < l.quantity; k++) {
      unitLineIdx.push(i);
      unitWeights.push(w);
    }
  });

  const preCouponTotal = Math.round(unitWeights.reduce((a, b) => a + b, 0));
  const coupon = couponCode ? getCoupon(couponCode) : null;
  const totalCents = coupon
    ? Math.round((preCouponTotal * (100 - coupon.percentOff)) / 100)
    : preCouponTotal;

  const unitCents = distribute(totalCents, unitWeights);

  // Reagrupa por línea; parte en dos si sus unidades difieren en 1 céntimo.
  const byLine = new Map<number, Map<number, number>>();
  unitCents.forEach((c, u) => {
    const li = unitLineIdx[u]!;
    let m = byLine.get(li);
    if (!m) {
      m = new Map();
      byLine.set(li, m);
    }
    m.set(c, (m.get(c) ?? 0) + 1);
  });

  const chargeLines: ChargeLine[] = [];
  Array.from(byLine.entries()).forEach(([li, cents]) => {
    const variantId = clean[li]!.variantId;
    Array.from(cents.entries())
      .sort((a, b) => a[0] - b[0])
      .forEach(([unitAmountCents, quantity]) => {
        chargeLines.push({ variantId, unitAmountCents, quantity });
      });
  });

  return {
    chargeLines,
    subtotalCents: preCouponTotal,
    discountCents: preCouponTotal - totalCents,
    totalCents,
    appliedCoupon: coupon ? coupon.code : null,
  };
}

/** Total en céntimos para verificación (COD, webhook). */
export function expectedTotalCents(lines: PricingLine[], couponCode?: string | null): number {
  return priceLines(lines, couponCode).totalCents;
}
