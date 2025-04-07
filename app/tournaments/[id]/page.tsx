"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { supabase } from "@/lib/supabase"
import Navbar from "@/components/navbar"
import type { Tournament, Match, Category, Player } from "@/types"
import { Calendar, Trophy, Users, ArrowLeft, MapPin, Clock } from "lucide-react"

export default function TournamentDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const tournamentId = params.id as string

  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [isRegistered, setIsRegistered] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        // Check if user is logged in
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session) {
          const { data: userData } = await supabase.from("users").select("*").eq("id", session.user.id).single()

          if (userData) {
            setUser(userData)

            // Check if player is registered for this tournament
            // This is a simplified check - in a real app, you'd need to check the registrations table
            setIsRegistered(false)
          }
        }

        // Fetch tournament details
        const { data: tournamentData, error: tournamentError } = await supabase
          .from("tournaments")
          .select("*")
          .eq("id", tournamentId)
          .single()

        if (tournamentError) throw tournamentError
        setTournament(tournamentData as Tournament)

        // Fetch category
        const { data: categoryData } = await supabase
          .from("categories")
          .select("*")
          .eq("id", tournamentData.category)
          .single()

        if (categoryData) {
          setCategory(categoryData as Category)
        }

        // Fetch matches for this tournament
        const { data: matchesData } = await supabase
          .from("matches")
          .select("*")
          .eq("tournamentId", tournamentId)
          .order("date", { ascending: true })

        if (matchesData) {
          setMatches(matchesData as Match[])
        }

        // Fetch players for this tournament
        // This is a simplified query - in a real app, you'd need to join with registrations
        const { data: playersData } = await supabase
          .from("players")
          .select("*")
          .eq("category", tournamentData.category)
          .order("score", { ascending: false })

        if (playersData) {
          setPlayers(playersData as Player[])
        }

        setLoading(false)
      } catch (error) {
        console.error("Error fetching tournament details:", error)
        router.push("/tournaments")
      }
    }

    if (tournamentId) {
      fetchData()
    }
  }, [tournamentId, router])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "not_started":
        return "Próximamente"
      case "in_progress":
        return "En curso"
      case "finished":
        return "Finalizado"
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "not_started":
        return "bg-yellow-100 text-yellow-800"
      case "in_progress":
        return "bg-padel-green-100 text-padel-green-800"
      case "finished":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 bg-padel-green-200 rounded-full mb-4"></div>
            <div className="h-4 w-48 bg-padel-green-100 rounded mb-2"></div>
            <div className="h-4 w-32 bg-padel-green-100 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <Trophy className="h-16 w-16 text-padel-green-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-padel-green-700 mb-4">Torneo no encontrado</h1>
          <p className="text-gray-600 mb-8">El torneo que estás buscando no existe o ha sido eliminado.</p>
          <Button onClick={() => router.push("/tournaments")} className="bg-padel-green-600 hover:bg-padel-green-700">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Torneos
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-6 border-padel-green-200 text-padel-green-700 hover:bg-padel-green-50"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <Card className="border-padel-green-100 overflow-hidden">
              <div className="h-2 bg-padel-green-600"></div>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-3xl text-padel-green-700">{tournament.name}</CardTitle>
                    <CardDescription className="flex items-center mt-2">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                    </CardDescription>
                  </div>
                  <span className={`text-sm px-3 py-1 rounded-full font-medium ${getStatusColor(tournament.status)}`}>
                    {getStatusText(tournament.status)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-padel-green-600 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">Organizador</p>
                      <p className="font-medium">Club ID: {tournament.clubId}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Trophy className="h-5 w-5 text-padel-green-600 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">Categoría</p>
                      <p className="font-medium">{category?.name || tournament.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-padel-green-600 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">Estado</p>
                      <p className="font-medium">{getStatusText(tournament.status)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              {user && user.role === "JUGADOR" && tournament.status === "not_started" && (
                <CardFooter className="bg-gray-50 border-t border-gray-100">
                  {isRegistered ? (
                    <Button variant="outline" className="w-full" disabled>
                      Ya estás inscrito
                    </Button>
                  ) : (
                    <Button
                      onClick={() => router.push(`/tournaments/${tournamentId}/register`)}
                      className="w-full bg-padel-green-600 hover:bg-padel-green-700"
                    >
                      Inscribirse
                    </Button>
                  )}
                </CardFooter>
              )}
            </Card>
          </div>

          <div>
            <Card className="border-padel-green-100">
              <CardHeader>
                <CardTitle className="text-padel-green-700">Información</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-1">Jugadores inscritos</p>
                    <p className="text-3xl font-bold text-padel-green-700">{players.length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-1">Partidos programados</p>
                    <p className="text-3xl font-bold text-padel-green-700">{matches.length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-1">Partidos jugados</p>
                    <p className="text-3xl font-bold text-padel-green-700">
                      {matches.filter((m) => m.status === "completed").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="matches" className="bg-white rounded-lg shadow-md">
          <TabsList className="w-full border-b border-gray-200 rounded-t-lg bg-padel-green-50">
            <TabsTrigger
              value="matches"
              className="flex-1 py-3 data-[state=active]:bg-white data-[state=active]:text-padel-green-700 data-[state=active]:shadow-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-padel-green-600"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Partidos
            </TabsTrigger>
            <TabsTrigger
              value="players"
              className="flex-1 py-3 data-[state=active]:bg-white data-[state=active]:text-padel-green-700 data-[state=active]:shadow-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-padel-green-600"
            >
              <Users className="mr-2 h-4 w-4" />
              Jugadores
            </TabsTrigger>
            <TabsTrigger
              value="bracket"
              className="flex-1 py-3 data-[state=active]:bg-white data-[state=active]:text-padel-green-700 data-[state=active]:shadow-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-padel-green-600"
            >
              <Trophy className="mr-2 h-4 w-4" />
              Cuadro
            </TabsTrigger>
          </TabsList>

          <TabsContent value="matches" className="p-0">
            {matches.length > 0 ? (
              <div className="rounded-b-md overflow-hidden">
                <Table>
                  <TableHeader className="bg-padel-green-50">
                    <TableRow>
                      <TableHead className="font-semibold">Fecha</TableHead>
                      <TableHead className="font-semibold">Ronda</TableHead>
                      <TableHead className="font-semibold">Pareja 1</TableHead>
                      <TableHead className="font-semibold">Pareja 2</TableHead>
                      <TableHead className="font-semibold">Resultado</TableHead>
                      <TableHead className="font-semibold">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matches.map((match) => (
                      <TableRow key={match.id} className="hover:bg-padel-green-50">
                        <TableCell>{formatDate(match.date)}</TableCell>
                        <TableCell>{match.round}</TableCell>
                        <TableCell>Equipo {match.team1Id}</TableCell>
                        <TableCell>Equipo {match.team2Id}</TableCell>
                        <TableCell>
                          {match.status === "completed" && match.team1Score && match.team2Score
                            ? `${match.team1Score.join("-")} / ${match.team2Score.join("-")}`
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              match.status === "scheduled"
                                ? "bg-yellow-100 text-yellow-800"
                                : match.status === "completed"
                                  ? "bg-padel-green-100 text-padel-green-800"
                                  : match.status === "cancelled"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {match.status === "scheduled"
                              ? "Programado"
                              : match.status === "completed"
                                ? "Completado"
                                : match.status === "cancelled"
                                  ? "Cancelado"
                                  : match.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-6 text-center">
                <div className="py-12 px-4">
                  <Calendar className="h-12 w-12 text-padel-green-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-padel-green-700 mb-2">No hay partidos programados</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    No hay partidos programados todavía para este torneo.
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="players" className="p-0">
            {players.length > 0 ? (
              <div className="rounded-b-md overflow-hidden">
                <Table>
                  <TableHeader className="bg-padel-green-50">
                    <TableRow>
                      <TableHead className="font-semibold">Jugador</TableHead>
                      <TableHead className="font-semibold">Puntos</TableHead>
                      <TableHead className="font-semibold">Mano Hábil</TableHead>
                      <TableHead className="font-semibold">Lado Preferido</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {players.map((player) => (
                      <TableRow key={player.id} className="hover:bg-padel-green-50">
                        <TableCell className="font-medium">
                          {player.firstName} {player.lastName}
                        </TableCell>
                        <TableCell className="font-bold text-padel-green-700">{player.score}</TableCell>
                        <TableCell>
                          {player.dominantHand === "right"
                            ? "Derecha"
                            : player.dominantHand === "left"
                              ? "Izquierda"
                              : "-"}
                        </TableCell>
                        <TableCell>
                          {player.preferredSide === "forehand"
                            ? "Derecha (Drive)"
                            : player.preferredSide === "backhand"
                              ? "Izquierda (Revés)"
                              : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-6 text-center">
                <div className="py-12 px-4">
                  <Users className="h-12 w-12 text-padel-green-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-padel-green-700 mb-2">No hay jugadores inscritos</h3>
                  <p className="text-gray-600 max-w-md mx-auto">No hay jugadores inscritos todavía en este torneo.</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="bracket" className="p-6">
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 text-padel-green-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-padel-green-700 mb-2">Cuadro del Torneo</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                El cuadro del torneo estará disponible cuando comience el torneo.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

