import type { Metadata } from "next";
import { Suspense } from "react";
import { SafeImage } from "@/components/ui/SafeImage";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { countProducts, readProductCounts, readProductsPage } from "../_lib/queries";
import { isProductFilter, LOW_STOCK_THRESHOLD, type ProductFilter } from "../_lib/stock-level";
import { FilterChips } from "../_components/FilterChips";
import { getAdminUser } from "../_lib/admin-auth";
import { applyDiscount, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AutoSubmitForm } from "../_components/AutoSubmitForm";
import { ProductQuickEdit } from "./_components/ProductQuickEdit";
import { ToastOnParam } from "../_components/ToastOnParam";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "../_components/Pagination";

export const metadata: Metadata = {
  title: "Productos | Administración SILLAGE",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

interface ProductosPageProps {
  searchParams: { q?: string; filtro?: string; page?: string };
}

function hrefFor(q: string, filtro: ProductFilter, page: number): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (filtro !== "all") params.set("filtro", filtro);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/admin/productos?${qs}` : "/admin/productos";
}

export default async function ProductosPage({ searchParams }: ProductosPageProps) {
  const admin = await getAdminUser();
  if (!admin || admin.role !== "admin") {
    redirect("/login");
  }
  const search = (searchParams.q ?? "").trim();
  const filtro: ProductFilter = isProductFilter(searchParams.filtro) ? searchParams.filtro : "all";
  const rawPage = Number.parseInt(searchParams.page ?? "1", 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  return (
    <div className="space-y-6">
      <Suspense>
        <ToastOnParam />
      </Suspense>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-3xl font-bold text-warm-900">Productos</h2>
          <p className="mt-1 text-sm text-warm-500">Lo que la tienda muestra, y lo que necesita atención</p>
        </div>
        <Link href="/admin/productos/nuevo">
          <Button size="sm">
            <Plus className="h-4 w-4" aria-hidden /> Nuevo producto
          </Button>
        </Link>
      </div>
      <Suspense fallback={null}>
        <CatalogoChips filtro={filtro} search={search} />
      </Suspense>
      <Card>
        <CardHeader>
          <CardTitle>Catálogo</CardTitle>
          <AutoSubmitForm className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <label htmlFor="busqueda-producto" className="sr-only">
              Buscar por nombre, marca o inspiración
            </label>
            <Input
              id="busqueda-producto"
              name="q"
              type="search"
              placeholder="Buscar por nombre, marca, inspiración…"
              defaultValue={search}
              className="sm:max-w-xs"
            />
          </AutoSubmitForm>
        </CardHeader>
        <CardContent>
          {/* Solo esta región se refresca al filtrar; cabecera y filtros ni se inmutan. */}
          <Suspense key={`${search}::${filtro}::${page}`} fallback={<ResultadosSkeleton />}>
            <CatalogoResultados search={search} filtro={filtro} page={page} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

async function CatalogoChips({ filtro, search }: { filtro: ProductFilter; search: string }) {
  const counts = await readProductCounts().catch(() => null);
  const items: { label: string; filtro: ProductFilter; count: number | null }[] = [
    { label: "Todos", filtro: "all", count: counts?.total ?? null },
    { label: "En oferta", filtro: "sale", count: counts?.sale ?? null },
    { label: "Sin stock", filtro: "out", count: counts?.out ?? null },
    { label: "Ocultos en la tienda", filtro: "hidden", count: counts?.hidden ?? null },
  ];
  return (
    <FilterChips
      label="Filtros rápidos del catálogo"
      chips={items.map((i) => ({
        label: i.label,
        count: i.count,
        active: filtro === i.filtro,
        href: hrefFor(search, i.filtro, 1),
      }))}
    />
  );
}

function PriceFrom({ price, discount }: { price: number | null; discount: number }) {
  if (price === null) return <span className="text-warm-500">Sin precio</span>;
  if (discount > 0) {
    return (
      <span className="tabular-nums">
        {formatPrice(applyDiscount(price, discount))}
        <span className="ml-1.5 text-xs text-warm-500 line-through">{formatPrice(price)}</span>
      </span>
    );
  }
  return <span className="tabular-nums">{formatPrice(price)}</span>;
}

function StockCell({ stock }: { stock: number }) {
  if (stock === 0) return <Badge variant="danger">Sin stock</Badge>;
  if (stock <= LOW_STOCK_THRESHOLD) return <Badge variant="warning">{stock} (bajo)</Badge>;
  return <span className="tabular-nums">{stock}</span>;
}

function ResultadosSkeleton() {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Filtrando productos">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-16 animate-pulse rounded-lg bg-warm-100" />
      ))}
    </div>
  );
}

async function CatalogoResultados({ search, filtro, page }: { search: string; filtro: ProductFilter; page: number }) {
  let rows: Awaited<ReturnType<typeof readProductsPage>> | null = null;
  let total = 0;
  let loadError: string | null = null;
  try {
    total = await countProducts(search || undefined, filtro);
    const totalPagesPre = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const queryPage = Math.min(page, totalPagesPre);
    rows = await readProductsPage({
      search: search || undefined,
      filter: filtro,
      limit: PAGE_SIZE,
      offset: (queryPage - 1) * PAGE_SIZE,
    });
  } catch (err) {
    loadError = err instanceof Error ? err.message : "No se pudieron cargar los productos.";
  }

  const totalPages = Math.max(1, Math.ceil((total || 0) / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  if (loadError) {
    return (
      <p role="alert" className="rounded-card bg-red-50 p-4 text-sm text-red-800">
        No se pudieron cargar los productos: {loadError}
      </p>
    );
  }
  if (!rows || (rows.length === 0 && total === 0)) {
    return (
      <p className="p-4 text-sm text-warm-500">
        {search || filtro !== "all" ? "Ningún producto coincide con los filtros." : "Aún no hay productos. Crea el primero."}
      </p>
    );
  }
  return (
    <div className="space-y-4">
      {/* Móvil: tarjetas con lo esencial y la acción a mano */}
      <ul className="space-y-3 md:hidden">
        {rows.map((p) => (
          <li key={p.product_id} className="rounded-card border border-warm-200 bg-warm-50 p-4">
            <div className="flex items-start gap-3">
              {p.images[0] ? (
                <SafeImage
                  src={p.images[0]}
                  alt=""
                  width={56}
                  height={56}
                  className="h-14 w-14 shrink-0 rounded-lg border border-warm-200 object-cover"
                />
              ) : (
                <span
                  aria-hidden
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-warm-200 bg-warm-100 font-serif text-lg font-bold text-warm-500"
                >
                  {p.name.charAt(0)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <ProductQuickEdit productId={p.product_id} productName={p.name} />
                <p className="text-sm text-warm-600">{p.brand}</p>
                <p className="mt-1 text-sm">
                  <PriceFrom price={p.min_price} discount={p.discount_percent} />
                  <span className="mx-2 text-warm-400" aria-hidden>
                    ·
                  </span>
                  <StockCell stock={p.total_stock} />
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <span className="flex flex-wrap gap-1.5">
                {p.valid_variant_count === 0 && <Badge variant="danger">Oculto: sin variante con precio</Badge>}
                {p.discount_percent > 0 && <Badge variant="warning">-{p.discount_percent}%</Badge>}
              </span>
              <Link
                href={`/admin/productos/${p.product_id}`}
                className="inline-flex min-h-[44px] items-center text-sm font-medium text-gold-dark underline-offset-4 hover:underline"
              >
                Editar variantes y precios
              </Link>
            </div>
          </li>
        ))}
      </ul>

      <div className="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Producto</TableHead>
            <TableHead>Marca</TableHead>
            <TableHead className="text-right">Desde</TableHead>
            <TableHead className="text-right">Stock</TableHead>
            <TableHead className="text-right">
              <span className="sr-only">Editar</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((p) => (
            <TableRow key={p.product_id}>
              <TableCell>
                <span className="flex items-center gap-3">
                  {p.images[0] ? (
                    <SafeImage
                      src={p.images[0]}
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
                      {p.name.charAt(0)}
                    </span>
                  )}
                  <span>
                    <ProductQuickEdit productId={p.product_id} productName={p.name} />
                    <span className="block text-xs tabular-nums text-warm-500">
                      {p.variant_count} {p.variant_count === 1 ? "variante" : "variantes"}
                      {p.badge ? ` · ${p.badge.replace("_", " ")}` : ""}
                      {p.inspiration ? ` · Inspirado en ${p.inspiration}` : ""}
                    </span>
                    <span className="mt-1 flex flex-wrap gap-1.5">
                      {p.valid_variant_count === 0 && <Badge variant="danger">Oculto: sin variante con precio</Badge>}
                      {p.discount_percent > 0 && <Badge variant="warning">-{p.discount_percent}%</Badge>}
                    </span>
                  </span>
                </span>
              </TableCell>
              <TableCell>{p.brand}</TableCell>
              <TableCell className="text-right">
                <PriceFrom price={p.min_price} discount={p.discount_percent} />
              </TableCell>
              <TableCell className="text-right">
                <StockCell stock={p.total_stock} />
              </TableCell>
              <TableCell className="text-right">
                <Link
                  href={`/admin/productos/${p.product_id}`}
                  className="text-sm font-medium text-gold-dark underline-offset-4 hover:underline"
                >
                  Editar
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
      <Pagination
        page={safePage}
        totalPages={totalPages}
        hrefFor={(pg) => hrefFor(search, filtro, pg)}
        totalLabel={`${total} productos`}
      />
    </div>
  );
}
