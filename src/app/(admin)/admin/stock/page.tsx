import type { Metadata } from "next";
import { Suspense } from "react";
import { SafeImage } from "@/components/ui/SafeImage";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
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
import { countVariantStock, readStockCounts, readVariantStock } from "../_lib/queries";
import { LOW_STOCK_THRESHOLD, isStockLevel, type StockLevel } from "../_lib/stock-level";
import { FilterChips } from "../_components/FilterChips";
import { getAdminUser } from "../_lib/admin-auth";
import { updateVariantStock } from "./actions";
import { ActionForm } from "../_components/ActionForm";
import { Pagination } from "../_components/Pagination";

export const metadata: Metadata = {
  title: "Stock | Administración SILLAGE",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

interface StockPageProps {
  searchParams: { q?: string; nivel?: string; page?: string };
}

function hrefFor(q: string, nivel: StockLevel, page: number): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (nivel !== "all") params.set("nivel", nivel);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/admin/stock?${qs}` : "/admin/stock";
}

export default async function StockPage({ searchParams }: StockPageProps) {
  // Defensa en profundidad (H4): revalidar rol antes de leer datos de gestión.
  const admin = await getAdminUser();
  if (!admin || admin.role !== "admin") {
    redirect("/login");
  }
  const search = (searchParams.q ?? "").trim();
  const nivel: StockLevel = isStockLevel(searchParams.nivel) ? searchParams.nivel : "all";
  const rawPage = Number.parseInt(searchParams.page ?? "1", 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-3xl font-bold text-warm-900">Stock</h2>
        <p className="mt-1 text-sm tabular-nums text-warm-500">
          Lo agotado y lo que está a punto de agotarse, primero
        </p>
      </div>
      <Suspense fallback={null}>
        <StockChips nivel={nivel} search={search} />
      </Suspense>
      <Card>
        <CardHeader>
          <CardTitle>Variantes</CardTitle>
          <AutoSubmitForm className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <label htmlFor="busqueda-stock" className="sr-only">
              Buscar por producto, SKU o inspiración
            </label>
            <Input
              id="busqueda-stock"
              name="q"
              type="search"
              placeholder="Buscar por producto, SKU, inspiración…"
              defaultValue={search}
              className="sm:max-w-xs"
            />
          </AutoSubmitForm>
        </CardHeader>
        <CardContent>
          {/* Solo esta región se refresca al filtrar; cabecera y filtros ni se inmutan. */}
          <Suspense key={`${search}::${nivel}::${page}`} fallback={<ResultadosSkeleton />}>
            <StockResultados search={search} nivel={nivel} page={page} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

async function StockChips({ nivel, search }: { nivel: StockLevel; search: string }) {
  const counts = await readStockCounts().catch(() => null);
  const items: { label: string; nivel: StockLevel; count: number | null }[] = [
    { label: "Todas", nivel: "all", count: counts?.total ?? null },
    { label: "Agotadas", nivel: "out", count: counts?.out ?? null },
    { label: `Stock bajo (hasta ${LOW_STOCK_THRESHOLD})`, nivel: "low", count: counts?.low ?? null },
  ];
  return (
    <FilterChips
      label="Filtros rápidos de stock"
      chips={items.map((i) => ({
        label: i.label,
        count: i.count,
        active: nivel === i.nivel,
        href: hrefFor(search, i.nivel, 1),
      }))}
    />
  );
}

function StockForm({ row }: { row: Awaited<ReturnType<typeof readVariantStock>>[number] }) {
  return (
    <ActionForm
      action={updateVariantStock}
      successMessage="Stock actualizado."
      className="inline-flex items-center justify-end gap-2"
    >
      <input type="hidden" name="variantId" value={row.variant_id} />
      <label htmlFor={`stock-${row.variant_id}`} className="sr-only">
        Stock de {row.product_name} {row.size_ml} ml
      </label>
      <input
        id={`stock-${row.variant_id}`}
        name="stock"
        type="number"
        inputMode="numeric"
        min={0}
        max={999999}
        step={1}
        defaultValue={row.stock}
        required
        className="h-11 w-24 rounded-card border border-warm-500 bg-warm-50 px-3 text-right text-base tabular-nums text-warm-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-dark/50 md:h-10 md:w-20 md:text-sm"
      />
      <Button type="submit" size="sm" variant="outline">
        Guardar
      </Button>
    </ActionForm>
  );
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <Badge variant="danger">Agotado</Badge>;
  if (stock <= LOW_STOCK_THRESHOLD) return <Badge variant="warning">Stock bajo</Badge>;
  return <Badge variant="success">Disponible</Badge>;
}

function Thumb({ src, name }: { src: string | null; name: string }) {
  return src ? (
    <SafeImage
      src={src}
      alt=""
      width={48}
      height={48}
      className="h-12 w-12 shrink-0 rounded-lg border border-warm-200 object-cover"
    />
  ) : (
    <span
      aria-hidden
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-warm-200 bg-warm-100 font-serif text-lg font-bold text-warm-500"
    >
      {name.charAt(0)}
    </span>
  );
}

function ResultadosSkeleton() {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Filtrando variantes">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-16 animate-pulse rounded-lg bg-warm-100" />
      ))}
    </div>
  );
}

async function StockResultados({ search, nivel, page }: { search: string; nivel: StockLevel; page: number }) {
  let rows: Awaited<ReturnType<typeof readVariantStock>> | null = null;
  let total = 0;
  let loadError: string | null = null;
  try {
    total = await countVariantStock(search || undefined, nivel);
    const totalPagesPre = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const queryPage = Math.min(page, totalPagesPre);
    rows = await readVariantStock(search || undefined, {
      limit: PAGE_SIZE,
      offset: (queryPage - 1) * PAGE_SIZE,
      level: nivel,
    });
  } catch (err) {
    loadError = err instanceof Error ? err.message : "No se pudo cargar el stock.";
  }

  const totalPages = Math.max(1, Math.ceil((total || 0) / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  if (loadError) {
    return (
      <p role="alert" className="rounded-card bg-red-50 p-4 text-sm text-red-800">
        No se pudo cargar el stock: {loadError}
      </p>
    );
  }
  if (!rows || (rows.length === 0 && total === 0)) {
    return (
      <p className="p-4 text-sm text-warm-500">
        {search || nivel !== "all"
          ? "Ninguna variante coincide con los filtros."
          : "No hay variantes registradas en la base de datos."}
      </p>
    );
  }
  return (
    <div className="space-y-4">
      {/* Móvil: una tarjeta por variante, con el campo de stock a mano */}
      <ul className="space-y-3 md:hidden">
        {rows.map((row) => (
          <li key={row.variant_id} className="rounded-card border border-warm-200 bg-warm-50 p-4">
            <div className="flex items-center gap-3">
              <Thumb src={row.product_image} name={row.product_name} />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/productos/${row.product_id}`}
                  className="block truncate font-medium text-warm-900"
                >
                  {row.product_name}
                </Link>
                <p className="text-sm tabular-nums text-warm-600">
                  {row.size_ml} ml · {formatPrice(row.price)}
                </p>
                <p className="font-mono text-xs text-warm-500">{row.sku}</p>
              </div>
              <StockBadge stock={row.stock} />
            </div>
            <div className="mt-3 flex justify-end">
              <StockForm row={row} />
            </div>
          </li>
        ))}
      </ul>

      <div className="hidden md:block">
      <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Stock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const out = row.stock === 0;
              const low = !out && row.stock <= LOW_STOCK_THRESHOLD;
              return (
                <TableRow key={row.variant_id}>
                  <TableCell>
                    <span className="flex items-center gap-3">
                      {row.product_image ? (
                        <SafeImage
                          src={row.product_image}
                          alt=""
                          width={48}
                          height={48}
                          className="h-12 w-12 shrink-0 rounded-lg border border-warm-200 object-cover"
                        />
                      ) : (
                        <span
                          aria-hidden
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-warm-200 bg-warm-100 font-serif text-lg font-bold text-warm-400"
                        >
                          {row.product_name.charAt(0)}
                        </span>
                      )}
                      <span>
                        <Link
                          href={`/admin/productos/${row.product_id}`}
                          className="block font-medium text-warm-900 underline-offset-4 hover:underline"
                        >
                          {row.product_name}
                        </Link>
                        <span className="block text-[13px] font-normal tabular-nums text-warm-500">
                          {row.size_ml} ml
                        </span>
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{row.sku}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatPrice(row.price)}
                  </TableCell>
                  <TableCell>
                    {out ? (
                      <Badge variant="danger">Agotado</Badge>
                    ) : low ? (
                      <Badge variant="warning">Stock bajo</Badge>
                    ) : (
                      <Badge variant="success">Disponible</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <StockForm row={row} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <Pagination
        page={safePage}
        totalPages={totalPages}
        hrefFor={(p) => hrefFor(search, nivel, p)}
        totalLabel={`${total} variantes`}
      />
    </div>
  );
}
