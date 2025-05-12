// app/(main)/tournaments/[id]/page.tsx
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Component to show while loading
function TournamentLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-emerald-50 p-8">
      <div className="space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-14 w-1/2 max-w-md mx-auto" />
        <Skeleton className="h-6 w-3/4 max-w-md mx-auto" />
      </div>
    </div>
  );
}

export default function TournamentPage() {
  // Esta página solo sirve como placeholder mientras se carga la vista correcta
  // El contenido real vendrá de las vistas paralelas (@player, @club, @public)
  return (
    <Suspense fallback={<TournamentLoading />}>
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-emerald-50">
        {/* El contenido real se renderizará a través de las vistas paralelas */}
      </div>
    </Suspense>
  );
}

