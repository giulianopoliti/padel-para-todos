"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { registerCoupleForTournament } from "@/app/api/tournaments/actions"
import { createPlayerForCouple } from "@/app/api/players/actions"
import { useUser } from "@/contexts/user-context"
import { Search, UserPlus, AlertCircle, Users, User, Phone, CreditCard } from "lucide-react"
import PlayerSearchResults from "./player-search-results"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"

// Define the PlayerInfo interface locally
interface PlayerInfo {
  id: string
  first_name: string | null
  last_name: string | null
  score?: number | null
  dni?: string | null
  phone?: string | null
}

// Esquema de validación para jugador
const playerFormSchema = z.object({
  firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  phone: z.string().min(6, "El teléfono debe tener al menos 6 caracteres"),
  dni: z.string().min(7, "El DNI debe tener al menos 7 caracteres"),
})

// Esquema de validación para búsqueda
const searchFormSchema = z.object({
  searchTerm: z.string().min(3, "Ingrese al menos 3 caracteres para buscar"),
})

type PlayerFormValues = z.infer<typeof playerFormSchema>
type SearchFormValues = z.infer<typeof searchFormSchema>

interface RegisterCoupleFormProps {
  tournamentId: string
  onComplete: (success: boolean) => void
  players: PlayerInfo[]
}

