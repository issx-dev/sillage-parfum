import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { countOrders, readOrdersPage } from "@/lib/data/orders";
import { getAdminUser } from "../_lib/admin-auth";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AutoSubmitForm } from "../_components/AutoSubmitForm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { STATUS_FILTERS, STATUS_LABELS, statusBadgeVariant, type StatusFilter } from "../_lib/estado";
import { isOrderStatus } from "../_lib/queries";
import {
  FULFILLMENT_LABELS,
  FULFILLMENT_STATUSES,
  fulfillmentBadgeVariant,
  isFulfillmentStatus,
  type FulfillmentStatus,
} from "@/lib/data/fulfillment";
import { Pagination } from "../_components/Pagination";

export const metadata: Metadata = {
  title: "Pedidos | Administración SILLAGE",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" });
}

interface PedidosPageProps {
  searchParams: { estado?: string; envio?: string; q?: string; page?: string };
}

type FulfillmentFilter = FulfillmentStatus | "all";

const FULFILLMENT_FILTERS: { value: FulfillmentFilter; label: string }[] = [
  { value: "all", label: "Envío: todos" },
  ...FULFILLMENT_STATUSES.map((value) => ({ value, label: FULFILLMENT_LABELS[value] })),
];

function hrefFor(base: { estado: string; envio: string; q: string }, page: number): string {
  const params = new URLSearchParams();
  if (base.estado !== "all") params.set("estado", base.estado);
  if (base.envio !== "all") params.set("envio", base.envio);
  if (base.q) params.set("q", base.q);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/admin/pedidos?${qs}` : "/admin/pedidos";
}

export default async function PedidosPage({ searchParams }: PedidosPageProps) {
  // Defensa en profundidad (H4): el middleware es el gate principal; aquí se
  // revalida el rol antes de leer PII (emails de pedidos).
  const admin = await getAdminUser();
  if (!admin || admin.role !== "admin") {
    redirect("/login");
  }
  const estadoParam = searchParams.estado ?? "all";
  const estado: StatusFilter = isOrderStatus(estadoParam) ? estadoParam : "all";
  const envioParam = searchParams.envio ?? "all";
  const envio: FulfillmentFilter = isFulfillmentStatus(envioParam) ? envioParam : "all";
  const emailQuery = (searchParams.q ?? "").trim();
  const rawPage = Number.parseInt(searchParams.page ?? "1", 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-3xl font-bold text-warm-900">Pedidos</h2>
        <p className="mt-1 text-sm tabular-nums text-warm-500">
          Filtros instantáneos por estado, envío y email
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
          <AutoSubmitForm className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <label htmlFor="filtro-estado" className="sr-only">
              Filtrar por estado
            </label>
            <select
              id="filtro-estado"
              key={`estado-${estado}`}
              name="estado"
              defaultValue={estado}
              className="h-10 rounded-card border border-warm-300 bg-white px-3 py-2 text-sm text-warm-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              {STATUS_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <label htmlFor="filtro-envio" className="sr-only">
              Filtrar por estado de envío
            </label>
            <select
              id="filtro-envio"
              key={`envio-${envio}`}
              name="envio"
              defaultValue={envio}
              className="h-10 rounded-card border border-warm-300 bg-white px-3 py-2 text-sm text-warm-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              {FULFILLMENT_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <label htmlFor="busqueda-email" className="sr-only">
              Buscar por email
            </label>
            <Input
              id="busqueda-email"
              name="q"
              type="search"
              placeholder="Buscar por email…"
              defaultValue={searchParams.q ?? ""}
              className="sm:max-w-xs"
            />
          </AutoSubmitForm>
        </CardHeader>
        <CardContent>
          {/* Solo esta región se refresca al filtrar; cabecera y filtros ni se inmutan. */}
          <Suspense
            key={`${estado}::${envio}::${emailQuery}::${page}`}
            fallback={<ResultadosSkeleton />}
          >
            <PedidosResultados estado={estado} envio={envio} emailQuery={emailQuery} page={page} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

function ResultadosSkeleton() {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Filtrando pedidos">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-16 animate-pulse rounded-lg bg-warm-100" />
      ))}
    </div>
  );
}

async function PedidosResultados({
  estado,
  envio,
  emailQuery,
  page,
}: {
  estado: StatusFilter;
  envio: FulfillmentFilter;
  emailQuery: string;
  page: number;
}) {
  let orders: Awaited<ReturnType<typeof readOrdersPage>> | null = null;
  let total = 0;
  let loadError: string | null = null;
  try {
    const filter = {
      status: estado === "all" ? undefined : estado,
      fulfillment: envio === "all" ? undefined : envio,
      email: emailQuery || undefined,
    };
    total = await countOrders(filter);
    const totalPagesPre = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const queryPage = Math.min(page, totalPagesPre);
    orders = await readOrdersPage({ ...filter, limit: PAGE_SIZE, offset: (queryPage - 1) * PAGE_SIZE });
  } catch (err) {
    loadError = err instanceof Error ? err.message : "No se pudieron cargar los pedidos.";
  }

  const totalPages = Math.max(1, Math.ceil((total || 0) / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const base = {
    estado: estado === "all" ? "all" : estado,
    envio: envio === "all" ? "all" : envio,
    q: emailQuery,
  };

  if (loadError) {
    return (
      <p role="alert" className="rounded-card bg-red-50 p-4 text-sm text-red-800">
        No se pudieron cargar los pedidos: {loadError}
      </p>
    );
  }
  if (!orders || (orders.length === 0 && total === 0)) {
    return (
      <p className="p-4 text-sm text-warm-500">
        {estado !== "all" || envio !== "all" || emailQuery
          ? "Ningún pedido coincide con los filtros aplicados."
          : "Todavía no hay pedidos registrados."}
      </p>
    );
  }
  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Envío</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead className="text-right">
              <span className="sr-only">Detalle</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">
                {order.customerEmail ?? "—"}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatPrice(order.total)}
              </TableCell>
              <TableCell>
                <Badge variant={statusBadgeVariant(order.status)}>{STATUS_LABELS[order.status]}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={fulfillmentBadgeVariant(order.fulfillment ?? "pendiente")}>
                  {FULFILLMENT_LABELS[order.fulfillment ?? "pendiente"]}
                </Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap">{formatDate(order.createdAt)}</TableCell>
              <TableCell className="text-right">
                <Link
                  href={`/admin/pedidos/${order.id}`}
                  className="text-sm font-medium text-gold-dark underline-offset-4 hover:underline"
                >
                  Ver detalle
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Pagination
        page={safePage}
        totalPages={totalPages}
        hrefFor={(p) => hrefFor(base, p)}
        totalLabel={`${total} pedidos`}
      />
    </div>
  );
}
