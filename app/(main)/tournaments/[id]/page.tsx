// app/(main)/tournaments/[id]/page.tsx
import TournamentDetailsClient from './tournament-details-client';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

// Component to show while loading
function TournamentLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-emerald-50 p-8">
      <div className="space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-14 w-1/2 max-w-md mx-auto" />
        <Skeleton className="h-6 w-3/4 max-w-md mx-auto" />
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TournamentPage({ params }: { params: { id: string } }) {
  console.log("[TournamentPage] Rendering page with params:", params);
  
  // Validate params
  if (!params?.id) {
    console.error("[TournamentPage] Missing tournament ID in params");
    return notFound();
  }
  
  // Directly use the client component with proper Suspense
  return (
    <Suspense fallback={<TournamentLoading />}>
      <TournamentDetailsClient params={params} />
    </Suspense>
  );
}

