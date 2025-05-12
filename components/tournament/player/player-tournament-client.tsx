"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trophy, Users, Calendar, MapPin, Phone, UserPlus, UserCog } from 'lucide-react'
import { useUser } from "@/contexts/user-context"
import RegisterCoupleForm from "./register-couple-form"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import { registerAuthenticatedPlayerForTournament } from "@/app/api/tournaments/actions"

// Tipos
import type { Tournament, Category, PlayerDTO } from "@/types"
import type { Tables } from "@/database.types"

type Club = {
  id: string
  name: string
  address?: string | null
  phone?: string | null
  email?: string | null
}

type PlayerInfo = { id: string; first_name: string | null; last_name: string | null; score: number | null }
type ProcessedCouple = Tables<"couples"> & {
  player_1_info: PlayerInfo | null
  player_2_info: PlayerInfo | null
}

interface PlayerTournamentViewProps {
  tournament: Tournament
  category: Category | null
  club: Club | null
  players: PlayerInfo[]
  couples: ProcessedCouple[]
  allPlayersForSearch: PlayerDTO[]
}

export default function PlayerTournamentView({
  tournament,
  category,
  club,
  players,
  couples,
  allPlayersForSearch,
}: PlayerTournamentViewProps) {
  const [isRegistering, setIsRegistering] = useState(false)
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false)
  const [coupleDialogOpen, setCoupleDialogOpen] = useState(false)
  const [showSoloConfirmDialog, setShowSoloConfirmDialog] = useState(false)
  const [soloConfirmPlayerName, setSoloConfirmPlayerName] = useState("")
  const { user: contextUser, userDetails, loading: contextLoading } = useUser()
  const router = useRouter()

  // Determinar si el torneo ya comenzó
  const isTournamentActive = tournament.status !== "NOT_STARTED"

  // Nuevo manejador para abrir el diálogo de confirmación de registro individual
  const handleOpenSoloRegisterConfirm = () => {
    if (!contextUser || !userDetails) {
      toast({
        title: "Error de autenticación",
        description: "No se pudo obtener la información del usuario.",
        variant: "destructive",
      })
      return
    }

    const playerName =
      `${contextUser?.user_metadata?.first_name || "Jugador"} ${contextUser?.user_metadata?.last_name || ""}`.trim()
    setSoloConfirmPlayerName(playerName)
    setShowSoloConfirmDialog(true)
  }

  // Manejador para confirmar y procesar el registro individual
  const handleConfirmSoloRegistration = async () => {
    if (!tournament) return
    setIsRegistering(true)
    setShowSoloConfirmDialog(false) // Cerrar diálogo inmediatamente

    try {
      const result = await registerAuthenticatedPlayerForTournament(tournament.id)
      if (result.success) {
        toast({
          title: "¡Inscripción Exitosa!",
          description: result.message,
        })
        router.refresh() // Refrescar datos en la página
      } else {
        toast({
          title: "Error de Inscripción",
          description: result.message || "No se pudo completar la inscripción.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al registrar jugador:", error)
      toast({
        title: "Error Inesperado",
        description: "Ocurrió un error al procesar tu solicitud.",
        variant: "destructive",
      })
    } finally {
      setIsRegistering(false)
    }
  }

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
        return "bg-amber-50 text-amber-700 border border-amber-200"
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

  // Verificar si el usuario ya está registrado
  const isUserRegistered = () => {
    if (!contextUser || !userDetails) return false

    // Verificar si está registrado como jugador individual
    const isRegisteredAsSingle = players.some((player) => player.id === userDetails.player_id)

    // Verificar si está registrado como parte de una pareja
    const isRegisteredAsCouple = couples.some(
      (couple) =>
        couple.player_1_info?.id === userDetails.player_id || couple.player_2_info?.id === userDetails.player_id,
    )

    return isRegisteredAsSingle || isRegisteredAsCouple
  }

  // Manejar el cierre del diálogo de registro y refrescar datos
  const handleRegisterDialogClose = (success: boolean) => {
    setRegisterDialogOpen(false)
    if (success) {
      router.refresh()
    }
  }

  // Manejar el cierre del diálogo de registro de pareja y refrescar datos
  const handleCoupleDialogClose = (success: boolean) => {
    setCoupleDialogOpen(false)
    if (success) {
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabecera del torneo */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent mb-2">
          {tournament.name}
        </h1>
        <p className="text-slate-600 max-w-2xl mx-auto">{tournament.club?.name || "Club no especificado"}</p>
      </div>

      {/* Información del torneo */}
      <Card className="bg-white rounded-xl shadow-md border border-slate-100 hover:border-teal-100 transition-all duration-300">
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
                <div className="flex-shrink-0">
                  <Trophy className="h-5 w-5 mr-2 text-blue-600" />
                </div>
                <span className="text-slate-700 font-medium">Estado:</span>
                <span
                  className={`ml-2 px-2 py-0.5 rounded-full text-sm font-medium ${getStatusColor(tournament.status)}`}
                >
                  {getStatusText(tournament.status)}
                </span>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                </div>
                <div>
                  <span className="text-slate-700 font-medium">Club:</span>
                  <div className="ml-2 text-slate-600">
                    <div>{club?.name || "No especificado"}</div>
                    {club?.address && <div className="text-sm">{club.address}</div>}
                  </div>
                </div>
              </div>
              {club?.phone && (
                <div className="flex items-center">
                  <Phone className="h-5 w-5 mr-2 text-blue-600" />
                  <span className="text-slate-700 font-medium">Teléfono:</span>
                  <span className="ml-2 text-slate-600">{club.phone}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botones de acción */}
      {!isTournamentActive && (
        <div className="flex flex-wrap gap-4 justify-center">
          {/* Botón para inscripción individual */}
          <Button
            onClick={handleOpenSoloRegisterConfirm}
            className="bg-gradient-to-r from-teal-600 to-blue-600 hover:opacity-90 text-white rounded-xl font-normal shadow-md"
            disabled={isUserRegistered() || contextLoading || isRegistering}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Inscribirme solo
          </Button>

          {/* Diálogo para inscripción en pareja */}
          <Dialog open={coupleDialogOpen} onOpenChange={setCoupleDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-gradient-to-r from-teal-600 to-blue-600 hover:opacity-90 text-white rounded-xl font-normal shadow-md"
                disabled={isUserRegistered() || contextLoading}
              >
                <Users className="mr-2 h-4 w-4" />
                Inscribir pareja
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Inscripción de Pareja</DialogTitle>
                <DialogDescription>Registre una pareja para el torneo {tournament.name}</DialogDescription>
              </DialogHeader>
              <RegisterCoupleForm
                tournamentId={tournament.id}
                onComplete={(success) => handleCoupleDialogClose(success)}
                players={allPlayersForSearch}
              />
            </DialogContent>
          </Dialog>

          {/* AlertDialog para confirmación de registro individual */}
          <AlertDialog open={showSoloConfirmDialog} onOpenChange={setShowSoloConfirmDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Inscripción Individual</AlertDialogTitle>
                <AlertDialogDescription>
                  ¿Estás seguro de que quieres inscribirte como jugador individual en el torneo
                  <strong> {tournament.name}</strong> como <strong>{soloConfirmPlayerName}</strong>?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isRegistering}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmSoloRegistration} disabled={isRegistering}>
                  {isRegistering ? "Inscribiendo..." : "Confirmar Inscripción"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {isUserRegistered() && (
            <Button
              className="bg-black hover:bg-slate-800 text-white rounded-xl font-normal shadow-md"
              onClick={() => router.push(`/player/profile`)}
            >
              <UserCog className="mr-2 h-4 w-4" />
              Ver mi perfil
            </Button>
          )}
        </div>
      )}

      {/* Tabs para diferentes secciones */}
      <Tabs
        defaultValue="players"
        className="bg-white rounded-xl shadow-md border border-slate-100 hover:border-teal-100 transition-all duration-300"
      >
        <TabsList className="w-full border-b border-slate-200 rounded-t-xl bg-slate-50">
          <TabsTrigger
            value="players"
            className="flex-1 py-3 data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-teal-500"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Jugadores Individuales
          </TabsTrigger>
          <TabsTrigger
            value="couples"
            className="flex-1 py-3 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500"
          >
            <Users className="mr-2 h-4 w-4" />
            Parejas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="players" className="p-6">
          {players.length > 0 ? (
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="border-b border-slate-200">
                  <TableHead className="font-medium text-slate-500">Nombre</TableHead>
                  <TableHead className="font-medium text-slate-500">Apellido</TableHead>
                  <TableHead className="font-medium text-slate-500 text-center">Puntaje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((player) => (
                  <TableRow key={player.id} className="hover:bg-slate-50 border-b border-slate-100">
                    <TableCell className="text-left font-medium text-slate-700">{player.first_name || "—"}</TableCell>
                    <TableCell className="text-left text-slate-700">{player.last_name || "—"}</TableCell>
                    <TableCell className="text-center">
                      {player.score !== null ? (
                        <div className="inline-flex items-center justify-center bg-teal-50 text-teal-700 font-medium rounded-full h-10 w-10 border border-teal-200">
                          {player.score}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <div className="bg-teal-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-teal-100">
                <UserPlus className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-medium text-teal-700 mb-2">No hay jugadores inscritos</h3>
              <p className="text-slate-500 max-w-md mx-auto text-sm">
                Aún no hay jugadores individuales inscritos en este torneo.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="couples" className="p-6">
          {couples.length > 0 ? (
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="border-b border-slate-200">
                  <TableHead className="font-medium text-slate-500">Jugador 1</TableHead>
                  <TableHead className="font-medium text-slate-500 text-center">Puntaje</TableHead>
                  <TableHead className="font-medium text-slate-500">Jugador 2</TableHead>
                  <TableHead className="font-medium text-slate-500 text-center">Puntaje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {couples.map((couple) => (
                  <TableRow key={couple.id} className="hover:bg-slate-50 border-b border-slate-100">
                    <TableCell className="text-left font-medium text-slate-700">
                      {couple.player_1_info
                        ? `${couple.player_1_info.first_name || ""} ${couple.player_1_info.last_name || ""}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {couple.player_1_info?.score !== null && couple.player_1_info?.score !== undefined ? (
                        <div className="inline-flex items-center justify-center bg-blue-50 text-blue-700 font-medium rounded-full h-9 w-9 border border-blue-200">
                          {couple.player_1_info.score}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-left font-medium text-slate-700">
                      {couple.player_2_info
                        ? `${couple.player_2_info.first_name || ""} ${couple.player_2_info.last_name || ""}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {couple.player_2_info?.score !== null && couple.player_2_info?.score !== undefined ? (
                        <div className="inline-flex items-center justify-center bg-blue-50 text-blue-700 font-medium rounded-full h-9 w-9 border border-blue-200">
                          {couple.player_2_info.score}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-medium text-blue-700 mb-2">No hay parejas inscritas</h3>
              <p className="text-slate-500 max-w-md mx-auto text-sm">Aún no hay parejas inscritas en este torneo.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
