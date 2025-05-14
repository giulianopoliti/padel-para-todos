"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { registerCoupleForTournament } from "@/app/api/tournaments/actions"
import { useUser } from "@/contexts/user-context"
import { Search, UserPlus, AlertCircle } from "lucide-react"
import PlayerSearchResults from "./player-search-results"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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
  const { user: contextUser, userDetails } = useUser()

  // Detectar si el usuario es un club o un jugador
  useEffect(() => {
    // Esta lógica puede variar según tu implementación
    // Asumo que si userDetails tiene player_id, es un jugador, si no, es un club
    setIsClubUser(!userDetails?.player_id)
    
    // Si es un jugador, preseleccionamos su ID como player 1
    if (userDetails?.player_id) {
      setSelectedPlayer1Id(userDetails.player_id)
    }
  }, [userDetails])

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
    console.log("onSearch triggered. Search term:", data.searchTerm);
    setIsSearching(true);
    setSearchResults([]);
    try {
      console.log("Players for search:", players);
      const searchTermLower = data.searchTerm.toLowerCase();
      const filteredResults = players.filter(player => {
        const firstNameMatch = player.first_name?.toLowerCase().includes(searchTermLower);
        const lastNameMatch = player.last_name?.toLowerCase().includes(searchTermLower);
        const dniMatch = player.dni?.toLowerCase().includes(searchTermLower);
        return firstNameMatch || lastNameMatch || dniMatch;
      });
      setSearchResults(filteredResults);
      console.log("Filtered results:", filteredResults);
    } catch (error) {
      console.error("Error al buscar jugadores:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Manejar selección de jugador
  const handleSelectPlayer = (playerId: string) => {
    // Safety check - don't allow selecting the same player for both positions
    if (isClubUser && selectedPlayer1Id === playerId) {
      alert("Este jugador ya está seleccionado como Jugador 1. Por favor, seleccione a otro jugador para Jugador 2.");
      return;
    }
    
    if (isClubUser && selectedPlayer2Id === playerId) {
      alert("Este jugador ya está seleccionado como Jugador 2. Por favor, seleccione a otro jugador para Jugador 1.");
      return;
    }
    
    // Set the currently selected player ID (for compatibility)
    setSelectedPlayerId(playerId);
    
    if (isClubUser) {
      // For club users, we need to select both players
      if (!selectedPlayer1Id) {
        // If player 1 is not yet selected, this is player 1
        setSelectedPlayer1Id(playerId);
        console.log("Player 1 set to:", playerId);
      } else if (!selectedPlayer2Id) {
        // If player 1 is selected but player 2 is not, this is player 2
        setSelectedPlayer2Id(playerId);
        console.log("Player 2 set to:", playerId);
      } else {
        // Both are already selected - replace player 2
        setSelectedPlayer2Id(playerId);
        console.log("Player 2 replaced with:", playerId);
      }
    } else {
      // For regular users, player 1 is fixed (the user), we only set player 2
      setSelectedPlayer2Id(playerId);
      console.log("Player 2 set to:", playerId); 
    }
  };

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
      // Validar que ambos jugadores estén seleccionados
      if (!selectedPlayer1Id || !selectedPlayer2Id) {
        alert("Debe seleccionar dos jugadores para formar la pareja")
        return
      }

      setIsSubmitting(true)
      
      try {
        const result = await registerCoupleForTournament(tournamentId, selectedPlayer1Id, selectedPlayer2Id)

        if (result.success) {
          alert("¡Pareja registrada con éxito!")
          onComplete(true)
        } else {
          alert("Error al registrar la pareja.")
          onComplete(false)
        }
      } catch (error) {
        console.error("Error al registrar pareja:", error)
        alert("Ocurrió un error al procesar su solicitud")
        onComplete(false)
      } finally {
        setIsSubmitting(false)
      }
    } else {
      // Para usuario jugador
      if (!contextUser || !selectedPlayer2Id) {
        alert("Debe seleccionar un compañero para registrar la pareja")
        return
      }

      setIsSubmitting(true)

      try {
        // Asegurar que userDetails.player_id está disponible
        if (!userDetails?.player_id) {
          alert("No se pudo obtener el ID del jugador actual. Asegúrate de haber iniciado sesión y tener un perfil de jugador.");
          setIsSubmitting(false);
          return;
        }
        const result = await registerCoupleForTournament(tournamentId, userDetails.player_id, selectedPlayer2Id)

        if (result.success) {
          alert("¡Pareja registrada con éxito!")
          onComplete(true)
        } else {
          alert("Error al registrar la pareja.")
          onComplete(false)
        }
      } catch (error) {
        console.error("Error al registrar pareja:", error)
        alert("Ocurrió un error al procesar su solicitud")
        onComplete(false)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  // Manejar registro de nuevo jugador como pareja
  const onSubmitNewPlayer = async (data: PlayerFormValues) => {
    if (isClubUser) {
      // Implementar lógica para crear dos jugadores nuevos
      alert("La creación de nuevos jugadores desde club no está implementada")
      return
    }

    if (!contextUser) {
      alert("Debe iniciar sesión para registrar una pareja")
      return
    }

    setIsSubmitting(true)

    try {
      const result = await registerCoupleForTournament(tournamentId, userDetails?.player_id!, data.dni)
      if (result.success) {
        alert("¡Pareja con nuevo jugador registrada con éxito!")
        onComplete(true)
      } else {
        alert("Error al registrar la pareja con el nuevo jugador.")
        onComplete(false)
      }
    } catch (error) {
      console.error("Error al registrar pareja:", error)
      alert("Ocurrió un error al procesar su solicitud")
      onComplete(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Tabs defaultValue="search" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="search">
          <Search className="mr-2 h-4 w-4" />
          Buscar jugador{isClubUser ? "es" : ""}
        </TabsTrigger>
        <TabsTrigger value="new">
          <UserPlus className="mr-2 h-4 w-4" />
          Nuevo jugador
        </TabsTrigger>
      </TabsList>

      <TabsContent value="search" className="space-y-4 py-4">
        {isClubUser && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Modo Club</AlertTitle>
            <AlertDescription>
              Debe seleccionar dos jugadores para formar la pareja. Seleccione el primer jugador y luego el segundo.
            </AlertDescription>
          </Alert>
        )}

        {!isClubUser && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Modo Jugador</AlertTitle>
            <AlertDescription>
              Tu serás el primer jugador de la pareja. Selecciona a tu compañero/a para el torneo.
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
                  <FormLabel>Buscar {isClubUser ? "jugadores" : "compañero/a"} para el torneo</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input placeholder="Nombre, apellido o DNI" {...field} />
                      <Button type="submit" disabled={isSearching} className="bg-teal-600 hover:bg-teal-700">
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
          <div className="text-center py-4">Buscando jugadores...</div>
        ) : (
          <>
            {/* Debug info - hidden in production but useful during development */}
            <div className="text-xs text-gray-500 mb-2">
              Player1: {selectedPlayer1Id ? selectedPlayer1Id.substring(0, 8) + '...' : 'none'} | 
              Player2: {selectedPlayer2Id ? selectedPlayer2Id.substring(0, 8) + '...' : 'none'}
            </div>
            
            <PlayerSearchResults
              results={searchResults}
              onSelectPlayer={handleSelectPlayer}
              selectedPlayerId={selectedPlayerId}
              selectedPlayer1Id={selectedPlayer1Id}
              selectedPlayer2Id={selectedPlayer2Id}
              isClubMode={isClubUser}
            />
          </>
        )}

        {/* Sección para mostrar la pareja seleccionada */} 
        <div className="mt-6 p-4 border border-slate-200 rounded-lg bg-slate-50">
          <h3 className="text-lg font-medium text-teal-700 mb-3">Pareja Seleccionada</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 border border-slate-300 bg-white rounded-md shadow-sm relative">
              <p className="text-sm text-slate-500 mb-1">Jugador 1</p>
              {selectedPlayer1Id ? (
                <>
                  <p className="font-medium text-slate-700">
                    {isClubUser 
                      ? `${players.find(p => p.id === selectedPlayer1Id)?.first_name || ""} ${players.find(p => p.id === selectedPlayer1Id)?.last_name || ""}`
                      : `${userDetails?.email || "Usuario"}`.trim()
                    }
                  </p>
                  {isClubUser && (
                    <Button 
                      className="absolute top-2 right-2 h-6 w-6 p-0 rounded-full" 
                      variant="outline"
                      onClick={() => handleUnselectPlayer(1)}
                    >
                      &times;
                    </Button>
                  )}
                </>
              ) : (
                <p className="text-slate-400 italic">{isClubUser ? "Selecciona el primer jugador" : "No se pudo obtener tus datos"}</p>
              )}
            </div>

            <div className="p-3 border border-slate-300 bg-white rounded-md shadow-sm relative">
              <p className="text-sm text-slate-500 mb-1">Jugador 2</p>
              {selectedPlayer2Id ? (
                <>
                  <p className="font-medium text-slate-700">
                    {`${players.find(p => p.id === selectedPlayer2Id)?.first_name || ""} ${players.find(p => p.id === selectedPlayer2Id)?.last_name || ""}`}
                  </p>
                  <Button 
                    className="absolute top-2 right-2 h-6 w-6 p-0 rounded-full" 
                    variant="outline"
                    onClick={() => handleUnselectPlayer(2)}
                  >
                    &times;
                  </Button>
                </>
              ) : (
                <p className="text-slate-400 italic">Selecciona {isClubUser ? "el segundo jugador" : "un compañero"}</p>
              )}
            </div>
          </div>
        </div>

        {((isClubUser && selectedPlayer1Id && selectedPlayer2Id) || 
          (!isClubUser && selectedPlayer2Id)) && (
          <div className="flex justify-end pt-4">
            <Button onClick={onSubmitCouple} disabled={isSubmitting} className="bg-teal-600 hover:bg-teal-700">
              {isSubmitting ? "Procesando..." : "Registrar pareja"}
            </Button>
          </div>
        )}
      </TabsContent>

      <TabsContent value="new" className="py-4">
        {isClubUser && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Función no disponible</AlertTitle>
            <AlertDescription>
              La creación de nuevos jugadores desde una cuenta de club no está habilitada. Por favor, utilice la búsqueda para seleccionar jugadores existentes.
            </AlertDescription>
          </Alert>
        )}

        {!isClubUser && (
          <Form {...playerForm}>
            <form onSubmit={playerForm.handleSubmit(onSubmitNewPlayer)} className="space-y-4">
              <FormField
                control={playerForm.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Ingrese el nombre" {...field} />
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
                    <FormLabel>Apellido</FormLabel>
                    <FormControl>
                      <Input placeholder="Ingrese el apellido" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={playerForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="Ingrese el teléfono" {...field} />
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
                    <FormLabel>DNI</FormLabel>
                    <FormControl>
                      <Input placeholder="Ingrese el DNI" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => onComplete(false)} disabled={isSubmitting}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-teal-600 hover:bg-teal-700">
                  {isSubmitting ? "Procesando..." : "Registrar pareja"}
                </Button>
              </div>
            </form>
          </Form>
        )}

        {isClubUser && (
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onComplete(false)}>
              Volver a la búsqueda
            </Button>
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
