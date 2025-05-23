import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import TournamentsTabs from "@/components/tournament/tournament-tabs"
import { getClubTournaments } from "../tournaments/my-tournaments/actions"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import CreateTournamentClientButton from "@/components/tournament/CreateTournamentClientButton"

// Componente de carga para usar con Suspense
function TournamentsLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-4 text-center">
        <Skeleton className="h-14 w-64 mx-auto rounded-xl" />
        <Skeleton className="h-6 w-96 max-w-md mx-auto rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto px-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-lg">
            <Skeleton className="h-3 w-full" />
            <div className="p-6">
              <Skeleton className="h-8 w-3/4 mb-4 rounded-lg" />
              <Skeleton className="h-5 w-1/2 mb-6 rounded-md" />
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
              </div>
              <Skeleton className="h-10 w-full rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Componente principal (renderizado en el servidor)
export default async function MyTournamentsPage() {
  const result = await getClubTournaments()
  const tournaments = result.tournaments
  const club = (result as any).club

  // Agrupar torneos por estado
  const notStartedTournaments = tournaments?.filter((t: any) => t.status === "NOT_STARTED")
  const pairingTournaments = tournaments?.filter((t: any) => t.status === "PAIRING")
  const inProgressTournaments = tournaments?.filter((t: any) => t.status === "IN_PROGRESS")
  const finishedTournaments = tournaments?.filter((t: any) => t.status === "FINISHED")
  const canceledTournaments = tournaments?.filter((t: any) => t.status === "CANCELED")

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-emerald-50">
      <div className="container mx-auto px-4 py-16">
        <Suspense fallback={<TournamentsLoading />}>
          <div className="max-w-6xl mx-auto space-y-12">
            {/* Header Section */}
            <div className="flex justify-between items-start mb-10">
              {/* Left side: Title and Description */}
              <div className="text-left">
                <h1 className="text-5xl font-bold bg-gradient-to-r from-violet-600 to-emerald-500 bg-clip-text text-transparent mb-6">
                  Mis Torneos
                </h1>
                <p className="text-slate-600 max-w-2xl text-xl font-light">
                  Gestiona todos los torneos organizados por {club?.name || "tu club"}
                </p>
              </div>
              {/* Right side: Create Tournament Button (Client Component) */}
              <CreateTournamentClientButton />
            </div>

            {/* Tabs Section - Centered */}
            <div className="flex justify-center">
              <TournamentsTabs
                notStartedTournaments={notStartedTournaments || []}
                pairingTournaments={pairingTournaments || []}
                inProgressTournaments={inProgressTournaments || []}
                finishedTournaments={finishedTournaments || []}
                canceledTournaments={canceledTournaments || []}
                clubAddress={club?.address}
              />
            </div>
          </div>
        </Suspense>
      </div>
    </div>
  )
}
