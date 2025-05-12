"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calendar, Trophy, Users, Clock, Activity } from "lucide-react"
import type { Player, User, Tournament, Match, Couple } from "@/types"

interface PlayerDashboardProps {
  player: Player
  user: User
  tournaments?: Tournament[]
  matches?: Match[]
  couples?: Couple[]
  categories?: { id: string; name: string }[]
}

export default function PlayerDashboard({
  player,
  user,
  tournaments = [],
  matches = [],
  couples = [],
  categories = [],
}: PlayerDashboardProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")

  // Función para obtener el nombre de la categoría
  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId)
    return category ? category.name : categoryId
  }

  // Función para formatear fechas
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })
  }

  // Filtrar torneos por estado
  const upcomingTournaments = tournaments.filter((t) => t.status === "NOT_STARTED")
  const activeTournaments = tournaments.filter((t) => t.status === "IN_PROGRESS")
  const pastTournaments = tournaments.filter((t) => t.status === "FINISHED")

  // Filtrar partidos por estado
  const upcomingMatches = matches.filter((m) => m.status === "NOT_STARTED")
  const completedMatches = matches.filter((m) => m.status === "FINISHED")

  return (
    <div className="space-y-8">
      {/* Encabezado del Dashboard */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold text-padel-green-700">Bienvenido, {player.firstName}</h1>
          <p className="text-gray-600">Gestiona tus torneos, partidos y consulta tu ranking desde aquí.</p>
        </div>
        <Button
          onClick={() => router.push("/profile")}
          variant="outline"
          className="border-padel-green-200 text-padel-green-700 hover:bg-padel-green-50"
        >
          Editar Perfil
        </Button>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-padel-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-padel-green-700 flex items-center">
              <Trophy className="mr-2 h-5 w-5 text-padel-green-600" />
              Mi Ranking
            </CardTitle>
            <CardDescription>Tu posición actual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-padel-green-700">{player.score} pts</p>
                <p className="text-sm text-gray-600">
                  Categoría:{" "}
                  <Badge variant="outline" className="ml-1">
                    {getCategoryName(player.category)}
                  </Badge>
                </p>
              </div>
              <div className="bg-padel-green-100 w-12 h-12 rounded-full flex items-center justify-center">
                <Activity className="h-6 w-6 text-padel-green-600" />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              onClick={() => router.push("/ranking")}
              className="w-full border-padel-green-200 text-padel-green-700 hover:bg-padel-green-50"
            >
              Ver Ranking Completo
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-padel-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-padel-green-700 flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-padel-green-600" />
              Mis Torneos
            </CardTitle>
            <CardDescription>Torneos en los que participas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-padel-green-700">{activeTournaments.length}</p>
                <p className="text-sm text-gray-600">
                  Activos <span className="text-gray-400">| {upcomingTournaments.length} próximos</span>
                </p>
              </div>
              <div className="bg-padel-green-100 w-12 h-12 rounded-full flex items-center justify-center">
                <Trophy className="h-6 w-6 text-padel-green-600" />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => router.push("/tournaments")}
              className="w-full bg-padel-green-600 hover:bg-padel-green-700"
            >
              Buscar Torneos
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-padel-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-padel-green-700 flex items-center">
              <Clock className="mr-2 h-5 w-5 text-padel-green-600" />
              Mis Partidos
            </CardTitle>
            <CardDescription>Historial de partidos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-padel-green-700">{completedMatches.length}</p>
                <p className="text-sm text-gray-600">
                  Jugados <span className="text-gray-400">| {upcomingMatches.length} próximos</span>
                </p>
              </div>
              <div className="bg-padel-green-100 w-12 h-12 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-padel-green-600" />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/player/matches")}
              className="w-full border-padel-green-200 text-padel-green-700 hover:bg-padel-green-50"
            >
              Ver Mis Partidos
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Pestañas de Contenido */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="bg-white rounded-lg shadow-md border border-padel-green-100"
      >
        <TabsList className="w-full border-b border-gray-200 rounded-t-lg bg-padel-green-50">
          <TabsTrigger
            value="overview"
            className="flex-1 py-3 data-[state=active]:bg-white data-[state=active]:text-padel-green-700 data-[state=active]:shadow-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-padel-green-600"
          >
            Resumen
          </TabsTrigger>
          <TabsTrigger
            value="tournaments"
            className="flex-1 py-3 data-[state=active]:bg-white data-[state=active]:text-padel-green-700 data-[state=active]:shadow-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-padel-green-600"
          >
            Mis Torneos
          </TabsTrigger>
          <TabsTrigger
            value="matches"
            className="flex-1 py-3 data-[state=active]:bg-white data-[state=active]:text-padel-green-700 data-[state=active]:shadow-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-padel-green-600"
          >
            Mis Partidos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-padel-green-700 mb-4">Próximos Partidos</h3>
              {upcomingMatches.length > 0 ? (
                <div className="space-y-3">
                  {upcomingMatches.slice(0, 3).map((match) => (
                    <Card key={match.id} className="border-padel-green-100">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">
                              Pareja {match.couple_1.id} vs Pareja {match.couple_2.id}
                            </p>
                            <p className="text-sm text-gray-600">
                              {formatDate(match.date)} • {match.round}
                            </p>
                          </div>
                          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Programado</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {upcomingMatches.length > 3 && (
                    <Button
                      variant="link"
                      onClick={() => {
                        setActiveTab("matches")
                      }}
                      className="text-padel-green-600"
                    >
                      Ver todos los partidos
                    </Button>
                  )}
                </div>
              ) : (
                <Card className="border-padel-green-100">
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-600">No tienes partidos programados próximamente.</p>
                    <Button variant="link" onClick={() => router.push("/tournaments")} className="text-padel-green-600">
                      Buscar torneos para inscribirte
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-padel-green-700 mb-4">Torneos Activos</h3>
              {activeTournaments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeTournaments.map((tournament) => (
                    <Card key={tournament.id} className="border-padel-green-100">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-padel-green-700">{tournament.name}</CardTitle>
                        <CardDescription>
                          {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="text-sm text-gray-600">
                          Categoría:{" "}
                          <Badge variant="outline" className="ml-1">
                            {getCategoryName(tournament.category)}
                          </Badge>
                        </p>
                      </CardContent>
                      <CardFooter>
                        <Button
                          variant="outline"
                          onClick={() => router.push(`/tournaments/${tournament.id}`)}
                          className="w-full border-padel-green-200 text-padel-green-700 hover:bg-padel-green-50"
                        >
                          Ver Detalles
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-padel-green-100">
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-600">No estás participando en ningún torneo actualmente.</p>
                    <Button variant="link" onClick={() => router.push("/tournaments")} className="text-padel-green-600">
                      Buscar torneos para inscribirte
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tournaments" className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-padel-green-700 mb-4">Próximos Torneos</h3>
              {upcomingTournaments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingTournaments.map((tournament) => (
                    <Card key={tournament.id} className="border-padel-green-100">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-padel-green-700">{tournament.name}</CardTitle>
                        <CardDescription>
                          {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="text-sm text-gray-600">
                          Categoría:{" "}
                          <Badge variant="outline" className="ml-1">
                            {getCategoryName(tournament.category)}
                          </Badge>
                        </p>
                      </CardContent>
                      <CardFooter>
                        <Button
                          onClick={() => router.push(`/tournaments/${tournament.id}`)}
                          className="w-full bg-padel-green-600 hover:bg-padel-green-700"
                        >
                          Ver Detalles
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-padel-green-100">
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-600">No hay próximos torneos disponibles.</p>
                    <Button variant="link" onClick={() => router.push("/tournaments")} className="text-padel-green-600">
                      Ver todos los torneos
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-padel-green-700 mb-4">Torneos Activos</h3>
              {activeTournaments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeTournaments.map((tournament) => (
                    <Card key={tournament.id} className="border-padel-green-100">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-padel-green-700">{tournament.name}</CardTitle>
                        <CardDescription>
                          {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="text-sm text-gray-600">
                          Categoría:{" "}
                          <Badge variant="outline" className="ml-1">
                            {getCategoryName(tournament.category)}
                          </Badge>
                        </p>
                      </CardContent>
                      <CardFooter>
                        <Button
                          onClick={() => router.push(`/tournaments/${tournament.id}`)}
                          className="w-full bg-padel-green-600 hover:bg-padel-green-700"
                        >
                          Ver Detalles
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-padel-green-100">
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-600">No estás participando en ningún torneo actualmente.</p>
                  </CardContent>
                </Card>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-padel-green-700 mb-4">Torneos Pasados</h3>
              {pastTournaments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pastTournaments.map((tournament) => (
                    <Card key={tournament.id} className="border-padel-green-100">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-padel-green-700">{tournament.name}</CardTitle>
                        <CardDescription>
                          {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="text-sm text-gray-600">
                          Categoría:{" "}
                          <Badge variant="outline" className="ml-1">
                            {getCategoryName(tournament.category)}
                          </Badge>
                        </p>
                      </CardContent>
                      <CardFooter>
                        <Button
                          variant="outline"
                          onClick={() => router.push(`/tournaments/${tournament.id}`)}
                          className="w-full border-padel-green-200 text-padel-green-700 hover:bg-padel-green-50"
                        >
                          Ver Resultados
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-padel-green-100">
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-600">No has participado en torneos anteriores.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="matches" className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-padel-green-700 mb-4">Próximos Partidos</h3>
              {upcomingMatches.length > 0 ? (
                <div className="space-y-3">
                  {upcomingMatches.map((match) => (
                    <Card key={match.id} className="border-padel-green-100">
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                          <div>
                            <p className="font-medium">
                              Pareja {match.couple_1.id} vs Pareja {match.couple_2.id}
                            </p>
                            <p className="text-sm text-gray-600">
                              {formatDate(match.date)} • {match.round}
                            </p>
                            <p className="text-sm text-gray-600">
                              Categoría:{" "}
                              <Badge variant="outline" className="ml-1">
                                {getCategoryName(match.category)}
                              </Badge>
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Programado</Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/tournaments/${match.tournament_id}`)}
                              className="border-padel-green-200 text-padel-green-700 hover:bg-padel-green-50"
                            >
                              Ver Torneo
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-padel-green-100">
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-600">No tienes partidos programados próximamente.</p>
                  </CardContent>
                </Card>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-padel-green-700 mb-4">Partidos Jugados</h3>
              {completedMatches.length > 0 ? (
                <div className="space-y-3">
                  {completedMatches.map((match) => (
                    <Card key={match.id} className="border-padel-green-100">
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                          <div>
                            <p className="font-medium">
                              Pareja {match.couple_1.id} vs Pareja {match.couple_2.id}
                            </p>
                            <p className="text-sm text-gray-600">
                              {formatDate(match.date)} • {match.round}
                            </p>
                            <p className="font-medium">
                              Resultado: {match.type === "AMERICAN" 
                                ? `${match.result_couple_1?.games.map(g => g.couple1Score).join("-")} / ${match.result_couple_2?.games.map(g => g.couple2Score).join("-")}`
                                : `${match.result_couple_1?.sets.map(s => s.couple1Score).join("-")} / ${match.result_couple_2?.sets.map(s => s.couple2Score).join("-")}`
                              }
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-padel-green-100 text-padel-green-800 hover:bg-padel-green-100">
                              Completado
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/tournaments/${match.tournament_id}`)}
                              className="border-padel-green-200 text-padel-green-700 hover:bg-padel-green-50"
                            >
                              Ver Torneo
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-padel-green-100">
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-600">No has jugado ningún partido todavía.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
