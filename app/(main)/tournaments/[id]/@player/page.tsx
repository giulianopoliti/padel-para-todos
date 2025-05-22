/*import React from "react"
import { Suspense } from "react"
import { notFound } from "next/navigation"
import PlayerTournamentClient from "@/components/tournament/player/player-tournament-client"
import { getTournamentById } from "@/app/api/tournaments/actions"
import { getCategoryByName } from "@/app/api/categories/actions"
import { getClubById } from "@/app/api/users"
import { getCouplesByTournamentId, getPlayersByTournamentId } from "@/app/api/tournaments/actions"
import { Skeleton } from "@/components/ui/skeleton"
import { getAllPlayersDTO } from "@/app/api/players/actions"
// Componente de carga para usar con Suspense
function TournamentLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6 space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
        <Skeleton className="h-8 w-1/4 mb-4" />
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  )
}

export default async function PlayerTournamentPage({ params: { id: tournamentId } }: { params: { id: string } }) {
  // Obtener datos del torneo desde el servidor
  const tournamentData = await getTournamentById(tournamentId)
  if (!tournamentData) {
    notFound()
  }

  // Obtener datos relacionados
  const categoryData = tournamentData.category ? await getCategoryByName(tournamentData.category) : null
  const clubData = tournamentData.club?.id ? await getClubById(tournamentData.club.id) : null
  const playersData = await getPlayersByTournamentId(tournamentId)
  const rawCouplesData = await getCouplesByTournamentId(tournamentId)
  const playersDTO = await getAllPlayersDTO();

  // Enrich couplesData with player names from playersDTO
  const processedCouplesData = rawCouplesData.map(couple => {
    // Default to empty strings or null if player IDs are missing, though they should exist for a valid couple
    const player1Id = couple.player1_id;
    const player2Id = couple.player2_id;

    const player1Info = player1Id ? playersDTO.find(p => p.id === player1Id) : null;
    const player2Info = player2Id ? playersDTO.find(p => p.id === player2Id) : null;
    console.log(`In map - Player 1 DTO:`, player1Info, `Player 2 DTO:`, player2Info); // Debug log

    return {
      ...couple, // Spread all properties from the 'couples' table row (id, created_at, etc.)
      player_1_info: player1Info ? { id: player1Info.id, first_name: player1Info.first_name, last_name: player1Info.last_name, score: player1Info.score } : null,
      player_2_info: player2Info ? { id: player2Info.id, first_name: player2Info.first_name, last_name: player2Info.last_name, score: player2Info.score } : null,
    };
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={<TournamentLoading />}>
          <PlayerTournamentClient
            tournament={tournamentData}
            category={categoryData}
            club={clubData}
            players={playersData}
            couples={processedCouplesData}
            allPlayersForSearch={playersDTO}
          />
        </Suspense>
      </div>
    </div>
  )
}
*/