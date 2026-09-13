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
              <dd className="mt-1 text-warm-900">{order.customerEmail ?? "—"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-warm-500">Fecha</dt>
              <dd className="mt-1 text-warm-900">{createdLabel}</dd>
            </div>
            <div>
              <dt className="font-semibold text-warm-500">Sesión de Stripe</dt>
              <dd className="mt-1 break-all font-mono text-xs text-warm-900">
                {order.stripe_session_id ?? "—"}
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
                      {formatPrice(item.price)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatPrice(item.price * item.quantity)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
