export default function AdminLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Cargando panel">
      <div>
        <div className="h-9 w-64 animate-pulse rounded-lg bg-warm-200" />
        <div className="mt-2 h-4 w-40 animate-pulse rounded bg-warm-200/70" />
      </div>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-card border border-warm-200 bg-white p-5 shadow-card">
            <div className="h-3 w-24 animate-pulse rounded bg-warm-200" />
            <div className="mt-3 h-8 w-28 animate-pulse rounded bg-warm-200/70" />
            <div className="mt-2 h-3 w-32 animate-pulse rounded bg-warm-200/50" />
          </div>
        ))}
      </div>
      <div className="h-48 animate-pulse rounded-card border border-warm-200 bg-white" />
    </div>
  );
}
