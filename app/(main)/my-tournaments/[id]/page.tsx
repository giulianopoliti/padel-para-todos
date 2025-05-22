import React from "react"
import { Suspense } from "react"
import { redirect, notFound } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
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
  Play
} from "lucide-react"
import Link from "next/link"
import TournamentDetailsTabs from "@/components/tournament/tournament-details-tab"
import {  getTournamentDetailsWithInscriptions, startTournament, startTournament2 } from "@/app/api/tournaments/actions"
import { getAllPlayersDTO } from "@/app/api/players/actions"
import PlayerCoupleForm from "@/components/tournament/couple-registration/forms/player-couple-form"
import StartTournamentButton from "@/components/tournament/club/start-tournament"
// Componente de carga para usar con Suspense
function TournamentDetailsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-10 w-3/4 max-w-md" />
        <Skeleton className="h-6 w-1/2 max-w-sm" />
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
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


// Función para obtener los detalles del torneo
async function getData(tournamentId: string) {
  const supabase = await createClient()

  // 1. Verificar autenticación del usuario
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !authUser) {
    redirect("/login") // Redirect to login if not authenticated
  }

  // Create an explicitly plain user object for the result
  const plainUser = {
    id: authUser.id,
    email: authUser.email,
    // Add any other specific, primitive properties you need from authUser
    // Avoid passing the whole authUser object if it might contain non-plain parts
  };

  // 2. Obtener detalles del torneo e inscripciones
  const { tournament, inscriptions: rawInscriptions } = await getTournamentDetailsWithInscriptions(tournamentId)

  if (!tournament) {
    // Si el torneo no se encuentra (devuelto como null por la acción), mostrar notFound
    notFound()
  }

  console.log("Inscripciones recibidas:", JSON.stringify(rawInscriptions, null, 2));

  // Define an interface for the shape of a plain inscription object
  interface PlainPlayerDetail {
    id: string;
    first_name: string | null;
    last_name: string | null;
    score: number | null;
    phone?: string | null; 
    created_at: string | null; 
    dni?: string | null; 
  }

  interface PlainCoupleDetail {
    id: string;
    created_at: string | null; 
    player1: PlainPlayerDetail[] | null; 
    player2: PlainPlayerDetail[] | null; 
  }

  interface PlainInscription {
    id: string;
    created_at: string | null; 
    phone: string | null;
    is_pending: boolean;
    tournament_id: string;
    player: PlainPlayerDetail[] | null; 
    couple: PlainCoupleDetail[] | null; 
  }

  // 3. Obtener todos los jugadores para búsqueda
  const allPlayers = await getAllPlayersDTO()

  // 4. Separar inscripciones individuales y parejas
  const individualInscriptions = (rawInscriptions as PlainInscription[])
    .filter((insc: PlainInscription) => !insc.couple || insc.couple.length === 0)
    .map((insc: PlainInscription) => ({
      id: insc.player && insc.player.length > 0 ? insc.player[0]?.id : insc.id, // Guard for insc.player
      first_name: insc.player && insc.player.length > 0 ? insc.player[0]?.first_name : null,
      last_name: insc.player && insc.player.length > 0 ? insc.player[0]?.last_name : null,
      dni: insc.player && insc.player.length > 0 ? insc.player[0]?.dni : null,
      phone: insc.player && insc.player.length > 0 ? insc.player[0]?.phone : null,
      score: insc.player && insc.player.length > 0 ? insc.player[0]?.score : null
    }));
    
  const coupleInscriptions = (rawInscriptions as PlainInscription[])
    .filter((insc: PlainInscription) => insc.couple && insc.couple.length > 0)
    .map((insc: PlainInscription) => ({
      id: insc.id,
      tournament_id: tournament.id,
      player_1_id: insc.couple && insc.couple.length > 0 && insc.couple[0].player1 && insc.couple[0].player1.length > 0 ? insc.couple[0].player1[0]?.id : null,
      player_2_id: insc.couple && insc.couple.length > 0 && insc.couple[0].player2 && insc.couple[0].player2.length > 0 ? insc.couple[0].player2[0]?.id : null,
      player_1_info: {
        id: insc.couple && insc.couple.length > 0 && insc.couple[0].player1 && insc.couple[0].player1.length > 0 ? insc.couple[0].player1[0]?.id : null,
        first_name: insc.couple && insc.couple.length > 0 && insc.couple[0].player1 && insc.couple[0].player1.length > 0 ? insc.couple[0].player1[0]?.first_name : null,
        last_name: insc.couple && insc.couple.length > 0 && insc.couple[0].player1 && insc.couple[0].player1.length > 0 ? insc.couple[0].player1[0]?.last_name : null,
        dni: insc.couple && insc.couple.length > 0 && insc.couple[0].player1 && insc.couple[0].player1.length > 0 ? insc.couple[0].player1[0]?.dni : null,
        score: insc.couple && insc.couple.length > 0 && insc.couple[0].player1 && insc.couple[0].player1.length > 0 ? insc.couple[0].player1[0]?.score : null
      },
      player_2_info: {
        id: insc.couple && insc.couple.length > 0 && insc.couple[0].player2 && insc.couple[0].player2.length > 0 ? insc.couple[0].player2[0]?.id : null,
        first_name: insc.couple && insc.couple.length > 0 && insc.couple[0].player2 && insc.couple[0].player2.length > 0 ? insc.couple[0].player2[0]?.first_name : null,
        last_name: insc.couple && insc.couple.length > 0 && insc.couple[0].player2 && insc.couple[0].player2.length > 0 ? insc.couple[0].player2[0]?.last_name : null,
        dni: insc.couple && insc.couple.length > 0 && insc.couple[0].player2 && insc.couple[0].player2.length > 0 ? insc.couple[0].player2[0]?.dni : null,
        score: insc.couple && insc.couple.length > 0 && insc.couple[0].player2 && insc.couple[0].player2.length > 0 ? insc.couple[0].player2[0]?.score : null
      },
      created_at: insc.created_at || new Date().toISOString(), // Fallback for created_at
      status: "ACTIVE"
    }));

  const result = { tournament, individualInscriptions, coupleInscriptions, user: plainUser, allPlayers };
  try {
    // Ensure the entire result passed from getData to the Server Component is plain
    return JSON.parse(JSON.stringify(result));
  } catch (e: any) {
    console.error("Error stringifying/parsing result in getData:", e, result);
    // Handle error appropriately, perhaps by returning a structure that leads to an error page
    // For now, rethrow or return a structure that leads to `notFound()` if critical data is missing.
    // This situation indicates a severe problem with the data if it can't even be stringified.
    throw new Error(`Failed to serialize data in getData: ${e.message}`);
  }
}

