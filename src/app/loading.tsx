// loading.tsx, Next.js usa este arquivo como Suspense boundary automático
// Exibe um skeleton da estrutura da página enquanto os componentes carrega
export default function Loading() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 bg-muted animate-pulse rounded" />
          <div className="h-6 w-24 bg-muted animate-pulse rounded" />
        </div>

        {/* KPI cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-muted/50 border border-border/50 rounded-lg animate-pulse" />
          ))}
        </div>

        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-[350px] bg-muted/50 border border-border/50 rounded-lg animate-pulse" />
          <div className="h-[350px] bg-muted/50 border border-border/50 rounded-lg animate-pulse" />
        </div>

        {/* Bar chart skeleton */}
        <div className="h-[350px] bg-muted/50 border border-border/50 rounded-lg animate-pulse" />
      </div>
    </main>
  )
}