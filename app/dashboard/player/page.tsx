"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import Navbar from "@/components/navbar"
import type { Tournament, Player } from "@/types"

export default function PlayerDashboard() {
  const router = useRouter()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [playerProfile, setPlayerProfile] = useState<Player | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push("/login?role=JUGADOR")
        return
      }

      const { data: userData, error } = await supabase.from("users").select("*").eq("id", session.user.id).single()

      if (error || !userData || userData.role !== "JUGADOR") {
        await supabase.auth.signOut()
        router.push("/login?role=JUGADOR")
        return
      }

      setUser(userData)

      // Fetch player profile if it exists
      if (userData.playerId) {
        const { data: playerData, error: playerError } = await supabase
          .from("players")
          .select("*")
          .eq("id", userData.playerId)
          .single()

        if (!playerError && playerData) {
          setPlayerProfile(playerData as Player)
        }
      }

      // Fetch tournaments the player is registered for
      // This is a simplified example - in a real app, you'd need to join tables
      const { data: tournamentsData, error: tournamentsError } = await supabase
        .from("tournaments")
        .select("*")
        .order("startDate", { ascending: false })

      if (!tournamentsError && tournamentsData) {
        setTournaments(tournamentsData as Tournament[])
      }

      setLoading(false)
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Panel de Jugador</h1>

        {!playerProfile ? (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Completa tu Perfil</CardTitle>
              <CardDescription>Necesitas completar tu perfil para poder inscribirte en torneos</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Tu perfil de jugador aún no está configurado. Completa tu información para acceder a todas las
                funcionalidades.
              </p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => router.push("/dashboard/player/profile/create")}>Crear Perfil</Button>
            </CardFooter>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Mi Ranking</CardTitle>
                <CardDescription>Tu posición actual</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{playerProfile.score} pts</p>
                <p className="text-sm text-muted-foreground">Categoría: {playerProfile.category}</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" onClick={() => router.push("/ranking")} className="w-full">
                  Ver Ranking Completo
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Mis Torneos</CardTitle>
                <CardDescription>Torneos en los que participas</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">0</p>
              </CardContent>
              <CardFooter>
                <Button onClick={() => router.push("/tournaments")} className="w-full">
                  Buscar Torneos
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Mis Partidos</CardTitle>
                <CardDescription>Historial de partidos</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">0</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" onClick={() => router.push("/dashboard/player/matches")} className="w-full">
                  Ver Mis Partidos
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        <Tabs defaultValue="upcoming">
          <TabsList className="mb-6">
            <TabsTrigger value="upcoming">Próximos Torneos</TabsTrigger>
            <TabsTrigger value="registered">Mis Inscripciones</TabsTrigger>
            <TabsTrigger value="past">Torneos Pasados</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {tournaments.filter((t) => t.status === "not_started").length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tournaments
                  .filter((t) => t.status === "not_started")
                  .map((tournament) => (
                    <TournamentCard
                      key={tournament.id}
                      tournament={tournament}
                      onView={() => router.push(`/tournaments/${tournament.id}`)}
                      onRegister={() => router.push(`/tournaments/${tournament.id}/register`)}
                      showRegisterButton={!!playerProfile}
                    />
                  ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">No hay próximos torneos disponibles.</p>
                  <Button variant="link" onClick={() => router.push("/tournaments")}>
                    Ver todos los torneos
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="registered">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No estás inscrito en ningún torneo actualmente.</p>
                <Button variant="link" onClick={() => router.push("/tournaments")}>
                  Buscar torneos para inscribirte
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="past">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No has participado en torneos anteriores.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function TournamentCard({
  tournament,
  onView,
  onRegister,
  showRegisterButton = true,
}: {
  tournament: Tournament
  onView: () => void
  onRegister: () => void
  showRegisterButton?: boolean
}) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tournament.name}</CardTitle>
        <CardDescription>
          {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Categoría: {tournament.category}</p>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Button onClick={onView} variant="outline" className="w-full">
          Ver Detalles
        </Button>
        {showRegisterButton && (
          <Button onClick={onRegister} className="w-full">
            Inscribirse
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