// Obtener icono según el estado
function getStatusIcon(status: string) {
  switch (status) {
    case "NOT_STARTED":
      return <Clock className="h-5 w-5 text-amber-500" />
    case "PAIRING":
      return <PauseCircle className="h-5 w-5 text-violet-500" />
    case "IN_PROGRESS":
      return <Trophy className="h-5 w-5 text-emerald-500" />
    case "FINISHED":
      return <CheckCircle className="h-5 w-5 text-blue-500" />
    case "CANCELED":
      return <Ban className="h-5 w-5 text-rose-500" />
    default:
      return <Trophy className="h-5 w-5 text-emerald-500" />
  }
}

// Obtener color según el estado
function getStatusColor(status: string) {
  switch (status) {
    case "NOT_STARTED":
      return "bg-amber-50 text-amber-700 border-amber-200"
    case "PAIRING":
      return "bg-violet-50 text-violet-700 border-violet-200"
    case "IN_PROGRESS":
      return "bg-emerald-50 text-emerald-700 border-emerald-200"
    case "FINISHED":
      return "bg-blue-50 text-blue-700 border-blue-200"
    case "CANCELED":
      return "bg-rose-50 text-rose-700 border-rose-200"
    default:
      return "bg-slate-100 text-slate-700 border-slate-200"
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
  const { tournament, individualInscriptions, coupleInscriptions, allPlayers } = await getData(params.id)

  // Configurar el máximo de jugadores (podría venir del torneo en el futuro)
  const maxPlayers = tournament.max_participants || 32

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-emerald-50">
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={<TournamentDetailsLoading />}>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <Button asChild className="flex items-center gap-2 bg-gradient-to-r from-teal-400 to-blue-400 text-white hover:from-teal-500 hover:to-blue-500 hover:text-white">
                <Link href="/my-tournaments">
                  <ArrowLeft className="h-4 w-4" />
                  Volver a Mis Torneos
                </Link>
              </Button>
              <div className="flex items-center">
                {tournament.status === "NOT_STARTED" && (
                  <StartTournamentButton tournamentId={params.id} />
                )}
                <span
                  className={`px-3 py-1.5 rounded-full font-medium ${getStatusColor(
                    tournament.status,
                  )} flex items-center gap-2`}
                >
                  {getStatusIcon(tournament.status)}
                  {getStatusText(tournament.status)}
                </span>
              </div>
            </div>

            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-emerald-500 bg-clip-text text-transparent mb-2">
                {tournament.name}
              </h1>
              <p className="text-slate-600 max-w-2xl mx-auto">{tournament.clubes?.name}</p>
            </div>

            <Card className="bg-white rounded-xl shadow-md border border-slate-100 hover:border-violet-100 transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-medium bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
                  Información del Torneo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-teal-600" />
                      <span className="text-teal-700 font-medium">Fechas:</span>
                      <span className="ml-2 text-slate-600">
                        {formatDate(tournament.start_date)} - {formatDate(tournament.end_date)}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Trophy className="h-5 w-5 mr-2 text-teal-600" />
                      <span className="text-teal-700 font-medium">Categoría:</span>
                      <span className="ml-2 inline-block bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full text-sm font-medium border border-teal-100">
                        {tournament.categories?.name || "No especificada"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Trophy className="h-5 w-5 mr-2 text-teal-600" />
                      <span className="text-teal-700 font-medium">Tipo:</span>
                      <span className="ml-2 text-slate-600">
                        {tournament.type === "AMERICAN" ? "Americano" : "Eliminación"}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        <MapPin className="h-5 w-5 mr-2 text-emerald-600" />
                      </div>
                      <div>
                        <span className="text-slate-700 font-medium">Dirección:</span>
                        <div className="ml-2 text-slate-600">
                          <div>{tournament.clubes?.address || "No especificada"}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 mr-2 text-emerald-600" />
                      <span className="text-slate-700 font-medium">Teléfono:</span>
                      <span className="ml-2 text-slate-600">{tournament.clubes?.phone || "No especificado"}</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 mr-2 text-emerald-600" />
                      <span className="text-slate-700 font-medium">Email:</span>
                      <span className="ml-2 text-slate-600">{tournament.clubes?.email || "No especificado"}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-violet-600" />
                      <span className="text-slate-700 font-medium">Inscripciones:</span>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-slate-600">
                        <span className="font-medium text-violet-700">{individualInscriptions.length}</span> de{" "}
                        <span className="font-medium text-violet-700">{maxPlayers}</span> jugadores individuales
                      </span>
                      <span className="text-slate-600">
                        <span className="font-medium text-emerald-700">{coupleInscriptions.length}</span> parejas
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Componente cliente para las pestañas */}
            <TournamentDetailsTabs
              individualInscriptions={individualInscriptions}
              coupleInscriptions={coupleInscriptions}
              tournamentId={params.id}
              tournamentStatus={tournament.status}
              maxPlayers={maxPlayers}
              allPlayers={allPlayers}
            />
          </div>
        </Suspense>
      </div>
    </div>
  )
}