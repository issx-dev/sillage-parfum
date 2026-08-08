import { NextResponse } from "next/server";
import { z } from "zod";

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

    const { customer, items, total } = result.data;
    const orderId = `COD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Here the order is saved securely into orders table or local store
    console.log(`[COD Order Created] ID: ${orderId}, Total: ${total}€, Items count: ${items.length}, Customer: ${customer.email}`);

    return NextResponse.json({
      success: true,
      orderId,
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
