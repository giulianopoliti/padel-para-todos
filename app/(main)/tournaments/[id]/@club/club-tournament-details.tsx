"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Users, Calendar, AlertCircle, Play, UserPlus } from "lucide-react"
import AmericanTournament from "@/components/tournament/american-tournament"
import EliminationTournament from "@/components/tournament/elimination-tournament"
import TournamentNotFound from "@/components/tournament/not-found"
import RegisteredPlayers from "@/components/tournament/registered-players"
import ClubRegisterPlayer from "@/components/tournament/club-register-player"
import ClubRegisterCouple from "@/components/tournament/club-register-couple"
import { useUser } from "@/contexts/user-context"
import { registerPlayerForTournament } from "./actions"
import { startTournament } from "@/app/api/tournaments/actions"
import { supabase } from "@/utils/supabase/client"

// Tipos
import type { Tournament, Match, Category } from "@/types"
import type { Tables } from "@/database.types"

type Inscription = Tables<"inscriptions">
type Couple = Tables<"couples">["Row"]
type PlayerInfo = { id: string; first_name: string | null; last_name: string | null }
type ProcessedCouple = Couple & {
  player_1_info: PlayerInfo | null
  player_2_info: PlayerInfo | null
}

interface TournamentDetailsClientProps {
  initialTournament: Tournament | null
  initialCategory: Category | null
  initialMatches: Match[]
  initialCouples: ProcessedCouple[]
  initialInscriptions: Inscription[]
  initialSinglePlayers: PlayerInfo[]
}

// Mapa de tipos de torneo a componentes
const tournamentComponents: { [key: string]: React.ComponentType<any> } = {
  AMERICAN: AmericanTournament,
  ELIMINATION: EliminationTournament,
}

