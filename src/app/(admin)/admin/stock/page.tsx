import type { Metadata } from "next";
import { SafeImage } from "@/components/ui/SafeImage";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { countVariantStock, readVariantStock } from "../_lib/queries";
import { getAdminUser } from "../_lib/admin-auth";
import { updateVariantStock } from "./actions";
import { Pagination } from "../_components/Pagination";

export const metadata: Metadata = {
  title: "Stock | Administración SILLAGE",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** A partir de este nivel (inclusive) el stock se marca como bajo. */
const LOW_STOCK_THRESHOLD = 5;
const PAGE_SIZE = 20;

interface StockPageProps {
  searchParams: { q?: string; page?: string };
}

function hrefFor(q: string, page: number): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
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
  const rawPage = Number.parseInt(searchParams.page ?? "1", 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  let rows: Awaited<ReturnType<typeof readVariantStock>> | null = null;
  let total = 0;
  let lowCount = 0;
  let loadError: string | null = null;
  try {
    total = await countVariantStock(search || undefined);
    const totalPagesPre = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const queryPage = Math.min(page, totalPagesPre);
    rows = await readVariantStock(search || undefined, {
      limit: PAGE_SIZE,
      offset: (queryPage - 1) * PAGE_SIZE,
    });
    lowCount = rows.filter((row) => row.stock <= LOW_STOCK_THRESHOLD).length;
  } catch (err) {
    loadError = err instanceof Error ? err.message : "No se pudo cargar el stock.";
  }

  const totalPages = Math.max(1, Math.ceil((total || 0) / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-3xl font-bold text-warm-900">Stock</h2>
          <p className="mt-1 text-sm tabular-nums text-warm-500">
            {loadError ? "Error al cargar" : `${total} variantes en total`}
          </p>
        </div>
        {rows && rows.length > 0 ? (
          <Badge variant={lowCount > 0 ? "warning" : "success"}>
            {lowCount > 0
              ? `${lowCount} con stock bajo (≤ ${LOW_STOCK_THRESHOLD}) en esta página`
              : "Stock en niveles normales"}
          </Badge>
        ) : null}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Variantes</CardTitle>
          <form method="get" className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <label htmlFor="busqueda-stock" className="sr-only">
              Buscar por producto o SKU
            </label>
            <Input
              id="busqueda-stock"
              name="q"
              type="search"
              placeholder="Buscar por producto o SKU…"
              defaultValue={search}
              className="sm:max-w-xs"
            />
            <Button type="submit" size="sm">
              Buscar
            </Button>
          </form>
        </CardHeader>
        <CardContent>
          {loadError ? (
            <p role="alert" className="rounded-card bg-red-50 p-4 text-sm text-red-800">
              No se pudo cargar el stock: {loadError}
            </p>
          ) : !rows || (rows.length === 0 && total === 0) ? (
            <p className="p-4 text-sm text-warm-500">
              {search
                ? "Ninguna variante coincide con la búsqueda."
                : "No hay variantes registradas en la base de datos."}
            </p>
          ) : (
            <div className="space-y-4">
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
                          <form
                            action={updateVariantStock}
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
                              min={0}
                              max={999999}
                              step={1}
                              defaultValue={row.stock}
                              required
                              className="h-9 w-20 rounded-card border border-warm-300 bg-white px-2 py-1 text-right text-sm tabular-nums text-warm-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                            />
                            <Button type="submit" size="sm" variant="outline">
                              Guardar
                            </Button>
                          </form>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <Pagination
                page={safePage}
                totalPages={totalPages}
                hrefFor={(p) => hrefFor(search, p)}
                totalLabel={`${total} variantes`}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
