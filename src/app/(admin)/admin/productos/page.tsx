import type { Metadata } from "next";
import { SafeImage } from "@/components/ui/SafeImage";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { countProducts, readProductsPage } from "../_lib/queries";
import { getAdminUser } from "../_lib/admin-auth";
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
import { Pagination } from "../_components/Pagination";

export const metadata: Metadata = {
  title: "Productos | Administración SILLAGE",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

interface ProductosPageProps {
  searchParams: { q?: string; page?: string };
}

function hrefFor(q: string, page: number): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
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
  const rawPage = Number.parseInt(searchParams.page ?? "1", 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  let rows: Awaited<ReturnType<typeof readProductsPage>> | null = null;
  let total = 0;
  let loadError: string | null = null;
  try {
    total = await countProducts(search || undefined);
    const totalPagesPre = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const queryPage = Math.min(page, totalPagesPre);
    rows = await readProductsPage({
      search: search || undefined,
      limit: PAGE_SIZE,
      offset: (queryPage - 1) * PAGE_SIZE,
    });
  } catch (err) {
    loadError = err instanceof Error ? err.message : "No se pudieron cargar los productos.";
  }

  const totalPages = Math.max(1, Math.ceil((total || 0) / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-3xl font-bold text-warm-900">Productos</h2>
          <p className="mt-1 text-sm tabular-nums text-warm-500">
            {loadError ? "Error al cargar" : `${total} en catálogo`}
          </p>
        </div>
        <Link href="/admin/productos/nuevo">
          <Button size="sm">
            <Plus className="h-4 w-4" aria-hidden /> Nuevo producto
          </Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Catálogo</CardTitle>
          <form method="get" className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <label htmlFor="busqueda-producto" className="sr-only">
              Buscar por nombre, marca o slug
            </label>
            <Input
              id="busqueda-producto"
              name="q"
              type="search"
              placeholder="Buscar por nombre, marca…"
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
              No se pudieron cargar los productos: {loadError}
            </p>
          ) : !rows || (rows.length === 0 && total === 0) ? (
            <p className="p-4 text-sm text-warm-500">
              {search ? "Ningún producto coincide con la búsqueda." : "Aún no hay productos. Crea el primero."}
            </p>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead className="text-right">Desde</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead>
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
                            <span className="block font-medium text-warm-900">{p.name}</span>
                            <span className="block text-xs tabular-nums text-warm-500">
                              {p.variant_count} {p.variant_count === 1 ? "variante" : "variantes"}
                              {p.badge ? ` · ${p.badge.replace("_", " ")}` : ""}
                            </span>
                          </span>
                        </span>
                      </TableCell>
                      <TableCell>{p.brand}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {p.min_price === null ? "—" : formatPrice(p.min_price)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {p.total_stock === 0 ? (
                          <Badge variant="danger">0</Badge>
                        ) : (
                          String(p.total_stock)
                        )}
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
              <Pagination
                page={safePage}
                totalPages={totalPages}
                hrefFor={(pg) => hrefFor(search, pg)}
                totalLabel={`${total} productos`}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
