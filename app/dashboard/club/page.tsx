"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import Navbar from "@/components/navbar"
import type { Tournament } from "@/types"

export default function ClubDashboard() {
  const router = useRouter()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
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

      // Fetch tournaments for this club
      const { data: tournamentsData, error: tournamentsError } = await supabase
        .from("tournaments")
        .select("*")
        .eq("clubId", userData.id)
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
        <h1 className="text-3xl font-bold mb-6">Panel de Control del Club</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Torneos</CardTitle>
              <CardDescription>Gestiona tus torneos</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{tournaments.length}</p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => router.push("/dashboard/club/tournaments/create")} className="w-full">
                Crear Torneo
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Jugadores</CardTitle>
              <CardDescription>Gestiona los jugadores</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">0</p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => router.push("/dashboard/club/players/create")} className="w-full">
                Crear Jugador
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Partidos</CardTitle>
              <CardDescription>Gestiona los partidos</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">0</p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => router.push("/dashboard/club/matches")} className="w-full">
                Ver Partidos
              </Button>
            </CardFooter>
          </Card>
        </div>

        <Tabs defaultValue="active">
          <TabsList className="mb-6">
            <TabsTrigger value="active">Torneos Activos</TabsTrigger>
            <TabsTrigger value="upcoming">Próximos Torneos</TabsTrigger>
            <TabsTrigger value="past">Torneos Pasados</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {tournaments.filter((t) => t.status === "in_progress").length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tournaments
                  .filter((t) => t.status === "in_progress")
                  .map((tournament) => (
                    <TournamentCard
                      key={tournament.id}
                      tournament={tournament}
                      onView={() => router.push(`/dashboard/club/tournaments/${tournament.id}`)}
                    />
                  ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">No hay torneos activos actualmente.</p>
                  <Button variant="link" onClick={() => router.push("/dashboard/club/tournaments/create")}>
                    Crear un nuevo torneo
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="upcoming">
            {tournaments.filter((t) => t.status === "not_started").length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tournaments
                  .filter((t) => t.status === "not_started")
                  .map((tournament) => (
                    <TournamentCard
                      key={tournament.id}
                      tournament={tournament}
                      onView={() => router.push(`/dashboard/club/tournaments/${tournament.id}`)}
                    />
                  ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">No hay próximos torneos programados.</p>
                  <Button variant="link" onClick={() => router.push("/dashboard/club/tournaments/create")}>
                    Programar un nuevo torneo
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="past">
            {tournaments.filter((t) => t.status === "finished").length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tournaments
                  .filter((t) => t.status === "finished")
                  .map((tournament) => (
                    <TournamentCard
                      key={tournament.id}
                      tournament={tournament}
                      onView={() => router.push(`/dashboard/club/tournaments/${tournament.id}`)}
                    />
                  ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">No hay torneos pasados.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function TournamentCard({ tournament, onView }: { tournament: Tournament; onView: () => void }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "not_started":
        return "text-yellow-500"
      case "in_progress":
        return "text-green-500"
      case "finished":
        return "text-blue-500"
      default:
        return ""
    }
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
        <p className={`font-medium ${getStatusColor(tournament.status)}`}>{getStatusText(tournament.status)}</p>
        <p className="text-sm text-muted-foreground mt-2">Categoría: {tournament.category}</p>
      </CardContent>
      <CardFooter>
        <Button onClick={onView} className="w-full">
          Ver Detalles
        </Button>
      </CardFooter>
    </Card>
  )
}

