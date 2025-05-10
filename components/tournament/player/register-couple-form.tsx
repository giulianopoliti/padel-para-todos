"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { registerCoupleForTournament } from "@/app/api/tournaments/actions"
import { useUser } from "@/contexts/user-context"
import { Search, UserPlus } from "lucide-react"
import PlayerSearchResults from "./player-search-results"
import { PlayerDTO } from "@/types"
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
  players: PlayerDTO[]
}

export default function RegisterCoupleForm({ tournamentId, onComplete, players }: RegisterCoupleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null)
  const { user: contextUser, userDetails } = useUser()

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
        const firstNameMatch = player.first_name.toLowerCase().includes(searchTermLower);
        const lastNameMatch = player.last_name.toLowerCase().includes(searchTermLower);
        return firstNameMatch || lastNameMatch;
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
    setSelectedPartnerId(playerId)
  }

  // Manejar registro de pareja
  const onSubmitCouple = async () => {
    if (!contextUser || !selectedPartnerId) {
      alert("Debe seleccionar un compañero para registrar la pareja")
      return
    }

    setIsSubmitting(true)

    try {
      // Ensure userDetails and userDetails.player_id are available
      if (!userDetails?.player_id) {
        alert("No se pudo obtener el ID del jugador actual. Asegúrate de haber iniciado sesión y tener un perfil de jugador.");
        setIsSubmitting(false);
        return;
      }
      const result = await registerCoupleForTournament(tournamentId, userDetails.player_id, selectedPartnerId!)

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

  // Manejar registro de nuevo jugador como pareja
  const onSubmitNewPlayer = async (data: PlayerFormValues) => {
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
          Buscar jugador
        </TabsTrigger>
        <TabsTrigger value="new">
          <UserPlus className="mr-2 h-4 w-4" />
          Nuevo jugador
        </TabsTrigger>
      </TabsList>

      <TabsContent value="search" className="space-y-4 py-4">
        <Form {...searchForm}>
          <form onSubmit={searchForm.handleSubmit(onSearch)} className="space-y-4">
            <FormField
              control={searchForm.control}
              name="searchTerm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Buscar compañero/a para el torneo</FormLabel>
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
          <PlayerSearchResults
            results={searchResults}
            onSelectPlayer={handleSelectPlayer}
            selectedPlayerId={selectedPartnerId}
          />
        )}

        {/* Sección para mostrar la pareja seleccionada */} 
        {(contextUser && userDetails) && (
          <div className="mt-6 p-4 border border-slate-200 rounded-lg bg-slate-50">
            <h3 className="text-lg font-medium text-teal-700 mb-3">Pareja Seleccionada</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 border border-slate-300 bg-white rounded-md shadow-sm">
                <p className="text-sm text-slate-500 mb-1">Jugador 1 (Tú)</p>
                <p className="font-medium text-slate-700">
                  {/* Placeholder - Update with correct userDetails access if different */}
                  {`${userDetails?.firstName || "Usuario"} ${userDetails?.lastName || "Logueado"}`.trim()}
                </p>
              </div>
              <div className="p-3 border border-slate-300 bg-white rounded-md shadow-sm">
                <p className="text-sm text-slate-500 mb-1">Jugador 2 (Compañero/a)</p>
                {selectedPartnerId ? (
                  <p className="font-medium text-slate-700">
                    {searchResults.find(p => p.id === selectedPartnerId)?.first_name || "Compañero"} {searchResults.find(p => p.id === selectedPartnerId)?.last_name || "Seleccionado"}
                  </p>
                ) : (
                  <p className="text-slate-400 italic">Selecciona un compañero de la búsqueda</p>
                )}
              </div>
            </div>
          </div>
        )}

        {selectedPartnerId && (
          <div className="flex justify-end pt-4">
            <Button onClick={onSubmitCouple} disabled={isSubmitting} className="bg-teal-600 hover:bg-teal-700">
              {isSubmitting ? "Procesando..." : "Registrar pareja"}
            </Button>
          </div>
        )}
      </TabsContent>

      <TabsContent value="new" className="py-4">
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
      </TabsContent>
    </Tabs>
  )
}
