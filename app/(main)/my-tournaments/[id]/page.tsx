import { Suspense } from "react"
import { redirect, notFound } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
} from "lucide-react"
import Link from "next/link"
import { useUser } from "@/contexts/user-context"

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
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6 space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
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
async function getTournamentDetails(tournamentId: string) {
  const supabase = await createClient()

  const { userDetails } = useUser()
  if (userDetails?.role !== "CLUB") {
    return redirect("/")
  }

  // Obtener información del torneo
  const { data: tournament, error: tournamentError } = await supabase
    .from("tournaments")
    .select(`
      *,
      category:categories(id, name),
      club:clubs(*)
    `)
    .eq("id", tournamentId)
    .eq("club_id", userDetails.club_id)
    .single()

  if (tournamentError || !tournament) {
    console.error("Error al obtener datos del torneo:", tournamentError)
    return notFound()
  }

  // Obtener inscripciones
  const { data: inscriptions, error: inscriptionsError } = await supabase
    .from("inscriptions")
    .select(`
      id,
      player:players(id, first_name, last_name, phone, email, dni),
      couple:couples(
        id,
        player_1:players!couples_player_1_id_fkey(id, first_name, last_name, phone, email, dni),
        player_2:players!couples_player_2_id_fkey(id, first_name, last_name, phone, email, dni)
      )
    `)
    .eq("tournament_id", tournamentId)

  if (inscriptionsError) {
    console.error("Error al obtener inscripciones:", inscriptionsError)
    return { tournament, inscriptions: [] }
  }

  return { tournament, inscriptions }
}

