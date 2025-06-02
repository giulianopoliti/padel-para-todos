"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Trophy,
  Users,
  Calendar,
  MapPin,
  Phone,
  UserPlus,
  Check,
  ChevronsUpDown,
  ChevronLeft,
  Clock,
  Award,
  Mail,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Tipos
interface Tournament {
  id: string
  name: string
  startDate: string
  endDate: string
  status: string
  category: string
  type?: string
  maxParticipants?: number
  currentParticipants?: number
  address?: string
  time?: string
  prize?: string
  description?: string
  price?: number | null
  club?: {
    id: string
    name: string
    image?: string
  }
}

interface Category {
  name: string
  lower_range: number
  upper_range: number
}

interface PlayerDTO {
  id: string
  first_name: string
  last_name: string
  score: number
}

interface Club {
  id: string
  name: string
  address?: string | null
  phone?: string | null
  email?: string | null
}

interface PlayerInfo {
  id: string
  first_name: string | null
  last_name: string | null
  score: number | null
}

interface ProcessedCouple {
  id: string
  player1_id: string
  player2_id: string
  created_at: string
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
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "IN_PROGRESS":
        return "bg-green-100 text-green-800 border-green-200"
      case "FINISHED":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "PAIRING":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  // Manejar envío de solicitud individual
  const handleSoloRequestSubmit = async () => {
    if (!selectedPlayer || !phoneNumber) return

    setIsSubmitting(true)
    // Aquí iría la lógica de envío
    setTimeout(() => {
      setSoloDialogOpen(false)
      setSelectedPlayer(null)
      setPhoneNumber("")
      setIsSubmitting(false)
    }, 1000)
  }

  // Manejar envío de solicitud de pareja
  const handleCoupleRequestSubmit = async () => {
    if (!selectedPlayer1 || !selectedPlayer2 || !phoneNumber) return

    setIsSubmitting(true)
    // Aquí iría la lógica de envío
    setTimeout(() => {
      setCoupleDialogOpen(false)
      setSelectedPlayer1(null)
      setSelectedPlayer2(null)
      setPhoneNumber("")
      setIsSubmitting(false)
    }, 1000)
  }

