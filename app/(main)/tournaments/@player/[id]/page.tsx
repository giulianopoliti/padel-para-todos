import { Suspense } from "react"
import { notFound } from "next/navigation"
import PlayerTournamentClient from "@/components/tournament/player/player-tournament-client"
import { Skeleton } from "@/components/ui/skeleton"
import { getTournamentById } from "@/app/api/tournaments"
import { getCategories } from "@/app/api/users"
import { getClubById } from "@/app/api/users"
import { getCouplesByTournamentId } from "@/app/api/couples/actions"
import { getPlayersByTournamentId } from "@/app/api/tournaments/actions"
import { getRankedPlayers } from "@/app/api/users"

function TournamentLoading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-6 py-12">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <Skeleton className="h-10 w-3/4 mx-auto" />
            <Skeleton className="h-6 w-1/2 mx-auto" />
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function PlayerTournamentPage({ params }: { params: { id: string } }) {
  // Await params before using its properties
  const { id: tournamentId } = await params
  
  // Obtener datos del torneo desde Supabase
  const tournamentData = await getTournamentById(tournamentId)
  if (!tournamentData) {
    notFound()
  }

  // Obtener datos relacionados en paralelo
  const [categoryData, clubData, playersData, rawCouplesData, allPlayers] = await Promise.all([
    // Obtener categoría por nombre
    tournamentData.category ? 
      getCategories().then(categories => categories.find(cat => cat.name === tournamentData.category) || null) : 
      Promise.resolve(null),
    // Obtener club si existe
    tournamentData.club?.id ? getClubById(tournamentData.club.id) : Promise.resolve(null),
    // Obtener jugadores del torneo
    getPlayersByTournamentId(tournamentId),
    // Obtener parejas del torneo
    getCouplesByTournamentId(tournamentId),
    // Obtener todos los jugadores para el buscador
    getRankedPlayers({ pageSize: 1000 }) // Obtener una cantidad grande de jugadores
  ])

  // Transformar Player a PlayerDTO para el componente
  const playersDTO = allPlayers.players.map((player: any) => ({
    id: player.id,
    first_name: player.firstName,
    last_name: player.lastName,
    dni: player.id, // Usando id como fallback para dni
    score: player.score
  }))

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-6 py-12">
        <Suspense fallback={<TournamentLoading />}>
          <PlayerTournamentClient
            tournament={tournamentData}
            category={categoryData}
            club={clubData}
            players={playersData}
            couples={rawCouplesData}
            allPlayersForSearch={playersDTO}
          />
        </Suspense>
      </div>
    </div>
  )
}
