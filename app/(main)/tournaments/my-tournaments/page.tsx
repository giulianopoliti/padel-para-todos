import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import TournamentsTabs from "@/components/tournament/tournament-tabs"
import { getClubTournaments } from "@/app/api/tournaments/actions"
import { Button } from "@/components/ui/button"
import { Plus, Trophy, BarChart3 } from "lucide-react"
import Link from "next/link"

// Componente de carga para usar con Suspense
function TournamentsLoading() {
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="flex justify-between items-center">
          <div className="space-y-3">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-12 w-48" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
            <Skeleton className="h-6 w-3/4 mb-4" />
            <Skeleton className="h-4 w-1/2 mb-6" />
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
            <Skeleton className="h-10 w-full" />
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

  const totalTournaments = tournaments?.length || 0
  const activeTournaments = (pairingTournaments?.length || 0) + (inProgressTournaments?.length || 0)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={<TournamentsLoading />}>
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  {/* Left side: Title and Description */}
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="bg-slate-100 p-3 rounded-xl">
                        <Trophy className="h-7 w-7 text-slate-600" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold text-slate-900">Gestión de Torneos</h1>
                        <p className="text-slate-600 mt-1">{club?.name || "Tu club"}</p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 mt-6">
                      <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <BarChart3 className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Total de torneos</p>
                          <p className="text-lg font-semibold text-slate-900">{totalTournaments}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="bg-emerald-100 p-2 rounded-lg">
                          <Trophy className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Activos</p>
                          <p className="text-lg font-semibold text-slate-900">{activeTournaments}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right side: Create Tournament Button */}
                  <div className="flex-shrink-0">
                    <Button
                      asChild
                      className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl shadow-sm"
                    >
                      <Link href="/tournaments/my-tournaments/create" className="flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        Crear Nuevo Torneo
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs Section */}
            <TournamentsTabs
              notStartedTournaments={notStartedTournaments || []}
              pairingTournaments={pairingTournaments || []}
              inProgressTournaments={inProgressTournaments || []}
              finishedTournaments={finishedTournaments || []}
              canceledTournaments={canceledTournaments || []}
              clubAddress={club?.address}
            />
          </div>
        </Suspense>
      </div>
    </div>
  )
} 