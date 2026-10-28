import Link from "next/link";

export interface FilterChip {
  label: string;
  href: string;
  count: number | null;
  active: boolean;
}

/** One-click filters with counts. Plain links, so they work without JS and keep the URL as the state. */
export function FilterChips({ label, chips }: { label: string; chips: FilterChip[] }) {
  return (
    <nav aria-label={label} className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <Link
          key={chip.label}
          href={chip.href}
          aria-current={chip.active ? "page" : undefined}
          className={`inline-flex min-h-[40px] items-center gap-2 rounded-full border px-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-dark ${
            chip.active
              ? "border-charcoal bg-charcoal text-cream"
              : "border-warm-300 bg-warm-50 text-warm-800 hover:border-warm-500"
          }`}
        >
          {chip.label}
          {chip.count !== null && (
            <span className={`text-xs tabular-nums ${chip.active ? "text-cream/80" : "text-warm-600"}`}>
              {chip.count}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}
