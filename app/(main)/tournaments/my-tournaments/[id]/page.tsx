import { Suspense } from "react"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Trophy,
  Calendar,
  MapPin,
  Users,
  ArrowLeft,
  Clock,
  CheckCircle,
  Ban,
  PauseCircle,
  Phone,
  Mail,
  TrendingUp,
  Building,
} from "lucide-react"
import Link from "next/link"
import TournamentDetailsTabs from "@/components/tournament/tournament-details-tab"
import TournamentFullLayout from "@/components/tournament/tournament-full-layout"
import { getAllPlayersDTO } from "@/app/api/players/actions"
import { getTournamentDetailsWithInscriptions } from "@/app/api/tournaments/actions"
import StartTournamentButton from "@/components/tournament/club/start-tournament"
import CancelTournamentButton from "@/components/tournament/club/cancel-tournament"
import WinnerImageSection from "@/components/tournament/winner-image-section"
import PreTournamentImageSection from "@/components/tournament/pre-tournament-image-section"

// Componente de carga para usar con Suspense
function TournamentDetailsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <Skeleton className="h-8 w-3/4 mb-4" />
        <Skeleton className="h-4 w-1/2 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        </div>
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  )
}

async function getData(id: string) {
  try {
    // Usar las funciones de la API en lugar de llamadas directas a Supabase
    const { tournament, inscriptions } = await getTournamentDetailsWithInscriptions(id)
    
    if (!tournament) {
      notFound()
    }

    // Transformar las inscripciones individuales a la estructura esperada
    const individualInscriptions = inscriptions
      .filter((inscription: any) => inscription.player_id && !inscription.couple_id)
      .map((inscription: any) => {
        // Si la inscripción tiene el jugador nested en 'player', usarlo
        if (inscription.player && inscription.player.length > 0) {
          return inscription.player[0]
        }
        // Si no, crear el objeto con los datos disponibles
        return {
          id: inscription.player_id,
          first_name: null,
          last_name: null,
          score: null,
          dni: null,
          phone: null,
        }
      })
    
    // Transformar las inscripciones de parejas a la estructura esperada
    const coupleInscriptions = inscriptions
      .filter((inscription: any) => inscription.couple_id)
      .map((inscription: any) => {
        // Si la inscripción tiene la pareja nested en 'couple', usarla
        if (inscription.couple && inscription.couple.length > 0) {
          const couple = inscription.couple[0]
          return {
            id: couple.id,
            tournament_id: id,
            player_1_id: couple.player1_id,
            player_2_id: couple.player2_id,
            created_at: couple.created_at || new Date().toISOString(),
            player_1_info: couple.player1 && couple.player1.length > 0 ? couple.player1[0] : null,
            player_2_info: couple.player2 && couple.player2.length > 0 ? couple.player2[0] : null,
          }
        }
        // Si no, crear el objeto con los datos disponibles
        return {
          id: inscription.couple_id,
          tournament_id: id,
          player_1_id: null,
          player_2_id: null,
          created_at: inscription.created_at || new Date().toISOString(),
          player_1_info: null,
          player_2_info: null,
        }
      })

    const allPlayers = await getAllPlayersDTO()

    // Obtener inscripciones pendientes (si las hay)
    const pendingInscriptions = inscriptions
      .filter((inscription: any) => inscription.status === 'PENDING')
      .map((inscription: any) => ({
        id: inscription.id,
        couple_id: inscription.couple_id,
        created_at: inscription.created_at,
        couple: inscription.couple && inscription.couple.length > 0 ? inscription.couple[0] : null,
      }))

    return {
      tournament,
      individualInscriptions,
      coupleInscriptions,
      allPlayers,
      pendingInscriptions,
    }
  } catch (error) {
    console.error("Error fetching tournament data:", error)
    notFound()
  }
}

