"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import Navbar from "@/components/navbar"
import type { Tournament, Match, Category, Player, Team } from "@/types"

export default function TournamentManagementPage() {
  const router = useRouter()
  const params = useParams()
  const tournamentId = params.id as string

  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push("/login?role=CLUB")
        return
      }

      const { data: userData, error } = await supabase.from("users").select("*").eq("id", session.user.id).single()

      if (error || !userData || userData.role !== "CLUB") {
        await supabase.auth.signOut()
        router.push("/login?role=CLUB")
        return
      }

      setUser(userData)

      // Fetch tournament details
      const { data: tournamentData, error: tournamentError } = await supabase
        .from("tournaments")
        .select("*")
        .eq("id", tournamentId)
        .single()

      if (tournamentError || !tournamentData || tournamentData.clubId !== userData.id) {
        router.push("/dashboard/club")
        return
      }

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

      // Fetch teams for this tournament
      const { data: teamsData } = await supabase.from("teams").select("*").eq("tournamentId", tournamentId)

      if (teamsData) {
        setTeams(teamsData as Team[])
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
    }

    if (tournamentId) {
      checkAuth()
    }
  }, [tournamentId, router])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "not_started":
        return "No iniciado"
      case "in_progress":
        return "En curso"
      case "finished":
        return "Finalizado"
      default:
        return status
    }
  }

  const handleStartTournament = async () => {
    if (!tournament) return

    try {
      // Update tournament status
      const { error } = await supabase.from("tournaments").update({ status: "in_progress" }).eq("id", tournament.id)

      if (error) throw error

      // Generate matches based on teams
      if (teams.length > 1) {
        await generateMatches()
      }

      // Refresh tournament data
      const { data } = await supabase.from("tournaments").select("*").eq("id", tournament.id).single()

      if (data) {
        setTournament(data as Tournament)
      }
    } catch (error) {
      console.error("Error starting tournament:", error)
    }
  }

  const handleFinishTournament = async () => {
    if (!tournament) return

    try {
      const { error } = await supabase.from("tournaments").update({ status: "finished" }).eq("id", tournament.id)

      if (error) throw error

      // Refresh tournament data
      const { data } = await supabase.from("tournaments").select("*").eq("id", tournament.id).single()

      if (data) {
        setTournament(data as Tournament)
      }
    } catch (error) {
      console.error("Error finishing tournament:", error)
    }
  }

  const generateMatches = async () => {
    // This is a simplified match generation algorithm
    // In a real app, you'd need a more sophisticated algorithm based on rankings
    try {
      const matchesToCreate = []

      // Simple round-robin tournament
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          // Calculate match date (this is just an example)
          const matchDate = new Date(tournament!.startDate)
          matchDate.setDate(matchDate.getDate() + matchesToCreate.length)

          matchesToCreate.push({
            tournamentId: tournament!.id,
            team1Id: teams[i].id,
            team2Id: teams[j].id,
            date: matchDate.toISOString(),
            round: `Round ${matchesToCreate.length + 1}`,
            status: "scheduled",
            category: tournament!.category,
          })
        }
      }

      if (matchesToCreate.length > 0) {
        const { error } = await supabase.from("matches").insert(matchesToCreate)

        if (error) throw error

        // Refresh matches
        const { data } = await supabase
          .from("matches")
          .select("*")
          .eq("tournamentId", tournament!.id)
          .order("date", { ascending: true })

        if (data) {
          setMatches(data as Match[])
        }
      }
    } catch (error) {
      console.error("Error generating matches:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Cargando...</p>
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Torneo no encontrado</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <Button variant="outline" onClick={() => router.push("/dashboard/club")} className="mb-6">
          Volver al Panel
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl">{tournament.name}</CardTitle>
                <CardDescription>
                  {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Estado</p>
                    <p className="font-medium">{getStatusText(tournament.status)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Categoría</p>
                    <p className="font-medium">{category?.name || tournament.category}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                {tournament.status === "not_started" && (
                  <Button onClick={handleStartTournament} className="w-full">
                    Iniciar Torneo
                  </Button>
                )}
                {tournament.status === "in_progress" && (
                  <Button onClick={handleFinishTournament} className="w-full">
                    Finalizar Torneo
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => router.push(`/tournaments/${tournamentId}`)}
                  className="w-full"
                >
                  Ver Página Pública
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Información</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Equipos registrados</p>
                    <p className="text-2xl font-bold">{teams.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Partidos programados</p>
                    <p className="text-2xl font-bold">{matches.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Partidos jugados</p>
                    <p className="text-2xl font-bold">{matches.filter((m) => m.status === "completed").length}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      Agregar Equipo
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Agregar Equipo al Torneo</DialogTitle>
                      <DialogDescription>Selecciona dos jugadores para formar un equipo</DialogDescription>
                    </DialogHeader>
                    <AddTeamForm
                      tournamentId={tournament.id}
                      players={players}
                      onSuccess={() => {
                        // Refresh teams
                        supabase
                          .from("teams")
                          .select("*")
                          .eq("tournamentId", tournament.id)
                          .then(({ data }) => {
                            if (data) setTeams(data as Team[])
                          })
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="teams">
          <TabsList className="mb-6">
            <TabsTrigger value="teams">Equipos</TabsTrigger>
            <TabsTrigger value="matches">Partidos</TabsTrigger>
            <TabsTrigger value="results">Resultados</TabsTrigger>
          </TabsList>

          <TabsContent value="teams">
            {teams.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Jugador 1</TableHead>
                      <TableHead>Jugador 2</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teams.map((team) => (
                      <TableRow key={team.id}>
                        <TableCell>{team.id}</TableCell>
                        <TableCell>{getPlayerName(team.player1Id)}</TableCell>
                        <TableCell>{getPlayerName(team.player2Id)}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            Editar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">No hay equipos registrados todavía.</p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="link">Agregar un equipo</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Agregar Equipo al Torneo</DialogTitle>
                        <DialogDescription>Selecciona dos jugadores para formar un equipo</DialogDescription>
                      </DialogHeader>
                      <AddTeamForm
                        tournamentId={tournament.id}
                        players={players}
                        onSuccess={() => {
                          // Refresh teams
                          supabase
                            .from("teams")
                            .select("*")
                            .eq("tournamentId", tournament.id)
                            .then(({ data }) => {
                              if (data) setTeams(data as Team[])
                            })
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="matches">
            {matches.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Ronda</TableHead>
                      <TableHead>Equipo 1</TableHead>
                      <TableHead>Equipo 2</TableHead>
                      <TableHead>Resultado</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matches.map((match) => (
                      <TableRow key={match.id}>
                        <TableCell>{formatDate(match.date)}</TableCell>
                        <TableCell>{match.round}</TableCell>
                        <TableCell>{getTeamName(match.team1Id)}</TableCell>
                        <TableCell>{getTeamName(match.team2Id)}</TableCell>
                        <TableCell>
                          {match.status === "completed" && match.team1Score && match.team2Score
                            ? `${match.team1Score.join("-")} / ${match.team2Score.join("-")}`
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {match.status === "scheduled"
                            ? "Programado"
                            : match.status === "completed"
                              ? "Completado"
                              : match.status === "cancelled"
                                ? "Cancelado"
                                : match.status}
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                {match.status === "completed" ? "Editar" : "Cargar Resultado"}
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>
                                  {match.status === "completed" ? "Editar Resultado" : "Cargar Resultado"}
                                </DialogTitle>
                                <DialogDescription>Ingresa el resultado del partido</DialogDescription>
                              </DialogHeader>
                              <MatchResultForm
                                match={match}
                                team1Name={getTeamName(match.team1Id)}
                                team2Name={getTeamName(match.team2Id)}
                                onSuccess={() => {
                                  // Refresh matches
                                  supabase
                                    .from("matches")
                                    .select("*")
                                    .eq("tournamentId", tournament.id)
                                    .order("date", { ascending: true })
                                    .then(({ data }) => {
                                      if (data) setMatches(data as Match[])
                                    })
                                }}
                              />
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">No hay partidos programados todavía.</p>
                  {tournament.status === "not_started" && teams.length > 1 && (
                    <Button variant="link" onClick={generateMatches}>
                      Generar partidos automáticamente
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="results">
            {matches.filter((m) => m.status === "completed").length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Ronda</TableHead>
                      <TableHead>Equipo 1</TableHead>
                      <TableHead>Equipo 2</TableHead>
                      <TableHead>Resultado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matches
                      .filter((m) => m.status === "completed")
                      .map((match) => (
                        <TableRow key={match.id}>
                          <TableCell>{formatDate(match.date)}</TableCell>
                          <TableCell>{match.round}</TableCell>
                          <TableCell>{getTeamName(match.team1Id)}</TableCell>
                          <TableCell>{getTeamName(match.team2Id)}</TableCell>
                          <TableCell>
                            {match.team1Score && match.team2Score
                              ? `${match.team1Score.join("-")} / ${match.team2Score.join("-")}`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  Editar
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Editar Resultado</DialogTitle>
                                  <DialogDescription>Modifica el resultado del partido</DialogDescription>
                                </DialogHeader>
                                <MatchResultForm
                                  match={match}
                                  team1Name={getTeamName(match.team1Id)}
                                  team2Name={getTeamName(match.team2Id)}
                                  onSuccess={() => {
                                    // Refresh matches
                                    supabase
                                      .from("matches")
                                      .select("*")
                                      .eq("tournamentId", tournament.id)
                                      .order("date", { ascending: true })
                                      .then(({ data }) => {
                                        if (data) setMatches(data as Match[])
                                      })
                                  }}
                                />
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">No hay resultados registrados todavía.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )

  function getPlayerName(playerId: string) {
    const player = players.find((p) => p.id === playerId)
    return player ? `${player.firstName} ${player.lastName}` : `Jugador ${playerId}`
  }

  function getTeamName(teamId: string) {
    const team = teams.find((t) => t.id === teamId)
    if (!team) return `Equipo ${teamId}`

    const player1 = players.find((p) => p.id === team.player1Id)
    const player2 = players.find((p) => p.id === team.player2Id)

    return player1 && player2 ? `${player1.lastName} / ${player2.lastName}` : `Equipo ${teamId}`
  }
}

function AddTeamForm({
  tournamentId,
  players,
  onSuccess,
}: {
  tournamentId: string
  players: Player[]
  onSuccess: () => void
}) {
  const [player1Id, setPlayer1Id] = useState("")
  const [player2Id, setPlayer2Id] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!player1Id || !player2Id) {
        throw new Error("Por favor, selecciona ambos jugadores")
      }

      if (player1Id === player2Id) {
        throw new Error("No puedes seleccionar el mismo jugador dos veces")
      }

      const { error } = await supabase.from("teams").insert([
        {
          player1Id,
          player2Id,
          tournamentId,
        },
      ])

      if (error) throw error

      onSuccess()
    } catch (error) {
      console.error("Error adding team:", error)
      setError(error instanceof Error ? error.message : "Error al agregar el equipo")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="player1">Jugador 1</Label>
          <Select value={player1Id} onValueChange={setPlayer1Id}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un jugador" />
            </SelectTrigger>
            <SelectContent>
              {players.map((player) => (
                <SelectItem key={player.id} value={player.id}>
                  {player.firstName} {player.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="player2">Jugador 2</Label>
          <Select value={player2Id} onValueChange={setPlayer2Id}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un jugador" />
            </SelectTrigger>
            <SelectContent>
              {players.map((player) => (
                <SelectItem key={player.id} value={player.id}>
                  {player.firstName} {player.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error && <div className="text-destructive text-sm">{error}</div>}
      </div>

      <DialogFooter>
        <Button type="submit" disabled={loading}>
          {loading ? "Agregando..." : "Agregar Equipo"}
        </Button>
      </DialogFooter>
    </form>
  )
}

function MatchResultForm({
  match,
  team1Name,
  team2Name,
  onSuccess,
}: {
  match: Match
  team1Name: string
  team2Name: string
  onSuccess: () => void
}) {
  const [set1Team1, setSet1Team1] = useState(match.team1Score?.[0]?.toString() || "")
  const [set1Team2, setSet1Team2] = useState(match.team2Score?.[0]?.toString() || "")
  const [set2Team1, setSet2Team1] = useState(match.team1Score?.[1]?.toString() || "")
  const [set2Team2, setSet2Team2] = useState(match.team2Score?.[1]?.toString() || "")
  const [set3Team1, setSet3Team1] = useState(match.team1Score?.[2]?.toString() || "")
  const [set3Team2, setSet3Team2] = useState(match.team2Score?.[2]?.toString() || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!set1Team1 || !set1Team2 || !set2Team1 || !set2Team2) {
        throw new Error("Por favor, completa al menos los dos primeros sets")
      }

      const team1Score = [Number.parseInt(set1Team1), Number.parseInt(set2Team1)]
      const team2Score = [Number.parseInt(set1Team2), Number.parseInt(set2Team2)]

      // Add third set if provided
      if (set3Team1 && set3Team2) {
        team1Score.push(Number.parseInt(set3Team1))
        team2Score.push(Number.parseInt(set3Team2))
      }

      const { error } = await supabase
        .from("matches")
        .update({
          team1Score,
          team2Score,
          status: "completed",
        })
        .eq("id", match.id)

      if (error) throw error

      onSuccess()
    } catch (error) {
      console.error("Error updating match result:", error)
      setError(error instanceof Error ? error.message : "Error al actualizar el resultado")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4 py-4">
        <div className="grid grid-cols-3 gap-4">
          <div></div>
          <div className="text-center font-medium">{team1Name}</div>
          <div className="text-center font-medium">{team2Name}</div>

          <div className="font-medium">Set 1</div>
          <div>
            <Input
              type="number"
              min="0"
              max="7"
              value={set1Team1}
              onChange={(e) => setSet1Team1(e.target.value)}
              required
            />
          </div>
          <div>
            <Input
              type="number"
              min="0"
              max="7"
              value={set1Team2}
              onChange={(e) => setSet1Team2(e.target.value)}
              required
            />
          </div>

          <div className="font-medium">Set 2</div>
          <div>
            <Input
              type="number"
              min="0"
              max="7"
              value={set2Team1}
              onChange={(e) => setSet2Team1(e.target.value)}
              required
            />
          </div>
          <div>
            <Input
              type="number"
              min="0"
              max="7"
              value={set2Team2}
              onChange={(e) => setSet2Team2(e.target.value)}
              required
            />
          </div>

          <div className="font-medium">Set 3</div>
          <div>
            <Input type="number" min="0" max="7" value={set3Team1} onChange={(e) => setSet3Team1(e.target.value)} />
          </div>
          <div>
            <Input type="number" min="0" max="7" value={set3Team2} onChange={(e) => setSet3Team2(e.target.value)} />
          </div>
        </div>

        {error && <div className="text-destructive text-sm">{error}</div>}
      </div>

      <DialogFooter>
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Guardar Resultado"}
        </Button>
      </DialogFooter>
    </form>
  )
}

