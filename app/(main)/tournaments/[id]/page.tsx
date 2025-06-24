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
import PublicTournamentDetailsTabs from "@/components/tournament/public-tournament-details-tabs"
import { getAllPlayersDTO } from "@/app/api/players/actions"
import { getTournamentDetailsWithInscriptions } from "@/app/api/tournaments/actions"
import { formatDateArgentina } from "@/lib/utils"

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

    return {
      tournament,
      individualInscriptions,
      coupleInscriptions,
      allPlayers,
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

// Formatear fecha usando horario de Argentina
function formatDate(dateString: string) {
  return formatDateArgentina(dateString)
}

// Formatear hora usando horario de Argentina
function formatTime(dateString: string | null | undefined) {
  if (!dateString) return "Hora no especificada"
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Hora no especificada"
    
    return date.toLocaleTimeString("es-AR", { 
      hour: "2-digit", 
      minute: "2-digit",
      timeZone: "America/Argentina/Buenos_Aires"
    })
  } catch (error) {
    console.error("Error formatting time:", error)
    return "Hora no especificada"
  }
}

// Componente principal
export default async function TournamentDetailsPage({ params }: { params: { id: string } }) {
  const resolvedParams = await params;
  const { tournament, individualInscriptions, coupleInscriptions, allPlayers } = await getData(resolvedParams.id)



  // Configurar el máximo de jugadores (podría venir del torneo en el futuro)
  const maxPlayers = tournament.max_participants || 32

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={<TournamentDetailsLoading />}>
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header - SIN BOTONES DE ADMINISTRACIÓN */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <Button asChild variant="outline" className="border-gray-300 w-fit">
                <Link href="/tournaments" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Volver a Torneos
                </Link>
              </Button>
              <div className="flex items-center gap-3">
                <span
                  className={`px-4 py-2 rounded-xl font-medium border ${getStatusColor(
                    tournament.status,
                  )} flex items-center gap-2`}
                >
                  {getStatusIcon(tournament.status)}
                  {getStatusText(tournament.status)}
                </span>
              </div>
            </div>

            {/* Tournament Header */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-8">
                <div className="flex items-start gap-6">
                  <div className="bg-slate-100 p-4 rounded-xl">
                    <Trophy className="h-8 w-8 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">{tournament.name}</h1>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Building className="h-4 w-4" />
                      <span>{tournament.clubes?.name || "Club no especificado"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tournament Info Card */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-200 bg-slate-50">
                <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                  <div className="bg-slate-200 p-2 rounded-lg">
                    <Trophy className="h-5 w-5 text-slate-600" />
                  </div>
                  Información del Torneo
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-blue-100 p-2 rounded-lg mt-1">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-1">Fechas del torneo</h3>
                        <p className="text-slate-600">
                          {tournament.start_date ? formatDate(tournament.start_date) : "Fecha no especificada"}
                          {tournament.end_date && tournament.end_date !== tournament.start_date && ` - ${formatDate(tournament.end_date)}`}
                        </p>
                        {tournament.start_date && (
                          <div className="flex items-center gap-2 mt-2">
                            <Clock className="h-4 w-4 text-blue-500" />
                            <p className="text-sm text-slate-500">
                              Hora de inicio: <span className="font-medium text-slate-700">{formatTime(tournament.start_date)}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="bg-emerald-100 p-2 rounded-lg mt-1">
                        <Trophy className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-1">Categoría y tipo</h3>
                        <p className="text-slate-600">{tournament.categories?.name || "No especificada"}</p>
                        <p className="text-sm text-slate-500">
                          {tournament.type === "AMERICAN" ? "Torneo Americano" : "Eliminación Directa"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-slate-100 p-2 rounded-lg mt-1">
                        <MapPin className="h-5 w-5 text-slate-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-1">Ubicación</h3>
                        <p className="text-slate-600">{tournament.clubes?.address || "No especificada"}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-amber-100 p-2 rounded-lg mt-1">
                          <Phone className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900 text-sm">Teléfono</h4>
                          <p className="text-slate-600 text-sm">{tournament.clubes?.phone || "No especificado"}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="bg-teal-100 p-2 rounded-lg mt-1">
                          <Mail className="h-4 w-4 text-teal-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900 text-sm">Email</h4>
                          <p className="text-slate-600 text-sm">{tournament.clubes?.email || "No especificado"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 p-2 rounded-lg">
                        <Users className="h-5 w-5 text-slate-600" />
                      </div>
                      <h3 className="font-semibold text-slate-900">Inscripciones</h3>
                    </div>
                    <div className="flex gap-8">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-slate-900">{individualInscriptions.length}</div>
                        <div className="text-sm text-slate-500">Jugadores individuales</div>
                        <div className="text-xs text-slate-400">de {maxPlayers} máximo</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-slate-900">{coupleInscriptions.length}</div>
                        <div className="text-sm text-slate-500">Parejas</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tournament Details Tabs - VERSIÓN PÚBLICA SIN EDICIÓN */}
            <PublicTournamentDetailsTabs
              individualInscriptions={individualInscriptions}
              coupleInscriptions={coupleInscriptions}
              tournamentId={resolvedParams.id}
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