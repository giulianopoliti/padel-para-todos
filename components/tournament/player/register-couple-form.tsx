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
import { registerCoupleForTournament, registerCoupleForTournamentAndRemoveIndividual } from "@/app/api/tournaments/actions"
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
  const [selectedCompanionId, setSelectedCompanionId] = useState<string | null>(null)
  const [currentPlayerInfo, setCurrentPlayerInfo] = useState<PlayerInfo | null>(null)
  const { user: contextUser, userDetails } = useUser()

  // Obtener información del jugador logueado
  useEffect(() => {
    if (userDetails?.player_id) {
      const playerInfo = players.find(p => p.id === userDetails.player_id)
      setCurrentPlayerInfo(playerInfo || null)
    }
  }, [userDetails, players])

  // Formulario para registrar nuevo jugador
  const playerForm = useForm<PlayerFormValues>({
    resolver: zodResolver(playerFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      dni: "",
    },
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
        // Excluir al jugador logueado de los resultados
        if (player.id === userDetails?.player_id) return false
        
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

  // Manejar selección de compañero
  const handleSelectCompanion = (playerId: string) => {
    setSelectedCompanionId(playerId)
  }

  // Manejar registro de pareja con compañero existente
  const onSubmitCouple = async () => {
    if (!userDetails?.player_id) {
      toast({
        title: "Error de autenticación",
        description: "No se pudo obtener tu información de jugador",
        variant: "destructive",
      })
      return
    }

    if (!selectedCompanionId) {
      toast({
        title: "Selección incompleta",
        description: "Debe seleccionar un compañero para formar la pareja",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      console.log("🚀🚀🚀 [RegisterCoupleForm] Llamando registerCoupleForTournamentAndRemoveIndividual 🚀🚀🚀");
      console.log("Player IDs:", { player1Id: userDetails.player_id, player2Id: selectedCompanionId });
      
      // Use the new function that handles individual-to-couple conversion
      const result = await registerCoupleForTournamentAndRemoveIndividual(tournamentId, userDetails.player_id, selectedCompanionId)

      if (result.success) {
        let toastTitle = "¡Pareja registrada!"
        let toastDescription = "Te has registrado exitosamente en pareja para el torneo"
        
        // If conversion happened, show special message
        if (result.convertedFrom) {
          toastTitle = "¡Inscripción convertida!"
          toastDescription = result.message || "Se ha convertido tu inscripción individual a pareja exitosamente"
        }
        
        toast({
          title: toastTitle,
          description: toastDescription,
        })
        onComplete(true)
      } else {
        console.error('[RegisterCoupleForm] Registration error:', result.error)
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

  // Manejar registro de nuevo jugador como pareja
  const onSubmitNewPlayer = async (data: PlayerFormValues) => {
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
        // Registrar la pareja con el nuevo jugador usando la nueva función
        const result = await registerCoupleForTournamentAndRemoveIndividual(tournamentId, userDetails.player_id, newPlayerResult.playerId)
        
        if (result.success) {
          let toastTitle = "¡Pareja registrada!"
          let toastDescription = "Se ha registrado la pareja con el nuevo jugador exitosamente"
          
          // If conversion happened, show special message
          if (result.convertedFrom) {
            toastTitle = "¡Inscripción convertida!"
            toastDescription = result.message || "Se ha convertido tu inscripción individual a pareja con el nuevo jugador"
          }
          
          toast({
            title: toastTitle,
            description: toastDescription,
          })
          onComplete(true)
        } else {
          console.error('[RegisterCoupleForm] New player registration error:', result.error)
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

  if (!userDetails?.player_id) {
    return (
      <Card className="w-full bg-white border border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">Error de autenticación</AlertTitle>
            <AlertDescription className="text-red-700">
              Debes estar logueado como jugador para inscribir una pareja.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full bg-white border border-gray-200 shadow-sm">
      <CardHeader className="text-center pb-4">
        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <Users className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle className="text-xl font-semibold text-gray-900">Inscripción en Pareja</CardTitle>
        <p className="text-sm text-gray-600">
          Te registrarás junto con un compañero para formar una pareja en el torneo
        </p>
      </CardHeader>

      <CardContent>
        {/* Mostrar información del jugador logueado */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Jugador 1 (Tú)</h3>
          <div className="text-blue-700">
            {currentPlayerInfo 
              ? `${currentPlayerInfo.first_name || ""} ${currentPlayerInfo.last_name || ""}`.trim() || "Tu perfil"
              : "Tu perfil"
            }
          </div>
        </div>

        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100">
            <TabsTrigger value="search" className="data-[state=active]:bg-white data-[state=active]:text-blue-600">
              <Search className="mr-2 h-4 w-4" />
              Buscar compañero
            </TabsTrigger>
            <TabsTrigger value="new" className="data-[state=active]:bg-white data-[state=active]:text-blue-600">
              <UserPlus className="mr-2 h-4 w-4" />
              Nuevo compañero
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4 py-4">
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">Buscar compañero existente</AlertTitle>
              <AlertDescription className="text-blue-700">
                Busca a otro jugador registrado en el sistema para formar pareja contigo.
              </AlertDescription>
            </Alert>

            <Form {...searchForm}>
              <form onSubmit={searchForm.handleSubmit(onSearch)} className="space-y-4">
                <FormField
                  control={searchForm.control}
                  name="searchTerm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Buscar compañero para el torneo
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
              <div className="space-y-2">
                {searchResults.length > 0 ? (
                  searchResults.map((player) => (
                    <div 
                      key={player.id} 
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedCompanionId === player.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleSelectCompanion(player.id)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">
                            {player.first_name} {player.last_name}
                          </p>
                          {player.score !== null && (
                            <p className="text-sm text-gray-600">
                              Puntaje: {player.score}
                            </p>
                          )}
                        </div>
                        {selectedCompanionId === player.id && (
                          <div className="text-blue-600 font-medium">
                            ✓ Seleccionado
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : searchForm.watch('searchTerm') && !isSearching ? (
                  <p className="text-gray-500 text-center py-4">
                    No se encontraron jugadores con ese criterio
                  </p>
                ) : null}
              </div>
            )}

            {selectedCompanionId && (
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
            <Alert className="mb-4 border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">Crear nuevo compañero</AlertTitle>
              <AlertDescription className="text-blue-700">
                Registra un nuevo jugador en el sistema y forma pareja con él para este torneo.
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
                            placeholder="Nombre del compañero"
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
                            placeholder="Apellido del compañero"
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
                          placeholder="Teléfono del compañero"
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
                          placeholder="DNI del compañero"
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
                    {isSubmitting ? "Procesando..." : "Crear y registrar pareja"}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
