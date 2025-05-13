"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Search, UserPlus, Loader2 } from "lucide-react"
import { registerPlayerForTournament, registerNewPlayerForTournament } from "@/app/api/tournaments/actions"

// Esquema de validación para búsqueda de jugador
const searchSchema = z.object({
  searchTerm: z.string().min(3, "Ingrese al menos 3 caracteres para buscar"),
})

// Esquema de validación para nuevo jugador
const newPlayerSchema = z.object({
  firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  dni: z.string().min(7, "El DNI debe tener al menos 7 caracteres"),
  phone: z.string().min(8, "El teléfono debe tener al menos 8 caracteres"),
  category: z.string().min(1, "Seleccione una categoría"),
})

interface PlayerInfo {
  id: string
  first_name: string | null
  last_name: string | null
  score?: number | null
  dni?: string | null
  phone?: string | null
}

interface RegisterPlayerFormProps {
  tournamentId: string
  onSuccess: () => void
  existingPlayers: PlayerInfo[]
}

export default function RegisterPlayerForm({ tournamentId, onSuccess, existingPlayers }: RegisterPlayerFormProps) {
  const [activeTab, setActiveTab] = useState("search")
  const [searchResults, setSearchResults] = useState<PlayerInfo[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerInfo | null>(null)

  // Formulario para búsqueda
  const searchForm = useForm<z.infer<typeof searchSchema>>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      searchTerm: "",
    },
  })

  // Formulario para nuevo jugador
  const newPlayerForm = useForm<z.infer<typeof newPlayerSchema>>({
    resolver: zodResolver(newPlayerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      dni: "",
      phone: "",
      category: "",
    },
  })

  // Manejar búsqueda de jugador
  const handleSearch = async (values: z.infer<typeof searchSchema>) => {
    setIsSearching(true)
    try {
      // Filtrar jugadores existentes por nombre, apellido o DNI
      const results = existingPlayers.filter(
        (player) =>
          (player.first_name && player.first_name.toLowerCase().includes(values.searchTerm.toLowerCase())) ||
          (player.last_name && player.last_name.toLowerCase().includes(values.searchTerm.toLowerCase())) ||
          (player.dni && player.dni.includes(values.searchTerm)),
      )

      setSearchResults(results)

      if (results.length === 0) {
        toast({
          title: "No se encontraron resultados",
          description: "No se encontraron jugadores con ese criterio de búsqueda",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al buscar jugadores:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al buscar jugadores",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  // Manejar selección de jugador
  const handleSelectPlayer = (player: PlayerInfo) => {
    setSelectedPlayer(player)
  }

  // Manejar registro de jugador existente
  const handleRegisterExistingPlayer = async () => {
    if (!selectedPlayer) return

    setIsRegistering(true)
    try {
      const result = await registerPlayerForTournament(
        tournamentId,
        selectedPlayer.id
      )

      if (result.success) {
        toast({
          title: "Jugador inscrito",
          description: "El jugador ha sido inscrito exitosamente en el torneo",
        })
        onSuccess()
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        toast({
          title: "Error",
          description: "No se pudo inscribir al jugador, es probable que ya esté inscripto en el torneo",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al inscribir jugador:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al inscribir al jugador",
        variant: "destructive",
      })
    } finally {
      setIsRegistering(false)
    }
  }

  // Manejar registro de nuevo jugador
  const handleRegisterNewPlayer = async (values: z.infer<typeof newPlayerSchema>) => {
    setIsRegistering(true)
    try {
      const result = await registerNewPlayerForTournament(
        tournamentId,
        values.firstName,
        values.lastName,
        values.phone,
        values.dni
      )

      if (result.success) {
        toast({
          title: "Jugador registrado",
          description: "El nuevo jugador ha sido registrado e inscrito exitosamente en el torneo",
        })
        onSuccess()
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        toast({
          title: "Error",
          description: "No se pudo registrar al jugador",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al registrar nuevo jugador:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al registrar al nuevo jugador",
        variant: "destructive",
      })
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid grid-cols-2 mb-4">
        <TabsTrigger value="search" className="data-[state=active]:bg-violet-100 data-[state=active]:text-violet-700">
          <Search className="mr-2 h-4 w-4" />
          Buscar Jugador
        </TabsTrigger>
        <TabsTrigger value="new" className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700">
          <UserPlus className="mr-2 h-4 w-4" />
          Nuevo Jugador
        </TabsTrigger>
      </TabsList>

      <TabsContent value="search" className="space-y-4">
        <Form {...searchForm}>
          <form onSubmit={searchForm.handleSubmit(handleSearch)} className="space-y-4">
            <FormField
              control={searchForm.control}
              name="searchTerm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Buscar por nombre, apellido o DNI</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input placeholder="Ingrese al menos 3 caracteres..." {...field} className="flex-1" />
                      <Button type="submit" disabled={isSearching}>
                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        {searchResults.length > 0 && (
          <div className="border rounded-md overflow-hidden">
            <div className="bg-slate-50 px-4 py-2 border-b">
              <h3 className="font-medium text-slate-700">Resultados de búsqueda</h3>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {searchResults.map((player) => (
                <div
                  key={player.id}
                  className={`px-4 py-3 border-b last:border-b-0 cursor-pointer hover:bg-slate-50 transition-colors ${
                    selectedPlayer?.id === player.id ? "bg-violet-50" : ""
                  }`}
                  onClick={() => handleSelectPlayer(player)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-slate-700">
                        {player.first_name} {player.last_name}
                      </p>
                      <p className="text-sm text-slate-500">DNI: {player.dni || "No disponible"}</p>
                    </div>
                    {player.score !== undefined && player.score !== null && (
                      <div className="bg-violet-50 text-violet-700 font-medium rounded-full h-8 w-8 flex items-center justify-center border border-violet-200">
                        {player.score}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedPlayer && (
          <div className="mt-4 pt-4 border-t">
            <h3 className="font-medium text-slate-700 mb-2">Jugador seleccionado</h3>
            <div className="bg-violet-50 border border-violet-100 rounded-md p-4">
              <p className="font-medium text-violet-700">
                {selectedPlayer.first_name} {selectedPlayer.last_name}
              </p>
              <p className="text-sm text-slate-600">DNI: {selectedPlayer.dni || "No disponible"}</p>
              <p className="text-sm text-slate-600">Teléfono: {selectedPlayer.phone || "No disponible"}</p>
              {selectedPlayer.score !== undefined && selectedPlayer.score !== null && (
                <p className="text-sm text-slate-600">Puntaje: {selectedPlayer.score}</p>
              )}
            </div>
            <Button
              onClick={handleRegisterExistingPlayer}
              className="w-full mt-4 bg-gradient-to-r from-violet-600 to-violet-800"
              disabled={isRegistering}
            >
              {isRegistering ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              Inscribir Jugador
            </Button>
          </div>
        )}
      </TabsContent>

      <TabsContent value="new">
        <Form {...newPlayerForm}>
          <form onSubmit={newPlayerForm.handleSubmit(handleRegisterNewPlayer)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={newPlayerForm.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del jugador" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={newPlayerForm.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido</FormLabel>
                    <FormControl>
                      <Input placeholder="Apellido del jugador" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={newPlayerForm.control}
                name="dni"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DNI</FormLabel>
                    <FormControl>
                      <Input placeholder="DNI del jugador" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={newPlayerForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="Teléfono del jugador" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={newPlayerForm.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione una categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1ª">1ª</SelectItem>
                      <SelectItem value="2ª">2ª</SelectItem>
                      <SelectItem value="3ª">3ª</SelectItem>
                      <SelectItem value="4ª">4ª</SelectItem>
                      <SelectItem value="5ª">5ª</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-800"
              disabled={isRegistering}
            >
              {isRegistering ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              Registrar e Inscribir Jugador
            </Button>
          </form>
        </Form>
      </TabsContent>
    </Tabs>
  )
}