export default function RegisterCoupleForm({ tournamentId, onComplete, players }: RegisterCoupleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedPlayer1Id, setSelectedPlayer1Id] = useState<string | null>(null)
  const [selectedPlayer2Id, setSelectedPlayer2Id] = useState<string | null>(null)
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const [isClubUser, setIsClubUser] = useState<boolean>(false)
  const [currentPlayerInfo, setCurrentPlayerInfo] = useState<PlayerInfo | null>(null)
  const { user: contextUser, userDetails } = useUser()

  // Detectar si el usuario es un club o un jugador
  useEffect(() => {
    setIsClubUser(!userDetails?.player_id)

    // Si es un jugador, preseleccionamos su ID como player 1 y obtenemos su info
    if (userDetails?.player_id) {
      setSelectedPlayer1Id(userDetails.player_id)
      
      // Buscar la información del jugador actual en la lista de players
      const playerInfo = players.find(p => p.id === userDetails.player_id)
      setCurrentPlayerInfo(playerInfo || null)
    }
  }, [userDetails, players])

  // Valores por defecto si el usuario ya tiene un perfil
  const defaultValues: Partial<PlayerFormValues> = {
    firstName: "",
    lastName: "",
    phone: "",
    dni: "",
  }

  // Formulario para registrar nuevo jugador
  const playerForm = useForm<PlayerFormValues>({
    resolver: zodResolver(playerFormSchema),
    defaultValues,
  })

  // Formulario para buscar jugador existente
  const searchForm = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      searchTerm: "",
    },
  })

  // Manejar búsqueda de jugadores
  const onSearch = async (data: SearchFormValues) => {
    setIsSearching(true)
    setSearchResults([])
    try {
      const searchTermLower = data.searchTerm.toLowerCase()
      const filteredResults = players.filter((player) => {
        const firstNameMatch = player.first_name?.toLowerCase().includes(searchTermLower)
        const lastNameMatch = player.last_name?.toLowerCase().includes(searchTermLower)
        const dniMatch = player.dni?.toLowerCase().includes(searchTermLower)
        return firstNameMatch || lastNameMatch || dniMatch
      })
      setSearchResults(filteredResults)
    } catch (error) {
      console.error("Error al buscar jugadores:", error)
    } finally {
      setIsSearching(false)
    }
  }

  // Manejar selección de jugador
  const handleSelectPlayer = (playerId: string) => {
    if (isClubUser && selectedPlayer1Id === playerId) {
      toast({
        title: "Jugador ya seleccionado",
        description: "Este jugador ya está seleccionado como Jugador 1. Selecciona otro para Jugador 2.",
        variant: "destructive",
      })
      return
    }

    if (isClubUser && selectedPlayer2Id === playerId) {
      toast({
        title: "Jugador ya seleccionado",
        description: "Este jugador ya está seleccionado como Jugador 2. Selecciona otro para Jugador 1.",
        variant: "destructive",
      })
      return
    }

    setSelectedPlayerId(playerId)

    if (isClubUser) {
      if (!selectedPlayer1Id) {
        setSelectedPlayer1Id(playerId)
      } else if (!selectedPlayer2Id) {
        setSelectedPlayer2Id(playerId)
      } else {
        setSelectedPlayer2Id(playerId)
      }
    } else {
      setSelectedPlayer2Id(playerId)
    }
  }

  // Manejar deselección de jugador específico
  const handleUnselectPlayer = (playerNumber: 1 | 2) => {
    if (playerNumber === 1) {
      setSelectedPlayer1Id(null)
    } else {
      setSelectedPlayer2Id(null)
    }
  }

  // Manejar registro de pareja
  const onSubmitCouple = async () => {
    if (isClubUser) {
      if (!selectedPlayer1Id || !selectedPlayer2Id) {
        toast({
          title: "Selección incompleta",
          description: "Debe seleccionar dos jugadores para formar la pareja",
          variant: "destructive",
        })
        return
      }

      setIsSubmitting(true)

      try {
        const result = await registerCoupleForTournament(tournamentId, selectedPlayer1Id, selectedPlayer2Id)

        if (result.success) {
          toast({
            title: "¡Pareja registrada!",
            description: "La pareja se ha registrado exitosamente en el torneo",
          })
          onComplete(true)
        } else {
          toast({
            title: "Error en el registro",
            description: "No se pudo registrar la pareja",
            variant: "destructive",
          })
          onComplete(false)
        }
      } catch (error) {
        console.error("Error al registrar pareja:", error)
        toast({
          title: "Error inesperado",
          description: "Ocurrió un error al procesar la solicitud",
          variant: "destructive",
        })
        onComplete(false)
      } finally {
        setIsSubmitting(false)
      }
    } else {
      // Lógica para jugador registrando pareja con otro jugador existente
      if (!selectedPlayer1Id || !selectedPlayer2Id) {
        toast({
          title: "Selección incompleta",
          description: "Debe seleccionar un compañero para formar la pareja",
          variant: "destructive",
        })
        return
      }

      setIsSubmitting(true)

      try {
        const result = await registerCoupleForTournament(tournamentId, selectedPlayer1Id, selectedPlayer2Id)

        if (result.success) {
          toast({
            title: "¡Pareja registrada!",
            description: "Te has registrado exitosamente en pareja para el torneo",
          })
          onComplete(true)
        } else {
          toast({
            title: "Error en el registro",
            description: result.error || "No se pudo registrar la pareja",
            variant: "destructive",
          })
          onComplete(false)
        }
      } catch (error) {
        console.error("Error al registrar pareja:", error)
        toast({
          title: "Error inesperado",
          description: "Ocurrió un error al procesar la solicitud",
          variant: "destructive",
        })
        onComplete(false)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  // Manejar registro de nuevo jugador como pareja
  const onSubmitNewPlayer = async (data: PlayerFormValues) => {
    if (isClubUser) {
      toast({
        title: "Función no disponible",
        description: "La creación de nuevos jugadores desde club no está implementada",
        variant: "destructive",
      })
      return
    }

    if (!contextUser) {
      toast({
        title: "Error de autenticación",
        description: "Debe iniciar sesión para registrar una pareja",
        variant: "destructive",
      })
      return
    }

    if (!userDetails?.player_id) {
      toast({
        title: "Error de usuario",
        description: "No se pudo obtener tu ID de jugador. Verifica tu perfil.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Crear el nuevo jugador usando createPlayerForCouple
      const newPlayerResult = await createPlayerForCouple({
        tournamentId,
        playerData: {
          first_name: data.firstName,
          last_name: data.lastName,
          gender: "MALE", // Por defecto, podrías agregar un campo para esto
          dni: data.dni
        }
      })

      if (newPlayerResult.success && newPlayerResult.playerId) {
        // Registrar la pareja con el nuevo jugador
        const result = await registerCoupleForTournament(tournamentId, userDetails.player_id, newPlayerResult.playerId)
        
        if (result.success) {
          toast({
            title: "¡Pareja registrada!",
            description: "Se ha registrado la pareja con el nuevo jugador exitosamente",
          })
          onComplete(true)
        } else {
          toast({
            title: "Error en el registro de pareja",
            description: result.error || "El jugador se creó pero no se pudo registrar la pareja",
            variant: "destructive",
          })
          onComplete(false)
        }
      } else {
        toast({
          title: "Error al crear jugador",
          description: newPlayerResult.message || "No se pudo crear el nuevo jugador",
          variant: "destructive",
        })
        onComplete(false)
      }
    } catch (error) {
      console.error("Error al registrar pareja:", error)
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al procesar la solicitud",
        variant: "destructive",
      })
      onComplete(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full bg-white border border-gray-200 shadow-sm">
      <CardHeader className="text-center pb-4">
        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <Users className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle className="text-xl font-semibold text-gray-900">Registro de Pareja</CardTitle>
        <p className="text-sm text-gray-600">
          {isClubUser 
            ? "Busca y selecciona jugadores para formar una pareja" 
            : "Selecciona un compañero para formar pareja contigo"
          }
        </p>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100">
            <TabsTrigger value="search" className="data-[state=active]:bg-white data-[state=active]:text-blue-600">
              <Search className="mr-2 h-4 w-4" />
              Buscar jugador{isClubUser ? "es" : ""}
            </TabsTrigger>
            <TabsTrigger value="new" className="data-[state=active]:bg-white data-[state=active]:text-blue-600">
              <UserPlus className="mr-2 h-4 w-4" />
              Nuevo jugador
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4 py-4">
            {isClubUser ? (
              <Alert className="border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800">Modo Club</AlertTitle>
                <AlertDescription className="text-blue-700">
                  Debe seleccionar dos jugadores para formar la pareja. Seleccione el primer jugador y luego el segundo.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800">Inscripción en Pareja</AlertTitle>
                <AlertDescription className="text-blue-700">
                  Tú serás el primer jugador de la pareja. Selecciona a tu compañero/a para el torneo.
                </AlertDescription>
              </Alert>
            )}

            <Form {...searchForm}>
              <form onSubmit={searchForm.handleSubmit(onSearch)} className="space-y-4">
                <FormField
                  control={searchForm.control}
                  name="searchTerm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Buscar {isClubUser ? "jugadores" : "compañero/a"} para el torneo
                      </FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Nombre, apellido o DNI"
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            {...field}
                          />
                          <Button
                            type="submit"
                            disabled={isSearching}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Search className="h-4 w-4" />
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>

            {isSearching ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-gray-600">Buscando jugadores...</p>
              </div>
            ) : (
              <PlayerSearchResults
                results={searchResults}
                onSelectPlayer={handleSelectPlayer}
                selectedPlayerId={selectedPlayerId}
                selectedPlayer1Id={selectedPlayer1Id}
                selectedPlayer2Id={selectedPlayer2Id}
                isClubMode={isClubUser}
              />
            )}

            {/* Sección para mostrar la pareja seleccionada */}
            <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Pareja Seleccionada</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 border border-gray-300 bg-white rounded-md shadow-sm relative">
                  <p className="text-sm text-gray-500 mb-1">Jugador 1</p>
                  {selectedPlayer1Id ? (
                    <>
                      <p className="font-medium text-gray-700">
                        {isClubUser
                          ? `${players.find((p) => p.id === selectedPlayer1Id)?.first_name || ""} ${players.find((p) => p.id === selectedPlayer1Id)?.last_name || ""}`
                          : currentPlayerInfo 
                            ? `${currentPlayerInfo.first_name || ""} ${currentPlayerInfo.last_name || ""}`.trim() || "Tú"
                            : "Tú"
                        }
                      </p>
                      {isClubUser && (
                        <Button
                          className="absolute top-2 right-2 h-6 w-6 p-0 rounded-full border-gray-300 text-gray-500 hover:text-gray-700"
                          variant="outline"
                          onClick={() => handleUnselectPlayer(1)}
                        >
                          &times;
                        </Button>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-400 italic">
                      {isClubUser ? "Selecciona el primer jugador" : "No se pudo obtener tus datos"}
                    </p>
                  )}
                </div>

                <div className="p-3 border border-gray-300 bg-white rounded-md shadow-sm relative">
                  <p className="text-sm text-gray-500 mb-1">Jugador 2</p>
                  {selectedPlayer2Id ? (
                    <>
                      <p className="font-medium text-gray-700">
                        {`${players.find((p) => p.id === selectedPlayer2Id)?.first_name || ""} ${players.find((p) => p.id === selectedPlayer2Id)?.last_name || ""}`}
                      </p>
                      <Button
                        className="absolute top-2 right-2 h-6 w-6 p-0 rounded-full border-gray-300 text-gray-500 hover:text-gray-700"
                        variant="outline"
                        onClick={() => handleUnselectPlayer(2)}
                      >
                        &times;
                      </Button>
                    </>
                  ) : (
                    <p className="text-gray-400 italic">
                      Selecciona {isClubUser ? "el segundo jugador" : "un compañero"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {((isClubUser && selectedPlayer1Id && selectedPlayer2Id) || (!isClubUser && selectedPlayer2Id)) && (
              <div className="flex justify-end pt-4">
                <Button
                  onClick={onSubmitCouple}
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSubmitting ? "Procesando..." : "Registrar pareja"}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="new" className="py-4">
            {isClubUser ? (
              <Alert className="mb-4 border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800">Función no disponible</AlertTitle>
                <AlertDescription className="text-amber-700">
                  La creación de nuevos jugadores desde una cuenta de club no está habilitada. Por favor, utilice la
                  búsqueda para seleccionar jugadores existentes.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <Alert className="mb-4 border-blue-200 bg-blue-50">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-800">Crear nuevo jugador</AlertTitle>
                  <AlertDescription className="text-blue-700">
                    Registrarás a un nuevo jugador en el sistema y formarás pareja con él para este torneo.
                  </AlertDescription>
                </Alert>
                
                <Form {...playerForm}>
                  <form onSubmit={playerForm.handleSubmit(onSubmitNewPlayer)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={playerForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">
                              <User className="h-4 w-4 inline mr-1" />
                              Nombre
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Nombre del jugador"
                                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={playerForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">Apellido</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Apellido del jugador"
                                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={playerForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">
                            <Phone className="h-4 w-4 inline mr-1" />
                            Teléfono
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Teléfono del jugador"
                              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={playerForm.control}
                      name="dni"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">
                            <CreditCard className="h-4 w-4 inline mr-1" />
                            DNI
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="DNI del jugador"
                              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => onComplete(false)}
                        disabled={isSubmitting}
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                        {isSubmitting ? "Procesando..." : "Registrar pareja"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </>
            )}

            {isClubUser && (
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => onComplete(false)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Volver a la búsqueda
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
