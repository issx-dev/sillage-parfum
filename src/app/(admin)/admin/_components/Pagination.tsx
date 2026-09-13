import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  /** Construye el href de una página conservando el resto de params. */
  hrefFor: (page: number) => string;
  totalLabel: string;
}

/**
 * Paginación server-side por querystring (?page=N). Sin JS: enlaces GET
 * que conservan filtros y búsqueda.
 */
export function Pagination({ page, totalPages, hrefFor, totalLabel }: PaginationProps) {
  if (totalPages <= 1) {
    return <p className="text-[13px] tabular-nums text-warm-500">{totalLabel}</p>;
  }

  // Ventana de páginas alrededor de la actual (máx 5 números).
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  const numbers: number[] = [];
  for (let p = start; p <= end; p++) numbers.push(p);

  const btn =
    "inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg px-2 text-sm font-medium tabular-nums transition-colors";
  const idle = "text-warm-700 hover:bg-warm-200/60";
  const current = "bg-warm-900 font-semibold text-cream";
  const disabled = "pointer-events-none opacity-35";

  return (
    <nav aria-label="Paginación" className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-[13px] tabular-nums text-warm-500">
        {totalLabel} · página {page} de {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <Link
          href={hrefFor(Math.max(1, page - 1))}
          aria-label="Página anterior"
          aria-disabled={page <= 1}
          className={`${btn} ${idle} ${page <= 1 ? disabled : ""}`}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </Link>
        {numbers.map((p) => (
          <Link
            key={p}
            href={hrefFor(p)}
            aria-label={`Página ${p}`}
            aria-current={p === page ? "page" : undefined}
            className={`${btn} ${p === page ? current : idle}`}
          >
            {p}
          </Link>
        ))}
        <Link
          href={hrefFor(Math.min(totalPages, page + 1))}
          aria-label="Página siguiente"
          aria-disabled={page >= totalPages}
          className={`${btn} ${idle} ${page >= totalPages ? disabled : ""}`}
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </nav>
  );
}
