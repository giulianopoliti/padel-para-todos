import { Suspense } from "react"
import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import TournamentsTabs from "@/components/tournament/tournament-tabs"
import { getClubTournaments } from "../tournaments/my-tournaments/actions"

// Componente de carga para usar con Suspense
function TournamentsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-10 w-3/4 max-w-md mx-auto" />
        <Skeleton className="h-6 w-1/2 max-w-sm mx-auto" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="border border-slate-100 rounded-lg overflow-hidden">
            <div className="h-2 bg-slate-200"></div>
            <div className="p-6 pb-2">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
            </div>
            <div className="px-6 pb-2">
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100">
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


// Componente principal (renderizado en el servidor)
export default async function MyTournamentsPage() {
  const result = await getClubTournaments(); 
  const tournaments = result.tournaments;
  const club = (result as any).club;

  // Agrupar torneos por estado, providing default empty array for filters if tournaments is undefined
  const notStartedTournaments = tournaments?.filter((t: any) => t.status === "NOT_STARTED") || [];
  const pairingTournaments = tournaments?.filter((t: any) => t.status === "PAIRING") || [];
  const inProgressTournaments = tournaments?.filter((t: any) => t.status === "IN_PROGRESS") || [];
  const finishedTournaments = tournaments?.filter((t: any) => t.status === "FINISHED") || [];
  const canceledTournaments = tournaments?.filter((t: any) => t.status === "CANCELED") || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={<TournamentsLoading />}>
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-light text-teal-700 mb-2">Mis Torneos</h1>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Gestiona todos los torneos organizados por {club?.name || "tu club"}
              </p>
            </div>

            {/* Componente cliente para las interacciones del usuario */}
            <TournamentsTabs
              notStartedTournaments={notStartedTournaments}
              pairingTournaments={pairingTournaments}
              inProgressTournaments={inProgressTournaments}
              finishedTournaments={finishedTournaments}
              canceledTournaments={canceledTournaments}
              clubAddress={club?.address}
            />
          </div>
        </Suspense>
      </div>
    </div>
  )
}