export default function TournamentDetailsClient({
  initialTournament,
  initialCategory,
  initialMatches,
  initialCouples,
  initialInscriptions,
  initialSinglePlayers,
}: TournamentDetailsClientProps) {
  const [tournament, setTournament] = useState<Tournament | null>(initialTournament)
  const [matches, setMatches] = useState<Match[]>(initialMatches)
  const [couples, setCouples] = useState<ProcessedCouple[]>(initialCouples)
  const [category, setCategory] = useState<Category | null>(initialCategory)
  const [inscriptions, setInscriptions] = useState<Inscription[]>(initialInscriptions)
  const [singlePlayers, setSinglePlayers] = useState<PlayerInfo[]>(initialSinglePlayers)
  const [refreshCounter, setRefreshCounter] = useState(0)
  const [isRegistering, setIsRegistering] = useState(false)
  const [isReloading, setIsReloading] = useState(false)
  const { user: contextUser, userDetails, loading: contextLoading } = useUser()
  const router = useRouter()

  if (!tournament) {
    return <TournamentNotFound onBackToTournaments={() => router.push("/tournaments")} />
  }

  // Determinar si el usuario actual es dueño del club del torneo
  const isClubOwner = contextUser && userDetails?.role === "CLUB" && userDetails?.club_id === tournament.club?.id

  // Determinar si el torneo ya comenzó
  const isTournamentActive = tournament.status !== "NOT_STARTED"

  // Función para recargar los datos de jugadores inscritos
  const reloadPlayerData = async () => {
    if (isReloading) return

    setIsReloading(true)
    console.log("⏳ Recargando datos de jugadores inscritos...")

    try {
      if (!supabase) {
        console.error("❌ Cliente Supabase no disponible")
        return
      }

      // Obtener inscripciones del torneo
      const { data: inscriptionsData, error: inscriptionsError } = await supabase
        .from("inscriptions")
        .select("id, player_id, couple_id, tournament_id")
        .eq("tournament_id", tournament.id)

      if (inscriptionsError) {
        console.error("❌ Error al obtener inscripciones:", inscriptionsError)
        return
      }

      // Extraer IDs de jugadores individuales
      const singlePlayerIds = inscriptionsData
        .filter((insc: any) => !insc.couple_id && insc.player_id)
        .map((insc: any) => insc.player_id)

      console.log(`✅ Encontrados ${singlePlayerIds.length} jugadores individuales`)

      // Obtener datos de jugadores individuales
      if (singlePlayerIds.length > 0) {
        const { data: playersData, error: playersError } = await supabase
          .from("players")
          .select("id, first_name, last_name")
          .in("id", singlePlayerIds)

        if (playersError) {
          console.error("❌ Error al obtener datos de jugadores:", playersError)
        } else {
          console.log(`✅ Datos actualizados de ${playersData.length} jugadores`)
          setSinglePlayers(playersData || [])
        }
      } else {
        setSinglePlayers([])
      }

      setInscriptions((inscriptionsData as Inscription[]) || [])
      router.refresh()
    } catch (error) {
      console.error("❌ Error al recargar datos:", error)
    } finally {
      setIsReloading(false)
    }
  }

  const SelectedTournamentComponent = tournamentComponents[tournament.type]

  // Manejador de registro
  const handleRegister = async () => {
    if (!contextUser || !tournament) {
      console.error("Cannot register: User or tournament data missing.")
      alert("Error: No se pudo obtener la información del usuario o torneo.")
      return
    }

    setIsRegistering(true)
    console.log(`Attempting registration for user ${contextUser.id} in tournament ${tournament.id}`)

    try {
      const result = await registerPlayerForTournament(tournament.id)
      alert(result.message)

      if (result.success) {
        console.log("Registration successful via action.")
        handlePlayerRegistered()
      }
    } catch (error) {
      console.error("Error calling registration action:", error)
      alert("Ocurrió un error inesperado durante la inscripción.")
    } finally {
      setIsRegistering(false)
    }
  }

  // Manejador para iniciar torneo
  const handleStartTournament = async () => {
    if (!tournament || !isClubOwner) {
      console.error("Cannot start tournament: Not authorized or missing tournament data")
      return
    }

    if (
      window.confirm(
        "¿Está seguro que desea iniciar el torneo? Una vez iniciado, no se podrán registrar más jugadores.",
      )
    ) {
      try {
        const result = await startTournament(tournament.id)
        if (result.success) {
          router.push(`/tournaments/${tournament.id}/pairing`)
        }
      } catch (error) {
        console.error("Error al iniciar torneo:", error)
        alert("No se pudo iniciar el torneo. Por favor, intente nuevamente.")
      }
    }
  }

  // Manejador para actualizar después de registro
  const handlePlayerRegistered = () => {
    console.log("🔄 Jugador registrado, actualizando datos...")
    setRefreshCounter((prev) => prev + 1)

    setTimeout(() => {
      reloadPlayerData()
    }, 800)
  }

  // Props para el componente de torneo
  const tournamentProps = {
    tournament,
    category,
    matches,
    couples,
    singlePlayers,
    user: contextUser,
    isAuthenticated: !!contextUser,
    loading: contextLoading || isRegistering,
    onRegister: handleRegister,
  }

  // Efecto para depuración y refresco
  useEffect(() => {
    console.log("Tournament details loaded or refreshed:")
    console.log("Single Players:", singlePlayers)
    console.log("Inscriptions:", inscriptions)
    console.log("Couples:", couples)

    if (refreshCounter > 0) {
      console.log(`🔄 Refrescando datos (contador: ${refreshCounter})`)
    }
  }, [singlePlayers, inscriptions, couples, refreshCounter])

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
  }

  // Obtener nombre de categoría
  const getCategoryName = () => {
    return category ? category.name : "No especificada"
  }

  // Obtener texto de estado
  const getStatusText = (status: string) => {
    switch (status) {
      case "NOT_STARTED":
        return "Próximamente"
      case "IN_PROGRESS":
        return "En curso"
      case "FINISHED":
        return "Finalizado"
      case "PAIRING":
        return "En fase de emparejamiento"
      default:
        return status
    }
  }

  // Obtener color de estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case "NOT_STARTED":
        return "bg-yellow-50 text-yellow-700 border border-yellow-200"
      case "IN_PROGRESS":
        return "bg-teal-50 text-teal-700 border border-teal-200"
      case "FINISHED":
        return "bg-blue-50 text-blue-700 border border-blue-200"
      case "PAIRING":
        return "bg-purple-50 text-purple-700 border border-purple-200"
      default:
        return "bg-slate-100 text-slate-700 border border-slate-200"
    }
  }

  const canRegister = () => {
    if (!contextUser) return false
    if (isTournamentActive) return false

    // Check if the user is already registered as a single player
    const isRegisteredAsSingle = inscriptions.some(
      (inscription) => inscription.player_id === contextUser.id && !inscription.couple_id,
    )

    if (isRegisteredAsSingle) return false

    // Check if the user is already registered as part of a couple
    const isRegisteredAsCouple = couples.some(
      (couple) => couple.player_1_id === contextUser.id || couple.player_2_id === contextUser.id,
    )

    return !isRegisteredAsCouple
  }

  if (SelectedTournamentComponent) {
    return (
      <div className="space-y-6">
        {/* Cabecera del torneo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-light text-teal-700 mb-2">{tournament.name}</h1>
          <p className="text-slate-600 max-w-2xl mx-auto">{tournament.club?.name || "Club no especificado"}</p>
        </div>

        {/* Información del torneo */}
        <Card className="bg-white rounded-lg shadow-sm border border-slate-100 hover:border-teal-100 transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-medium text-teal-700">Información del Torneo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-teal-600" />
                  <span className="text-slate-700 font-medium">Fechas:</span>
                  <span className="ml-2 text-slate-600">
                    {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                  </span>
                </div>
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-teal-600" />
                  <span className="text-slate-700 font-medium">Categoría:</span>
                  <span className="ml-2 inline-block bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full text-sm font-medium border border-teal-100">
                    {getCategoryName()}
                  </span>
                </div>
                <div className="flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-teal-600" />
                  <span className="text-slate-700 font-medium">Tipo:</span>
                  <span className="ml-2 text-slate-600">
                    {tournament.type === "AMERICAN" ? "Americano" : "Eliminación"}
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 text-teal-600" />
                  <span className="text-slate-700 font-medium">Estado:</span>
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full text-sm font-medium ${getStatusColor(tournament.status)}`}
                  >
                    {getStatusText(tournament.status)}
                  </span>
                </div>
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-teal-600" />
                  <span className="text-slate-700 font-medium">Jugadores inscritos:</span>
                  <span className="ml-2 text-slate-600">{singlePlayers.length} jugadores</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-teal-600" />
                  <span className="text-slate-700 font-medium">Parejas inscritas:</span>
                  <span className="ml-2 text-slate-600">{couples.length} parejas</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botones de acción */}
        <div className="flex justify-between">
          <div>
            {/* Botón para iniciar torneo - solo visible para dueños de club cuando el torneo no ha iniciado */}
            {isClubOwner && !isTournamentActive && (
              <Button
                onClick={handleStartTournament}
                className="bg-teal-600 hover:bg-teal-700 text-white rounded-full font-normal"
              >
                <Play className="mr-2 h-4 w-4" />
                Comenzar Torneo
              </Button>
            )}
          </div>

          <div>
            {contextUser ? (
              <Button
                onClick={handleRegister}
                disabled={isRegistering || isTournamentActive || !canRegister()}
                className="bg-teal-600 hover:bg-teal-700 text-white rounded-full font-normal"
              >
                {isRegistering ? "Procesando..." : "Inscribirme"}
              </Button>
            ) : (
              <Button
                onClick={() => router.push("/login")}
                className="bg-teal-600 hover:bg-teal-700 text-white rounded-full font-normal"
                disabled={isTournamentActive}
              >
                Iniciar sesión para inscribirme
              </Button>
            )}
          </div>
        </div>

        {/* Tabs para diferentes secciones */}
        <Tabs
          defaultValue="tournament"
          className="bg-white rounded-lg shadow-sm border border-slate-100 hover:border-teal-100 transition-all duration-300"
        >
          <TabsList className="w-full border-b border-slate-200 rounded-t-lg bg-slate-50">
            <TabsTrigger
              value="tournament"
              className="flex-1 py-3 data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-teal-500"
            >
              <Trophy className="mr-2 h-4 w-4" />
              Torneo
            </TabsTrigger>
            <TabsTrigger
              value="players"
              className="flex-1 py-3 data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-teal-500"
            >
              <Users className="mr-2 h-4 w-4" />
              Jugadores
            </TabsTrigger>
            {isClubOwner && !isTournamentActive && (
              <TabsTrigger
                value="register"
                className="flex-1 py-3 data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-teal-500"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Registrar Jugadores
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="tournament" className="p-6">
            <SelectedTournamentComponent {...tournamentProps} />
          </TabsContent>

          <TabsContent value="players" className="p-6">
            <RegisteredPlayers singlePlayers={singlePlayers || []} isLoading={contextLoading || isRegistering} />
          </TabsContent>

          {isClubOwner && !isTournamentActive && (
            <TabsContent value="register" className="p-6">
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-medium text-teal-700 mb-4">Registrar Jugador Individual</h3>
                  <ClubRegisterPlayer
                    tournamentId={tournament.id}
                    isClubOwner={isClubOwner}
                    isTournamentActive={isTournamentActive}
                    onPlayerRegistered={handlePlayerRegistered}
                  />
                </div>

                <div>
                  <h3 className="text-xl font-medium text-teal-700 mb-4">Registrar Pareja</h3>
                  <ClubRegisterCouple
                    tournamentId={tournament.id}
                    isClubOwner={isClubOwner}
                    isTournamentActive={isTournamentActive}
                    onCoupleRegistered={handlePlayerRegistered}
                  />
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    )
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-slate-100">
      <p className="text-red-500">Error: Tipo de torneo '{tournament.type}' no soportado.</p>
    </div>
  )
}
