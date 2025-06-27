"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, UserPlus, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { registerCouple, registerNewPlayerAsCouple } from "../utils/registration-service"
import { registerCoupleForTournamentAndRemoveIndividual } from '@/app/api/tournaments/actions'
import PlayerSearch from "../ui/player-search"
import PlayerSearchResults from "../ui/player-search-results"
import CouplePreview from "../ui/couple-preview"

// Player schema for new player form
const playerFormSchema = z.object({
  firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  phone: z.string().min(6, "El teléfono debe tener al menos 6 caracteres"),
  dni: z.string().min(7, "El DNI debe tener al menos 7 caracteres"),
})

type PlayerFormValues = z.infer<typeof playerFormSchema>

interface PlayerInfo {
  id: string
  first_name: string | null
  last_name: string | null
  score?: number | null
  dni?: string | null
  phone?: string | null
}

interface PlayerCoupleFormProps {
  tournamentId: string
  onComplete: (success: boolean) => void
  players: PlayerInfo[]
  playerUserId?: string | null
}

export default function PlayerCoupleForm({ 
  tournamentId, 
  onComplete, 
  players,
  playerUserId 
}: PlayerCoupleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<PlayerInfo[]>([])
  const [selectedPlayer2Id, setSelectedPlayer2Id] = useState<string | null>(null)
  
  // Get the current player and partner objects
  const currentPlayer = playerUserId ? players.find(p => p.id === playerUserId) || null : null
  const partner = selectedPlayer2Id ? players.find(p => p.id === selectedPlayer2Id) || null : null

  // Default values for new player form
  const defaultValues: Partial<PlayerFormValues> = {
    firstName: "",
    lastName: "",
    phone: "",
    dni: "",
  }

  // Setup form for new player registration
  const playerForm = useForm<PlayerFormValues>({
    resolver: zodResolver(playerFormSchema),
    defaultValues,
  })
  
  // Handle search results
  const handleSearchResults = (results: PlayerInfo[]) => {
    setSearchResults(results)
    setIsSearching(false)
  }
  
  // Handle player selection
  const handleSelectPlayer = (playerId: string) => {
    // Prevent selecting oneself as a partner
    if (playerId === playerUserId) {
      alert("No puedes seleccionarte a ti mismo como pareja")
      return
    }
    
    // Toggle selection for player 2
    if (selectedPlayer2Id === playerId) {
      setSelectedPlayer2Id(null)
    } else {
      setSelectedPlayer2Id(playerId)
    }
  }
  
  // Submit the couple registration with existing player
  const onSubmitCouple = async () => {
    if (!playerUserId || !selectedPlayer2Id) {
      alert("Debe seleccionar un compañero para registrar la pareja")
      return
    }

    setIsSubmitting(true)

    try {
      // Use the new function that handles individual-to-couple conversion
      const result = await registerCoupleForTournamentAndRemoveIndividual(tournamentId, playerUserId, selectedPlayer2Id)

      if (result.success) {
        if (result.convertedFrom) {
          alert(result.message || "¡Inscripción convertida exitosamente! Tu inscripción individual se ha convertido a pareja.")
        } else {
          alert("¡Pareja registrada con éxito!")
        }
        onComplete(true)
      } else {
        alert(result.error || "Error al registrar la pareja.")
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

  // Submit new player as partner
  const onSubmitNewPlayer = async (data: PlayerFormValues) => {
    if (!playerUserId) {
      alert("Debe iniciar sesión para registrar una pareja")
      return
    }

    setIsSubmitting(true)

    try {
      const result = await registerNewPlayerAsCouple(
        tournamentId, 
        playerUserId, 
        {
          dni: data.dni,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone
        }
      )
      
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

  // Show warning if no player ID
  if (!playerUserId) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          No se pudo obtener tu ID de jugador. Asegúrate de estar registrado como jugador y haber iniciado sesión.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Tabs defaultValue="search" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="search">
          <Search className="mr-2 h-4 w-4" />
          Buscar compañero/a
        </TabsTrigger>
        <TabsTrigger value="new">
          <UserPlus className="mr-2 h-4 w-4" />
          Nuevo jugador
        </TabsTrigger>
      </TabsList>

      <TabsContent value="search" className="space-y-4 py-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Modo Jugador</AlertTitle>
          <AlertDescription>
            Tú serás el primer jugador de la pareja. Selecciona a tu compañero/a para el torneo.
          </AlertDescription>
        </Alert>

        <PlayerSearch 
          players={players} 
          onSearchResults={handleSearchResults} 
          label="Buscar compañero/a para el torneo"
        />

        <PlayerSearchResults
          results={searchResults}
          onSelectPlayer={handleSelectPlayer}
          selectedPlayer2Id={selectedPlayer2Id}
          isLoading={isSearching}
        />

        <CouplePreview 
          player1={currentPlayer}
          player2={partner}
          onRemovePlayer2={() => setSelectedPlayer2Id(null)}
          isClubMode={false}
        />

        {selectedPlayer2Id && (
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