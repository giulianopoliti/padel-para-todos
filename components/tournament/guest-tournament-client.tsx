"use client"

import { useState } from "react"
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
import { Trophy, Users, Calendar, MapPin, Phone, UserPlus } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { requestSoloInscription, requestCoupleInscription } from "@/app/api/tournaments/actions"

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

interface GuestTournamentClientProps {
  tournament: Tournament
  category: Category | null
  club: Club | null
  players: PlayerInfo[]
  couples: ProcessedCouple[]
  allPlayersForSearch: PlayerDTO[]
}

export default function GuestTournamentClient({
  tournament,
  category,
  club,
  players,
  couples,
  allPlayersForSearch,
}: GuestTournamentClientProps) {
  const [soloDialogOpen, setSoloDialogOpen] = useState(false)
  const [coupleDialogOpen, setCoupleDialogOpen] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerDTO | null>(null)
  const [selectedPlayer1, setSelectedPlayer1] = useState<PlayerDTO | null>(null)
  const [selectedPlayer2, setSelectedPlayer2] = useState<PlayerDTO | null>(null)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [openPlayer, setOpenPlayer] = useState(false)
  const [openPlayer1, setOpenPlayer1] = useState(false)
  const [openPlayer2, setOpenPlayer2] = useState(false)

  // Determinar si el torneo ya comenzó
  const isTournamentActive = tournament.status !== "NOT_STARTED"

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

  // Manejar envío de solicitud individual
  const handleSoloRequestSubmit = async () => {
    if (!selectedPlayer) {
      toast({
        title: "Error",
        description: "Por favor selecciona un jugador",
        variant: "destructive",
      })
      return
    }

    if (!phoneNumber) {
      toast({
        title: "Error",
        description: "Por favor ingresa un número de teléfono de contacto",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const result = await requestSoloInscription(
        tournament.id,
        selectedPlayer.id,
        phoneNumber
      );

      if (result.success) {
        toast({
          title: "Solicitud enviada",
          description: result.message,
        });
        setSoloDialogOpen(false);
        setSelectedPlayer(null);
        setPhoneNumber("");
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting solo request:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar la solicitud. Inténtalo de nuevo más tarde.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false)
    }
  }

  // Manejar envío de solicitud de pareja
  const handleCoupleRequestSubmit = async () => {
    if (!selectedPlayer1 || !selectedPlayer2) {
      toast({
        title: "Error",
        description: "Por favor selecciona ambos jugadores",
        variant: "destructive",
      })
      return
    }

    if (selectedPlayer1.id === selectedPlayer2.id) {
      toast({
        title: "Error",
        description: "No puedes seleccionar el mismo jugador dos veces",
        variant: "destructive",
      })
      return
    }

    if (!phoneNumber) {
      toast({
        title: "Error",
        description: "Por favor ingresa un número de teléfono de contacto",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const result = await requestCoupleInscription(
        tournament.id,
        selectedPlayer1.id,
        selectedPlayer2.id,
        phoneNumber
      );

      if (result.success) {
        toast({
          title: "Solicitud enviada",
          description: result.message,
        });
        setCoupleDialogOpen(false);
        setSelectedPlayer1(null);
        setSelectedPlayer2(null);
        setPhoneNumber("");
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting couple request:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar la solicitud. Inténtalo de nuevo más tarde.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false)
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
          {/* Diálogo para inscripción individual */}
          <Dialog open={soloDialogOpen} onOpenChange={setSoloDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-teal-600 to-blue-600 hover:opacity-90 text-white rounded-xl font-normal shadow-md">
                <UserPlus className="mr-2 h-4 w-4" />
                Inscribirme solo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Solicitud de Inscripción Individual</DialogTitle>
                <DialogDescription>
                  Busca tu perfil y envía una solicitud para participar en el torneo {tournament.name}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="player-search">Buscar Jugador</Label>
                  <Popover open={openPlayer} onOpenChange={setOpenPlayer}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openPlayer}
                        className="w-full justify-between"
                      >
                        {selectedPlayer
                          ? `${selectedPlayer.first_name} ${selectedPlayer.last_name}`
                          : "Seleccionar jugador..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <Command>
                        <CommandInput placeholder="Buscar jugador..." />
                        <CommandList>
                          <CommandEmpty>No se encontraron jugadores.</CommandEmpty>
                          <CommandGroup>
                            {allPlayersForSearch.map((player) => (
                              <CommandItem
                                key={player.id}
                                value={`${player.first_name} ${player.last_name}`}
                                onSelect={() => {
                                  setSelectedPlayer(player)
                                  setOpenPlayer(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedPlayer?.id === player.id ? "opacity-100" : "opacity-0",
                                  )}
                                />
                                {player.first_name} {player.last_name}
                                {player.score !== null && (
                                  <span className="ml-auto bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full text-xs font-medium">
                                    {player.score}
                                  </span>
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono de Contacto</Label>
                  <Input
                    id="phone"
                    placeholder="Ej: 1123456789"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                  <p className="text-sm text-slate-500">El club te contactará para confirmar tu inscripción.</p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSoloDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                  onClick={handleSoloRequestSubmit}
                  disabled={isSubmitting || !selectedPlayer || !phoneNumber}
                >
                  {isSubmitting ? "Enviando..." : "Enviar Solicitud"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Diálogo para inscripción en pareja */}
          <Dialog open={coupleDialogOpen} onOpenChange={setCoupleDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-teal-600 to-blue-600 hover:opacity-90 text-white rounded-xl font-normal shadow-md">
                <Users className="mr-2 h-4 w-4" />
                Inscribir pareja
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Solicitud de Inscripción de Pareja</DialogTitle>
                <DialogDescription>
                  Busca los perfiles de ambos jugadores y envía una solicitud para participar en el torneo{" "}
                  {tournament.name}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Jugador 1 */}
                <div className="space-y-2">
                  <Label htmlFor="player1-search">Jugador 1</Label>
                  <Popover open={openPlayer1} onOpenChange={setOpenPlayer1}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openPlayer1}
                        className="w-full justify-between"
                      >
                        {selectedPlayer1
                          ? `${selectedPlayer1.first_name} ${selectedPlayer1.last_name}`
                          : "Seleccionar jugador 1..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <Command>
                        <CommandInput placeholder="Buscar jugador..." />
                        <CommandList>
                          <CommandEmpty>No se encontraron jugadores.</CommandEmpty>
                          <CommandGroup>
                            {allPlayersForSearch.map((player) => (
                              <CommandItem
                                key={player.id}
                                value={`${player.first_name} ${player.last_name}`}
                                onSelect={() => {
                                  setSelectedPlayer1(player)
                                  setOpenPlayer1(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedPlayer1?.id === player.id ? "opacity-100" : "opacity-0",
                                  )}
                                />
                                {player.first_name} {player.last_name}
                                {player.score !== null && (
                                  <span className="ml-auto bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full text-xs font-medium">
                                    {player.score}
                                  </span>
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Jugador 2 */}
                <div className="space-y-2">
                  <Label htmlFor="player2-search">Jugador 2</Label>
                  <Popover open={openPlayer2} onOpenChange={setOpenPlayer2}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openPlayer2}
                        className="w-full justify-between"
                      >
                        {selectedPlayer2
                          ? `${selectedPlayer2.first_name} ${selectedPlayer2.last_name}`
                          : "Seleccionar jugador 2..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <Command>
                        <CommandInput placeholder="Buscar jugador..." />
                        <CommandList>
                          <CommandEmpty>No se encontraron jugadores.</CommandEmpty>
                          <CommandGroup>
                            {allPlayersForSearch.map((player) => (
                              <CommandItem
                                key={player.id}
                                value={`${player.first_name} ${player.last_name}`}
                                onSelect={() => {
                                  setSelectedPlayer2(player)
                                  setOpenPlayer2(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedPlayer2?.id === player.id ? "opacity-100" : "opacity-0",
                                  )}
                                />
                                {player.first_name} {player.last_name}
                                {player.score !== null && (
                                  <span className="ml-auto bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full text-xs font-medium">
                                    {player.score}
                                  </span>
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Teléfono */}
                <div className="space-y-2">
                  <Label htmlFor="phone-couple">Teléfono de Contacto</Label>
                  <Input
                    id="phone-couple"
                    placeholder="Ej: 1123456789"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                  <p className="text-sm text-slate-500">
                    El club te contactará para confirmar la inscripción de la pareja.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCoupleDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                  onClick={handleCoupleRequestSubmit}
                  disabled={isSubmitting || !selectedPlayer1 || !selectedPlayer2 || !phoneNumber}
                >
                  {isSubmitting ? "Enviando..." : "Enviar Solicitud"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