// Componente principal
export default async function TournamentDetailsPage({ params }: { params: { id: string } }) {
  const { tournament, inscriptions } = await getTournamentDetails(params.id)

  // Separar inscripciones individuales y parejas
  const individualInscriptions = inscriptions.filter((insc) => insc.player && !insc.couple)
  const coupleInscriptions = inscriptions.filter((insc) => insc.couple)

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
  }

  // Obtener icono según el estado
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "NOT_STARTED":
        return <Clock className="h-5 w-5 text-yellow-500" />
      case "PAIRING":
        return <PauseCircle className="h-5 w-5 text-purple-500" />
      case "IN_PROGRESS":
        return <Trophy className="h-5 w-5 text-teal-500" />
      case "FINISHED":
        return <CheckCircle className="h-5 w-5 text-blue-500" />
      case "CANCELED":
        return <Ban className="h-5 w-5 text-red-500" />
      default:
        return <Trophy className="h-5 w-5 text-teal-500" />
    }
  }

  // Obtener color según el estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case "NOT_STARTED":
        return "bg-yellow-50 text-yellow-700 border-yellow-200"
      case "PAIRING":
        return "bg-purple-50 text-purple-700 border-purple-200"
      case "IN_PROGRESS":
        return "bg-teal-50 text-teal-700 border-teal-200"
      case "FINISHED":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "CANCELED":
        return "bg-red-50 text-red-700 border-red-200"
      default:
        return "bg-slate-100 text-slate-700 border-slate-200"
    }
  }

  // Obtener texto según el estado
  const getStatusText = (status: string) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={<TournamentDetailsLoading />}>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <Button asChild variant="outline" className="flex items-center gap-2">
                <Link href="/my-tournaments">
                  <ArrowLeft className="h-4 w-4" />
                  Volver a Mis Torneos
                </Link>
              </Button>
              <span
                className={`px-3 py-1.5 rounded-full font-medium ${getStatusColor(
                  tournament.status,
                )} flex items-center gap-2`}
              >
                {getStatusIcon(tournament.status)}
                {getStatusText(tournament.status)}
              </span>
            </div>

            <div className="text-center mb-8">
              <h1 className="text-3xl font-light text-teal-700 mb-2">{tournament.name}</h1>
              <p className="text-slate-600 max-w-2xl mx-auto">{tournament.club?.name}</p>
            </div>

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
                        {formatDate(tournament.start_date)} - {formatDate(tournament.end_date)}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Trophy className="h-5 w-5 mr-2 text-teal-600" />
                      <span className="text-slate-700 font-medium">Categoría:</span>
                      <span className="ml-2 inline-block bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full text-sm font-medium border border-teal-100">
                        {tournament.category?.name || "No especificada"}
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
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        <MapPin className="h-5 w-5 mr-2 text-teal-600" />
                      </div>
                      <div>
                        <span className="text-slate-700 font-medium">Dirección:</span>
                        <div className="ml-2 text-slate-600">
                          <div>{tournament.club?.address || "No especificada"}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 mr-2 text-teal-600" />
                      <span className="text-slate-700 font-medium">Teléfono:</span>
                      <span className="ml-2 text-slate-600">{tournament.club?.phone || "No especificado"}</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 mr-2 text-teal-600" />
                      <span className="text-slate-700 font-medium">Email:</span>
                      <span className="ml-2 text-slate-600">{tournament.club?.email || "No especificado"}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-teal-600" />
                      <span className="text-slate-700 font-medium">Inscripciones:</span>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-slate-600">
                        <span className="font-medium text-teal-700">{individualInscriptions.length}</span> jugadores
                        individuales
                      </span>
                      <span className="text-slate-600">
                        <span className="font-medium text-teal-700">{coupleInscriptions.length}</span> parejas
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs
              defaultValue="players"
              className="bg-white rounded-lg shadow-sm border border-slate-100 hover:border-teal-100 transition-all duration-300"
            >
              <TabsList className="w-full border-b border-slate-200 rounded-t-lg bg-slate-50">
                <TabsTrigger
                  value="players"
                  className="flex-1 py-3 data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-teal-500"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Jugadores Individuales ({individualInscriptions.length})
                </TabsTrigger>
                <TabsTrigger
                  value="couples"
                  className="flex-1 py-3 data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-teal-500"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Parejas ({coupleInscriptions.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="players" className="p-6">
                {individualInscriptions.length > 0 ? (
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow className="border-b border-slate-200">
                        <TableHead className="font-medium text-slate-500">Nombre</TableHead>
                        <TableHead className="font-medium text-slate-500">Apellido</TableHead>
                        <TableHead className="font-medium text-slate-500">DNI</TableHead>
                        <TableHead className="font-medium text-slate-500">Teléfono</TableHead>
                        <TableHead className="font-medium text-slate-500">Email</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {individualInscriptions.map((inscription: any) => (
                        <TableRow key={inscription.id} className="hover:bg-slate-50 border-b border-slate-100">
                          <TableCell className="text-left font-medium text-slate-700">
                            {inscription.player?.first_name || "—"}
                          </TableCell>
                          <TableCell className="text-left text-slate-700">
                            {inscription.player?.last_name || "—"}
                          </TableCell>
                          <TableCell className="text-left text-slate-700">{inscription.player?.dni || "—"}</TableCell>
                          <TableCell className="text-left text-slate-700">{inscription.player?.phone || "—"}</TableCell>
                          <TableCell className="text-left text-slate-700">{inscription.player?.email || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <div className="bg-teal-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-teal-100">
                      <Users className="h-8 w-8 text-teal-600" />
                    </div>
                    <h3 className="text-xl font-light text-teal-700 mb-2">No hay jugadores inscritos</h3>
                    <p className="text-slate-500 max-w-md mx-auto text-sm">
                      Aún no hay jugadores individuales inscritos en este torneo.
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="couples" className="p-6">
                {coupleInscriptions.length > 0 ? (
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow className="border-b border-slate-200">
                        <TableHead className="font-medium text-slate-500">Jugador 1</TableHead>
                        <TableHead className="font-medium text-slate-500">Jugador 2</TableHead>
                        <TableHead className="font-medium text-slate-500">Teléfono J1</TableHead>
                        <TableHead className="font-medium text-slate-500">Teléfono J2</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coupleInscriptions.map((inscription: any) => (
                        <TableRow key={inscription.id} className="hover:bg-slate-50 border-b border-slate-100">
                          <TableCell className="text-left font-medium text-slate-700">
                            {inscription.couple?.player_1
                              ? `${inscription.couple.player_1.first_name || ""} ${
                                  inscription.couple.player_1.last_name || ""
                                }`
                              : "—"}
                          </TableCell>
                          <TableCell className="text-left text-slate-700">
                            {inscription.couple?.player_2
                              ? `${inscription.couple.player_2.first_name || ""} ${
                                  inscription.couple.player_2.last_name || ""
                                }`
                              : "—"}
                          </TableCell>
                          <TableCell className="text-left text-slate-700">
                            {inscription.couple?.player_1?.phone || "—"}
                          </TableCell>
                          <TableCell className="text-left text-slate-700">
                            {inscription.couple?.player_2?.phone || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <div className="bg-teal-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-teal-100">
                      <Users className="h-8 w-8 text-teal-600" />
                    </div>
                    <h3 className="text-xl font-light text-teal-700 mb-2">No hay parejas inscritas</h3>
                    <p className="text-slate-500 max-w-md mx-auto text-sm">
                      Aún no hay parejas inscritas en este torneo.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex justify-center gap-4 mt-8">
              <Button
                asChild
                variant="outline"
                className="border-teal-200 text-teal-600 hover:bg-teal-50 hover:text-teal-700"
              >
                <Link href={`/my-tournaments/${params.id}/edit`}>
                  <Trophy className="mr-2 h-4 w-4" />
                  Editar Torneo
                </Link>
              </Button>

              {tournament.status === "NOT_STARTED" && (
                <Button asChild className="bg-teal-600 hover:bg-teal-700 text-white">
                  <Link href={`/my-tournaments/${params.id}/start`}>
                    <Trophy className="mr-2 h-4 w-4" />
                    Iniciar Torneo
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </Suspense>
      </div>
    </div>
  )
}
