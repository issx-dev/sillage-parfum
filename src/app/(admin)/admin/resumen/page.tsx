import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, TriangleAlert } from "lucide-react";
import { readOrders } from "@/lib/data/orders";
import { getAdminUser } from "../_lib/admin-auth";
import { computeResumen } from "../_lib/stats";
import { STATUS_LABELS } from "../_lib/estado";
import { readVariantStock } from "../_lib/queries";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Resumen | Administración SILLAGE",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const LOW_STOCK_THRESHOLD = 5;

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-card border border-warm-200 bg-white p-5 shadow-card">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-warm-500">{label}</p>
      <p className="mt-2 font-serif text-[2rem] font-bold leading-none tabular-nums text-warm-900">{value}</p>
      <p className="mt-2 text-[13px] tabular-nums text-warm-500">{hint}</p>
    </div>
  );
}

export default async function ResumenPage() {
  const admin = await getAdminUser();
  if (!admin || admin.role !== "admin") {
    redirect("/login");
  }

  const [ordersResult, stockResult] = await Promise.allSettled([readOrders(), readVariantStock(undefined)]);

  if (ordersResult.status === "rejected") {
    return (
      <p role="alert" className="rounded-card bg-red-50 p-4 text-sm text-red-800">
        No se pudieron cargar los datos:{" "}
        {ordersResult.reason instanceof Error ? ordersResult.reason.message : "error desconocido"}
      </p>
    );
  }

  const orders = ordersResult.value;
  const stats = computeResumen(orders);
  const maxDay = Math.max(1, ...stats.serie.map((d) => d.total));
  const recent = [...orders]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 5);

  const lowStock =
    stockResult.status === "fulfilled"
      ? stockResult.value.filter((r) => r.stock <= LOW_STOCK_THRESHOLD)
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-3xl font-bold text-warm-900">
          Buenas, {admin.name.split(" ")[0]}.
        </h2>
        <p className="mt-1 text-sm text-warm-500">Así va la maison hoy.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Kpi label="Ingresos" value={formatPrice(stats.ingresos)} hint={`${stats.numPagados} pedidos cobrados`} />
        <Kpi label="Pedidos" value={String(stats.numPedidos)} hint="todos los estados" />
        <Kpi label="Ticket medio" value={formatPrice(stats.ticketMedio)} hint="sobre pedidos cobrados" />
        <Kpi
          label="Reembolsos"
          value={formatPrice(stats.reembolsos.amount)}
          hint={`${stats.reembolsos.count} devueltos · ${stats.fallidos} fallidos`}
        />
      </div>

      {lowStock !== null && lowStock.length > 0 ? (
        <Link
          href="/admin/stock"
          className="flex items-center gap-3 rounded-card border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900 transition-colors hover:bg-amber-100/70"
        >
          <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden />
          <span>
            <strong className="font-semibold">{lowStock.length} variantes con stock bajo</strong>
            {lowStock.slice(0, 3).map((r) => ` · ${r.product_name} (${r.size_ml}ml: ${r.stock})`).join("")}
            {lowStock.length > 3 ? "…" : ""} — revisar stock
          </span>
        </Link>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex items-baseline justify-between gap-3">
            <CardTitle>Ingresos · últimos 14 días</CardTitle>
            <p className="text-sm tabular-nums text-warm-500">
              total <strong className="font-semibold text-warm-900">{formatPrice(stats.ingresos)}</strong>
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div
            className="flex h-40 items-end gap-1.5 border-b border-warm-200 pb-0"
            role="img"
            aria-label="Ingresos diarios de los últimos 14 días"
          >
            {stats.serie.map((d) => (
              <div key={d.day} className="group relative flex-1 self-stretch">
                <div
                  className="absolute inset-x-0 bottom-0 rounded-t-[3px] bg-gold/75 transition-colors group-hover:bg-gold-dark"
                  style={{ height: `${Math.max(2, Math.round((d.total / maxDay) * 100))}%` }}
                  title={`${d.day}: ${formatPrice(d.total)}`}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs tabular-nums text-warm-500">
            <span>{stats.serie[0]?.day ?? ""}</span>
            <span>{stats.serie[stats.serie.length - 1]?.day ?? ""}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Últimos pedidos</CardTitle>
            <Link
              href="/admin/pedidos"
              className="inline-flex items-center gap-1 text-sm font-medium text-gold-dark underline-offset-4 hover:underline"
            >
              Ver todos <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="!p-0">
          {recent.length === 0 ? (
            <p className="p-5 text-sm text-warm-500">Todavía no hay pedidos registrados.</p>
          ) : (
            <ul className="divide-y divide-warm-200">
              {recent.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/admin/pedidos/${o.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-warm-100/60"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-warm-900">{o.customerEmail ?? "—"}</p>
                      <p className="mt-0.5 text-xs tabular-nums text-warm-500">
                        {new Date(o.createdAt).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <Badge variant={o.status === "paid" ? "success" : o.status === "failed" ? "danger" : "warning"}>
                        {STATUS_LABELS[o.status]}
                      </Badge>
                      <span className="min-w-[4.5rem] text-right text-sm font-semibold tabular-nums text-warm-900">
                        {formatPrice(o.total)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
