"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Search, UserPlus, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { registerCouple } from "../utils/registration-service"
import PlayerSearch from "../ui/player-search"
import PlayerSearchResults from "../ui/player-search-results"
import CouplePreview from "../ui/couple-preview"

interface PlayerInfo {
  id: string
  first_name: string | null
  last_name: string | null
  score?: number | null
  dni?: string | null
  phone?: string | null
}

interface ClubCoupleFormProps {
  tournamentId: string
  onComplete: (success: boolean) => void
  players: PlayerInfo[]
}

export default function ClubCoupleForm({ tournamentId, onComplete, players }: ClubCoupleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<PlayerInfo[]>([])
  const [selectedPlayer1Id, setSelectedPlayer1Id] = useState<string | null>(null)
  const [selectedPlayer2Id, setSelectedPlayer2Id] = useState<string | null>(null)
  
  // Get the player objects for the selected IDs
  const player1 = selectedPlayer1Id ? players.find(p => p.id === selectedPlayer1Id) || null : null
  const player2 = selectedPlayer2Id ? players.find(p => p.id === selectedPlayer2Id) || null : null
  
  // Add effect to log selected players for debugging
  useEffect(() => {
    console.log("Selected Player 1:", player1)
    console.log("Selected Player 2:", player2)
  }, [player1, player2])
  
  // Handle player selection
  const handleSelectPlayer = (playerId: string) => {
    // Check if this player is already selected
    if (selectedPlayer1Id === playerId) {
      // Already selected as player 1, deselect it
      setSelectedPlayer1Id(null)
      return
    }
    
    if (selectedPlayer2Id === playerId) {
      // Already selected as player 2, deselect it
      setSelectedPlayer2Id(null)
      return
    }
    
    // Select as appropriate player
    if (!selectedPlayer1Id) {
      // No player 1 selected yet, make this player 1
      setSelectedPlayer1Id(playerId)
    } else if (!selectedPlayer2Id) {
      // Player 1 is selected but player 2 isn't, make this player 2
      setSelectedPlayer2Id(playerId)
    } else {
      // Both players are already selected, replace player 2
      setSelectedPlayer2Id(playerId)
    }
  }

  // Handle deselection of specific player
  const handleUnselectPlayer = (playerNumber: 1 | 2) => {
    if (playerNumber === 1) {
      setSelectedPlayer1Id(null)
    } else {
      setSelectedPlayer2Id(null)
    }
  }
  
  // Handle search results
  const handleSearchResults = (results: PlayerInfo[]) => {
    setSearchResults(results)
    setIsSearching(false)
  }
  
  // Submit the couple registration
  const onSubmitCouple = async () => {
    // Validate both players are selected
    if (!selectedPlayer1Id || !selectedPlayer2Id) {
      alert("Debe seleccionar dos jugadores para formar la pareja")
      return
    }

    setIsSubmitting(true)
    
    try {
      const result = await registerCouple(tournamentId, selectedPlayer1Id, selectedPlayer2Id)

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

  return (
    <Tabs defaultValue="search" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="search">
          <Search className="mr-2 h-4 w-4" />
          Buscar jugadores
        </TabsTrigger>
        <TabsTrigger value="info">
          <UserPlus className="mr-2 h-4 w-4" />
          Información
        </TabsTrigger>
      </TabsList>

      <TabsContent value="search" className="space-y-4 py-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Modo Club</AlertTitle>
          <AlertDescription>
            Debe seleccionar dos jugadores para formar la pareja. Seleccione el primer jugador y luego el segundo.
          </AlertDescription>
        </Alert>

        <PlayerSearch 
          players={players} 
          onSearchResults={handleSearchResults} 
          label="Buscar jugadores para el torneo"
        />

        <PlayerSearchResults
          results={searchResults}
          onSelectPlayer={handleSelectPlayer}
          selectedPlayer1Id={selectedPlayer1Id}
          selectedPlayer2Id={selectedPlayer2Id}
          isLoading={isSearching}
        />

        <CouplePreview 
          player1={player1}
          player2={player2}
          onRemovePlayer1={() => handleUnselectPlayer(1)}
          onRemovePlayer2={() => handleUnselectPlayer(2)}
          isClubMode={true}
        />

        {(selectedPlayer1Id && selectedPlayer2Id) && (
          <div className="flex justify-end pt-4">
            <Button onClick={onSubmitCouple} disabled={isSubmitting} className="bg-teal-600 hover:bg-teal-700">
              {isSubmitting ? "Procesando..." : "Registrar pareja"}
            </Button>
          </div>
        )}
      </TabsContent>

      <TabsContent value="info" className="py-4">
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Información</AlertTitle>
          <AlertDescription>
            Como club, puedes formar parejas seleccionando dos jugadores registrados en el sistema.
            <ul className="list-disc list-inside mt-2">
              <li>Busca jugadores por nombre, apellido o DNI</li>
              <li>Selecciona el primer jugador haciendo click en "Seleccionar"</li>
              <li>Luego selecciona al segundo jugador</li>
              <li>Confirma la inscripción de la pareja</li>
            </ul>
          </AlertDescription>
        </Alert>
      </TabsContent>
    </Tabs>
  )
} 