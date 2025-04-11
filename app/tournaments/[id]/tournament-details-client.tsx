"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { supabase } from "@/lib/supabase"
import Navbar from "@/components/navbar"
import type { Tournament, Match, Category, Player, AmericanMatch, LargeMatch, Couple } from "@/types"
import { Calendar, Trophy, Users, ArrowLeft, MapPin, Clock } from "lucide-react"

interface TournamentDetailsClientProps {
  initialTournament: Tournament | null
  initialCategory: Category | null
  initialMatches: Match[]
  initialCouples: Couple[]
}

function AmericanTournamentDetails({
  tournament,
  category,
  matches,
  couples,
  user,
  isRegistered,
  router
}: {
  tournament: Tournament
  category: Category | null
  matches: AmericanMatch[]
  couples: Couple[]
  user: any
  isRegistered: boolean
  router: any
}) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
  }

  const formatMatchScore = (match: AmericanMatch | LargeMatch) => {
    if (match.status !== "FINISHED") return "-"
    return match.result_couple_1, " - " , match.result_couple_2;
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
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-sm px-3 py-1 rounded-full font-medium bg-gray-100 text-gray-800">
                      Torneo Americano (1 set)
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-padel-green-600 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">Organizador</p>
                      <p className="font-medium">Club: {tournament.club.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Trophy className="h-5 w-5 text-padel-green-600 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">Categoría</p>
                      <p className="font-medium">{category?.name || tournament.category}</p>
                    </div>
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
                        <TableCell>{match.couple_1.player_1} {match.couple_1.player_2}</TableCell>
                        <TableCell>{match.couple_2.player_1} {match.couple_2.player_2}</TableCell>
                        <TableCell>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              match.status === "NOT_STARTED"
                                ? "bg-yellow-100 text-yellow-800"
                                : match.status === "IN_PROGRESS"
                                  ? "bg-padel-green-100 text-padel-green-800"
                                  : match.status === "FINISHED"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {match.status === "NOT_STARTED"
                              ? "Programado"
                              : match.status === "IN_PROGRESS"
                                ? "En curso"
                                : match.status === "FINISHED"
                                  ? "Completado"
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
        </Tabs>
      </div>
    </div>
  )
}

function LongTournamentDetails({
  tournament,
  category,
  matches,
  couples,
  user,
  isRegistered,
  router
}: {
  tournament: Tournament
  category: Category | null
  matches: LargeMatch[]
  couples: Couple[]
  user: any
  isRegistered: boolean
  router: any
}) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
  }

  const formatMatchScore = (match: LargeMatch) => {
    if (match.status !== "FINISHED") return "-"
    return match.result_couple_1, " - " , match.result_couple_2;
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
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-sm px-3 py-1 rounded-full font-medium bg-gray-100 text-gray-800">
                      Torneo Largo (Mejor de 3 sets)
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-padel-green-600 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">Organizador</p>
                      <p className="font-medium">Club: {tournament.club.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Trophy className="h-5 w-5 text-padel-green-600 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">Categoría</p>
                      <p className="font-medium">{category?.name || tournament.category}</p>
                    </div>
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
                        <TableCell>{match.couple_1.player_1} {match.couple_1.player_2}</TableCell>
                        <TableCell>{match.couple_2.player_1} {match.couple_2.player_2}</TableCell>
                        <TableCell>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              match.status === "NOT_STARTED"
                                ? "bg-yellow-100 text-yellow-800"
                                : match.status === "IN_PROGRESS"
                                  ? "bg-padel-green-100 text-padel-green-800"
                                  : match.status === "FINISHED"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {match.status === "NOT_STARTED"
                              ? "Programado"
                              : match.status === "IN_PROGRESS"
                                ? "En curso"
                                : match.status === "FINISHED"
                                  ? "Completado"
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
        </Tabs>
      </div>
    </div>
  )
}

export default function TournamentDetailsClient({
  initialTournament,
  initialCategory,
  initialMatches,
  initialCouples
}: TournamentDetailsClientProps) {
  const router = useRouter()
  const [tournament, setTournament] = useState<Tournament | null>(initialTournament)
  const [matches, setMatches] = useState<Match[]>(initialMatches)
  const [couples, setCouples] = useState<Couple[]>(initialCouples)
  const [category, setCategory] = useState<Category | null>(initialCategory)
  const [user, setUser] = useState<any>(null)
  const [isRegistered, setIsRegistered] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        const { data: userData } = await supabase.from("users").select("*").eq("id", session.user.id).single()

        if (userData) {
          setUser(userData)
          setIsRegistered(false)
        }
      }
    }

    checkAuth()
  }, [])

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

  if (tournament.type === "AMERICAN") {
    return (
      <AmericanTournamentDetails
        tournament={tournament}
        category={category}
        matches={matches as AmericanMatch[]}
        couples={couples}
        user={user}
        isRegistered={isRegistered}
        router={router}
      />
    )
  }

  return (
    <LongTournamentDetails
      tournament={tournament}
      category={category}
      matches={matches as LargeMatch[]}
      couples={couples}
      user={user}
      isRegistered={isRegistered}
      router={router}
    />
  )
} 