  return (
    <div className="space-y-8">
      {/* Navegación */}
      <div className="mb-6">
        <Link
          href="/tournaments"
          className="inline-flex items-center text-gray-600 hover:text-blue-600 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Volver a torneos
        </Link>
      </div>

      {/* Cabecera del torneo */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">{tournament.name}</h1>
        <p className="text-gray-600 text-lg">{tournament.club?.name || "Club no especificado"}</p>
      </div>

      {/* Imagen y información principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Imagen del torneo */}
        <div className="lg:col-span-1">
          <div className="relative h-64 lg:h-80 rounded-lg overflow-hidden shadow-sm border border-gray-200">
            <img
              src={tournament.club?.image || "/placeholder.svg?height=300&width=400"}
              alt={tournament.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 right-4">
              <Badge className={`${getStatusColor(tournament.status)} px-3 py-1`}>
                {getStatusText(tournament.status)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Información del torneo */}
        <div className="lg:col-span-2">
          <Card className="bg-white border-gray-200 shadow-sm h-full">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800">Información del Torneo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-3 text-blue-600" />
                    <div>
                      <span className="text-gray-700 font-medium">Fechas:</span>
                      <div className="text-gray-600">
                        {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Clock className="h-5 w-5 mr-3 text-blue-600" />
                    <div>
                      <span className="text-gray-700 font-medium">Horario:</span>
                      <div className="text-gray-600">{tournament.time || "No especificado"}</div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Users className="h-5 w-5 mr-3 text-blue-600" />
                    <div>
                      <span className="text-gray-700 font-medium">Categoría:</span>
                      <div className="mt-1">
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1">
                          {getCategoryName()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center">
                    <Trophy className="h-5 w-5 mr-3 text-blue-600" />
                    <div>
                      <span className="text-gray-700 font-medium">Tipo:</span>
                      <div className="text-gray-600">
                        {tournament.type === "AMERICAN" ? "Americano" : "Eliminación"}
                      </div>
                    </div>
                  </div>

                  {tournament.prize && (
                    <div className="flex items-center">
                      <Award className="h-5 w-5 mr-3 text-blue-600" />
                      <div>
                        <span className="text-gray-700 font-medium">Premio:</span>
                        <div className="text-gray-600 font-semibold">{tournament.prize}</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center">
                    <Users className="h-5 w-5 mr-3 text-blue-600" />
                    <div>
                      <span className="text-gray-700 font-medium">Participantes:</span>
                      <div className="text-gray-600">
                        {tournament.currentParticipants || 0}/{tournament.maxParticipants || "∞"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {tournament.description && (
                <div className="pt-4 border-t border-gray-100">
                  <h4 className="font-medium text-gray-800 mb-2">Descripción</h4>
                  <p className="text-gray-600">{tournament.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Información del club */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-800">Información del Club</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center">
                <MapPin className="h-5 w-5 mr-3 text-blue-600" />
                <div>
                  <span className="text-gray-700 font-medium">Dirección:</span>
                  <div className="text-gray-600">{club?.address || tournament.address || "No especificada"}</div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {club?.phone && (
                <div className="flex items-center">
                  <Phone className="h-5 w-5 mr-3 text-blue-600" />
                  <div>
                    <span className="text-gray-700 font-medium">Teléfono:</span>
                    <div className="text-gray-600">{club.phone}</div>
                  </div>
                </div>
              )}
              {club?.email && (
                <div className="flex items-center">
                  <Mail className="h-5 w-5 mr-3 text-blue-600" />
                  <div>
                    <span className="text-gray-700 font-medium">Email:</span>
                    <div className="text-gray-600">{club.email}</div>
                  </div>
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
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3">
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
                        className="w-full justify-between border-gray-200"
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
                                <span className="ml-auto bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                                  {player.score}
                                </span>
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
                    className="border-gray-200"
                  />
                  <p className="text-sm text-gray-500">El club te contactará para confirmar tu inscripción.</p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSoloDialogOpen(false)}
                  disabled={isSubmitting}
                  className="border-gray-200"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
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
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3">
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
                        className="w-full justify-between border-gray-200"
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
                                <span className="ml-auto bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                                  {player.score}
                                </span>
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
                        className="w-full justify-between border-gray-200"
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
                                <span className="ml-auto bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                                  {player.score}
                                </span>
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
                    className="border-gray-200"
                  />
                  <p className="text-sm text-gray-500">
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
                  className="border-gray-200"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
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
      <Tabs defaultValue="players" className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <TabsList className="w-full border-b border-gray-200 bg-gray-50 p-1">
          <TabsTrigger
            value="players"
            className="flex-1 py-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Jugadores Individuales
          </TabsTrigger>
          <TabsTrigger
            value="couples"
            className="flex-1 py-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            <Users className="mr-2 h-4 w-4" />
            Parejas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="players" className="p-6">
          {players.length > 0 ? (
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow className="border-b border-gray-200">
                  <TableHead className="font-medium text-gray-700">Nombre</TableHead>
                  <TableHead className="font-medium text-gray-700">Apellido</TableHead>
                  <TableHead className="font-medium text-gray-700 text-center">Puntaje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((player) => (
                  <TableRow key={player.id} className="hover:bg-gray-50 border-b border-gray-100">
                    <TableCell className="text-left font-medium text-gray-800">{player.first_name || "—"}</TableCell>
                    <TableCell className="text-left text-gray-700">{player.last_name || "—"}</TableCell>
                    <TableCell className="text-center">
                      {player.score !== null ? (
                        <div className="inline-flex items-center justify-center bg-blue-100 text-blue-700 font-medium rounded-full h-10 w-10 border border-blue-200">
                          {player.score}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-700 mb-2">No hay jugadores inscritos</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Aún no hay jugadores individuales inscritos en este torneo.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="couples" className="p-6">
          {couples.length > 0 ? (
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow className="border-b border-gray-200">
                  <TableHead className="font-medium text-gray-700">Jugador 1</TableHead>
                  <TableHead className="font-medium text-gray-700 text-center">Puntaje</TableHead>
                  <TableHead className="font-medium text-gray-700">Jugador 2</TableHead>
                  <TableHead className="font-medium text-gray-700 text-center">Puntaje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {couples.map((couple) => (
                  <TableRow key={couple.id} className="hover:bg-gray-50 border-b border-gray-100">
                    <TableCell className="text-left font-medium text-gray-800">
                      {couple.player_1_info
                        ? `${couple.player_1_info.first_name || ""} ${couple.player_1_info.last_name || ""}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {couple.player_1_info?.score !== null && couple.player_1_info?.score !== undefined ? (
                        <div className="inline-flex items-center justify-center bg-blue-100 text-blue-700 font-medium rounded-full h-9 w-9 border border-blue-200">
                          {couple.player_1_info.score}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-left font-medium text-gray-800">
                      {couple.player_2_info
                        ? `${couple.player_2_info.first_name || ""} ${couple.player_2_info.last_name || ""}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {couple.player_2_info?.score !== null && couple.player_2_info?.score !== undefined ? (
                        <div className="inline-flex items-center justify-center bg-blue-100 text-blue-700 font-medium rounded-full h-9 w-9 border border-blue-200">
                          {couple.player_2_info.score}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-700 mb-2">No hay parejas inscritas</h3>
              <p className="text-gray-500 max-w-md mx-auto">Aún no hay parejas inscritas en este torneo.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