// Obtener icono según el estado
function getStatusIcon(status: string) {
  switch (status) {
    case "NOT_STARTED":
      return <Clock className="h-5 w-5" />
    case "PAIRING":
      return <PauseCircle className="h-5 w-5" />
    case "IN_PROGRESS":
      return <TrendingUp className="h-5 w-5" />
    case "FINISHED":
      return <CheckCircle className="h-5 w-5" />
    case "CANCELED":
      return <Ban className="h-5 w-5" />
    default:
      return <Trophy className="h-5 w-5" />
  }
}

// Obtener color según el estado
function getStatusColor(status: string) {
  switch (status) {
    case "NOT_STARTED":
      return "bg-amber-100 text-amber-700 border-amber-200"
    case "PAIRING":
      return "bg-blue-100 text-blue-700 border-blue-200"
    case "IN_PROGRESS":
      return "bg-emerald-100 text-emerald-700 border-emerald-200"
    case "FINISHED":
      return "bg-slate-100 text-slate-700 border-slate-200"
    case "CANCELED":
      return "bg-red-100 text-red-700 border-red-200"
    default:
      return "bg-gray-100 text-gray-700 border-gray-200"
  }
}

// Obtener texto según el estado
function getStatusText(status: string) {
  switch (status) {
    case "NOT_STARTED":
      return "Próximamente"
    case "PAIRING":
      return "Emparejamiento"
    case "IN_PROGRESS":
      return "En curso"
    case "FINISHED":
      return "Finalizado"
    case "CANCELED":
      return "Cancelado"
    default:
      return status
  }
}

// Formatear fecha
function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
}

// Componente principal
export default async function TournamentDetailsPage({ params }: { params: { id: string } }) {
  const resolvedParams = await params;
  const { tournament, individualInscriptions, coupleInscriptions, allPlayers, pendingInscriptions } = await getData(resolvedParams.id)

  // Configurar el máximo de jugadores (podría venir del torneo en el futuro)
  const maxPlayers = tournament.max_participants || 32

  // Preparar el status badge
  const statusBadge = (
    <span
      className={`px-4 py-2 rounded-xl font-medium border ${getStatusColor(
        tournament.status,
      )} flex items-center gap-2`}
    >
      {getStatusIcon(tournament.status)}
      {getStatusText(tournament.status)}
    </span>
  )

  // Preparar los action buttons
  const actionButtons = (
    <>
      {tournament.status === "NOT_STARTED" && (
        <>
          <StartTournamentButton 
            tournamentId={resolvedParams.id}
            tournament={tournament}
            couplesCount={coupleInscriptions.length}
            playersCount={individualInscriptions.length}
          />
          <CancelTournamentButton
            tournamentId={resolvedParams.id}
            tournament={tournament}
            couplesCount={coupleInscriptions.length}
            playersCount={individualInscriptions.length}
          />
        </>
      )}
      {(tournament.status === "IN_PROGRESS" || tournament.status === "PAIRING") && (
        <CancelTournamentButton
          tournamentId={resolvedParams.id}
          tournament={tournament}
          couplesCount={coupleInscriptions.length}
          playersCount={individualInscriptions.length}
        />
      )}
    </>
  )

  return (
    <Suspense fallback={<TournamentDetailsLoading />}>
      <TournamentFullLayout
        tournament={tournament}
        individualInscriptions={individualInscriptions}
        coupleInscriptions={coupleInscriptions}
        maxPlayers={maxPlayers}
        allPlayers={allPlayers}
        pendingInscriptions={pendingInscriptions}
        backUrl="/tournaments/my-tournaments"
        backLabel="Volver a Mis Torneos"
        statusBadge={statusBadge}
        actionButtons={actionButtons}
      />

      {/* Pre-Tournament and Winner Image Sections - TODO: Integrate as modals */}
      {tournament.status === "NOT_STARTED" && (
        <div className="hidden">
          <PreTournamentImageSection
            tournament={tournament}
            tournamentId={resolvedParams.id}
            clubCoverImageUrl={tournament.clubes?.cover_image_url}
          />
        </div>
      )}
      {tournament.status === "FINISHED" && (
        <div className="hidden">
          <WinnerImageSection
            tournament={tournament}
            tournamentId={resolvedParams.id}
          />
        </div>
      )}
    </Suspense>
  )
} 