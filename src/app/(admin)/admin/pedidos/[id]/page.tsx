import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { readOrderDetail, type OrderStatus } from "../../_lib/queries";
import { STATUS_LABELS } from "../../_lib/estado";
import {
  FULFILLMENT_LABELS,
  FULFILLMENT_STATUSES,
  fulfillmentBadgeVariant,
} from "@/lib/data/fulfillment";
import { getAdminUser } from "../../_lib/admin-auth";
import { NON_PENINSULAR_POSTAL_PREFIXES } from "@/lib/constants";
import { updateFulfillmentStatus, updateOrderStatus } from "../actions";
import { ActionForm } from "../../_components/ActionForm";

export const metadata: Metadata = {
  title: "Detalle de pedido | Administración SILLAGE",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const NEXT_STATUS: { value: OrderStatus; label: string }[] = [
  { value: "paid", label: "Pagado" },
  { value: "pending", label: "Pendiente (COD)" },
  { value: "refunded", label: "Reembolsado" },
  { value: "failed", label: "Fallido" },
];

function statusBadgeVariant(status: OrderStatus): "success" | "warning" | "danger" {
  if (status === "paid") return "success";
  if (status === "pending" || status === "refunded") return "warning";
  return "danger";
}

interface PedidoDetailPageProps {
  params: { id: string };
}

export default async function PedidoDetailPage({ params }: PedidoDetailPageProps) {
  // Defensa en profundidad (H4): revalidar rol antes de leer PII del pedido.
  const admin = await getAdminUser();
  if (!admin || admin.role !== "admin") {
    redirect("/login");
  }
  const order = await readOrderDetail(params.id);
  if (!order) notFound();

  const itemsSum = order.items.reduce(
    (sum, i) => sum + (Number.isFinite(i.price) ? i.price * i.quantity : 0),
    0
  );
  // What the total adds or removes beyond list prices: shipping, bundles, coupons.
  const adjustment = Math.round((order.total - itemsSum) * 100) / 100;

  const created = new Date(order.createdAt);
  const createdLabel = Number.isNaN(created.getTime())
    ? order.createdAt
    : created.toLocaleString("es-ES", { dateStyle: "full", timeStyle: "short" });

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/pedidos"
        className="text-sm font-medium text-gold-dark underline-offset-4 hover:underline"
      >
        ← Volver a pedidos
      </Link>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Pedido</CardTitle>
            <span className="flex flex-wrap items-center gap-2">
              <Badge variant={statusBadgeVariant(order.status)}>{STATUS_LABELS[order.status]}</Badge>
              <Badge variant={fulfillmentBadgeVariant(order.fulfillment)}>
                {FULFILLMENT_LABELS[order.fulfillment]}
              </Badge>
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-warm-500">Cliente</dt>
              <dd className="mt-1 text-warm-900">{order.customerEmail ?? "Sin email"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-warm-500">Fecha</dt>
              <dd className="mt-1 text-warm-900">{createdLabel}</dd>
            </div>
            <div>
              <dt className="font-semibold text-warm-500">Pago</dt>
              <dd className="mt-1 text-warm-900">
                {order.paymentMethod === "cod" ? "Contrareembolso" : "Tarjeta (Stripe)"}
                {order.couponCode ? ` · cupón ${order.couponCode}` : ""}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-warm-500">
                {order.paymentMethod === "cod" ? "Referencia" : "Sesión de Stripe"}
              </dt>
              <dd className="mt-1 break-all font-mono text-xs text-warm-900">
                {order.stripe_session_id ?? "Sin referencia"}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-warm-500">Total</dt>
              <dd className="mt-1 text-lg font-bold text-warm-900">
                {formatPrice(order.total)}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Artículos</CardTitle>
        </CardHeader>
        <CardContent>
          {order.items.length === 0 ? (
            <p className="text-sm text-warm-500">Este pedido no registra artículos.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Formato</TableHead>
                  <TableHead className="text-right">Cant.</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.variantId}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.size_ml} ml</TableCell>
                    <TableCell className="text-right tabular-nums">{item.quantity}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {Number.isFinite(item.price) ? formatPrice(item.price) : "Sin precio"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {Number.isFinite(item.price) ? formatPrice(item.price * item.quantity) : "Sin precio"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {order.items.length > 0 && (
            <dl className="mt-4 ml-auto max-w-xs space-y-1.5 border-t border-warm-200 pt-4 text-sm">
              <div className="flex justify-between text-warm-600">
                <dt>Artículos (precio de lista)</dt>
                <dd className="tabular-nums">{formatPrice(itemsSum)}</dd>
              </div>
              <div className="flex justify-between text-warm-600">
                <dt>{adjustment >= 0 ? "Envío" : "Descuentos"}</dt>
                <dd className="tabular-nums">
                  {adjustment >= 0 ? "+" : "-"}
                  {formatPrice(Math.abs(adjustment))}
                </dd>
              </div>
              <div className="flex justify-between font-semibold text-warm-900">
                <dt>Total del pedido</dt>
                <dd className="tabular-nums">{formatPrice(order.total)}</dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Entrega</CardTitle>
        </CardHeader>
        <CardContent>
          {order.shipping ? (
            <address className="space-y-1 text-sm not-italic text-warm-900">
              <p className="font-medium">
                {order.shipping.firstName} {order.shipping.lastName}
              </p>
              <p>{order.shipping.address}</p>
              <p>
                {order.shipping.postalCode} {order.shipping.city}
              </p>
              {order.shipping.phone && (
                <p>
                  Teléfono:{" "}
                  <a href={`tel:${order.shipping.phone}`} className="text-gold-dark underline underline-offset-4">
                    {order.shipping.phone}
                  </a>
                </p>
              )}
              {order.shipping.notes && <p className="text-warm-600">Notas: {order.shipping.notes}</p>}
              {NON_PENINSULAR_POSTAL_PREFIXES.includes(order.shipping.postalCode.trim().slice(0, 2)) && (
                <p role="alert" className="mt-2 rounded-card bg-red-50 p-3 text-red-800">
                  Código postal fuera de la península: no hacemos este envío. Reembolsa o contacta con el cliente.
                </p>
              )}
            </address>
          ) : (
            <p className="text-sm text-warm-600">
              Este pedido no guardó la dirección de envío. Consúltala en el panel de Stripe.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cambiar estado del pago</CardTitle>
        </CardHeader>
        <CardContent>
          <ActionForm action={updateOrderStatus} successMessage="Estado del pago actualizado." className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <input type="hidden" name="orderId" value={order.id} />
            <div className="flex flex-col gap-1">
              <label htmlFor="nuevo-estado" className="text-sm font-medium text-warm-700">
                Nuevo estado del pago
              </label>
              <select
                id="nuevo-estado"
                name="status"
                defaultValue={order.status}
                className="h-10 rounded-card border border-warm-300 bg-white px-3 py-2 text-sm text-warm-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                {NEXT_STATUS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" size="sm">
              Guardar estado
            </Button>
          </ActionForm>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cambiar estado de envío</CardTitle>
        </CardHeader>
        <CardContent>
          <ActionForm
            action={updateFulfillmentStatus}
            successMessage="Estado del envío actualizado."
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <input type="hidden" name="orderId" value={order.id} />
            <div className="flex flex-col gap-1">
              <label htmlFor="nuevo-envio" className="text-sm font-medium text-warm-700">
                Nuevo estado del envío
              </label>
              <select
                id="nuevo-envio"
                name="fulfillment"
                defaultValue={order.fulfillment}
                className="h-10 rounded-card border border-warm-300 bg-white px-3 py-2 text-sm text-warm-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                {FULFILLMENT_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {FULFILLMENT_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" size="sm">
              Guardar envío
            </Button>
          </ActionForm>
        </CardContent>
      </Card>
    </div>
  );
}
