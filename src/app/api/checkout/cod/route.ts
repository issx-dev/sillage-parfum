import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getVariant } from "@/lib/data";
import { saveOrder } from "@/lib/data/orders";
import { applyDiscount } from "@/lib/utils";
import { normalizeCoupon } from "@/lib/coupons";
import { isCouponEligibleForEmail } from "@/lib/coupon-eligibility";
import { expectedTotalCents, type PricingLine } from "@/lib/pricing";
import type { CartItem } from "@/types";

const codSchema = z.object({
  customer: z.object({
    email: z.string().email("Email inválido"),
    firstName: z.string().min(1, "Nombre requerido"),
    lastName: z.string().min(1, "Apellidos requeridos"),
    address: z.string().min(3, "Dirección requerida"),
    city: z.string().min(1, "Ciudad requerida"),
    postalCode: z.string().min(4, "Código postal requerido"),
    phone: z.string().min(6, "Teléfono requerido para envío contra reembolso"),
    notes: z.string().optional(),
    subscribeNewsletter: z.boolean().optional(),
  }),
  items: z.array(
    z.object({
      variantId: z.string(),
      productId: z.string(),
      name: z.string(),
      size_ml: z.number(),
      price: z.number(),
      quantity: z.number(),
    })
  ).min(1, "El carrito no puede estar vacío"),
  total: z.number().positive(),
  paymentMethod: z.literal("cod"),
  couponCode: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = codSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Datos de envío o pedido incompletos", details: result.error.format() },
        { status: 400 }
      );
    }

    const { customer, items, total, couponCode: rawCoupon } = result.data;

    // Cupón server-side: se valida aquí, nunca en el cliente.
    // BIENVENIDA10 (firstOrderOnly) exige además que customer.email no tenga
    // pedidos previos (src/lib/coupon-eligibility.ts).
    const couponCode = rawCoupon ? normalizeCoupon(rawCoupon) : null;
    if (couponCode) {
      const eligibility = await isCouponEligibleForEmail(couponCode, customer.email);
      if (!eligibility.eligible) {
        return NextResponse.json({ error: eligibility.reason }, { status: 400 });
      }
    }

    // ─── Verificación server-side de precios (igual que el webhook) ───
    // Se re-resuelve cada variante desde DB (precio + discount_percent +
    // size_ml para bundles) y se compara el total del cliente con el
    // esperado al céntimo. Nunca se confía en price/total del cliente.
    const pricingLines: PricingLine[] = [];
    const orderItems: CartItem[] = [];
    for (const item of items) {
      const found = await getVariant(item.productId, item.variantId);
      if (!found) {
        return NextResponse.json(
          { error: "Uno o más productos ya no están disponibles" },
          { status: 404 }
        );
      }
      const { product, variant } = found;
      const quantity = Math.min(Math.max(1, Math.floor(Number(item.quantity) || 1)), 10);
      const unitPrice = applyDiscount(variant.price, product.discount_percent);
      pricingLines.push({
        variantId: variant.id,
        sizeMl: variant.size_ml,
        unitPrice,
        quantity,
      });
      orderItems.push({
        variantId: variant.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        brand: product.brand,
        image: product.images?.[0] ?? "",
        size_ml: variant.size_ml,
        price: unitPrice,
        quantity,
      });
    }

    const verifiedTotal = (await expectedTotalCents(pricingLines, couponCode)) / 100;
    if (Math.abs(verifiedTotal - total) > 0.005) {
      console.error(
        `[COD] Price mismatch: cliente dice ${total}€, servidor calcula ${verifiedTotal}€`
      );
      return NextResponse.json(
        { error: "El total del pedido no coincide con los precios vigentes" },
        { status: 400 }
      );
    }

    const orderId = `COD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Persiste vía saveOrder: idempotente por eventId y con decremento
    // atómico de stock dentro de la misma transacción (rollback si falta).
    try {
      await saveOrder(
        {
          id: orderId,
          items: orderItems,
          total: verifiedTotal,
          status: "pending",
          customerEmail: customer.email,
          createdAt: new Date().toISOString(),
          paymentMethod: "cod",
          ...(couponCode ? { couponCode } : {}),
          shipping: {
            firstName: customer.firstName,
            lastName: customer.lastName,
            address: customer.address,
            city: customer.city,
            postalCode: customer.postalCode,
            phone: customer.phone,
            ...(customer.notes ? { notes: customer.notes } : {}),
          },
        },
        orderId
      );
    } catch (err) {
      if (err instanceof Error && err.message.includes("insufficient stock")) {
        return NextResponse.json(
          { error: "Stock insuficiente para uno o más productos" },
          { status: 409 }
        );
      }
      throw err;
    }

    console.log(`[COD Order Created] ID: ${orderId}, Total: ${verifiedTotal}€, Items: ${orderItems.length}, Customer: ${customer.email}`);

    return NextResponse.json({
      success: true,
      orderId,
      total: verifiedTotal,
      message: "Pedido registrado con éxito en modo Contra Reembolso",
      redirectUrl: `/checkout/exito?orderId=${orderId}&method=cod`,
    });
  } catch (error) {
    console.error("[COD API Error]", error);
    return NextResponse.json(
      { error: "Error al procesar el pedido Contra Reembolso" },
      { status: 500 }
    );
  }
}
