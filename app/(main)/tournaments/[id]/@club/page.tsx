import { Suspense } from "react"
import { notFound } from "next/navigation"
import TournamentDetailsClient from "../tournament-details-client"
import { getTournamentById, getMatchesByTournamentId, getInscriptionsByTournamentId, getPlayersByTournamentId } from "@/app/api/tournaments/actions"
import { getCouplesByTournamentId } from "@/app/api/couples/actions"
import { Skeleton } from "@/components/ui/skeleton"

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

export default async function TournamentDetailsPage({ params }: { params: { id: string } }) {
  const tournamentId = params.id;
  console.log(`[ClubPage] Rendering for tournament ID: ${tournamentId}`);

  let tournamentData: any = null;
  let categoryData: any = null;
  let matchesData: any[] = [];
  let couplesData: any[] = [];
  let inscriptionsData: any[] = [];
  let singlePlayersData: any[] = [];

  try {
    tournamentData = await getTournamentById(tournamentId);

    if (!tournamentData) {
      console.log(`[ClubPage] Tournament not found for ID: ${tournamentId}`);
      notFound();
    }

    console.log("[ClubPage] Tournament data:", tournamentData);

    // La categoría debería venir de tournamentData.categories
    categoryData = tournamentData.categories || null;
    console.log("[ClubPage] Category data:", categoryData);

    // Comentamos temporalmente las otras llamadas para aislar problemas
    // matchesData = await getMatchesByTournamentId(tournamentId);
    // couplesData = await getCouplesByTournamentId(tournamentId);
    // inscriptionsData = await getInscriptionsByTournamentId(tournamentId);
    // singlePlayersData = await getPlayersByTournamentId(tournamentId);

    // console.log("[ClubPage] Matches:", matchesData);
    // console.log("[ClubPage] Couples:", couplesData);
    // console.log("[ClubPage] Inscriptions:", inscriptionsData);
    // console.log("[ClubPage] Single Players:", singlePlayersData);

  } catch (error: any) {
    console.error(`[ClubPage] Error fetching data for tournament ${tournamentId}:`, error.message);
    // Podrías retornar un mensaje de error aquí o dejar que notFound() se maneje si tournamentData es null
    // Por ahora, si hay un error en getTournamentById, notFound() ya lo habrá manejado.
    // Si el error es en las llamadas comentadas, no afectará el renderizado inicial.
  }
  
  if (!tournamentData) {
    // Esto no debería alcanzarse si notFound() funciona, pero como fallback:
    return <div>Error: Torneo no encontrado o error al cargar datos.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <p className="text-center text-blue-500 font-semibold mb-4">Vista del Club para: {tournamentData.name || tournamentId}</p>
      <Suspense fallback={<TournamentLoading />}>
        <TournamentDetailsClient
          initialTournament={tournamentData} 
          initialCategory={categoryData} 
          initialMatches={matchesData}       // Pasando array vacío temporalmente
          initialCouples={couplesData}       // Pasando array vacío temporalmente
          initialInscriptions={inscriptionsData} // Pasando array vacío temporalmente
          initialSinglePlayers={singlePlayersData} // Pasando array vacío temporalmente
        />
      </Suspense>
    </div>
  );
}
