"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle, Users, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

import { CoupleRegistrationAdvancedProps } from './types'
import { usePlayerSelection } from './hooks/usePlayerSelection'
import PlayerSelector from './components/PlayerSelector'
import CouplePreview from './components/CouplePreview'
import RegistrationActions from './components/RegistrationActions'

// Import backend functions
import { registerCoupleForTournament } from '@/app/api/tournaments/actions'
import { createPlayerForCouple } from '@/app/api/players/actions'

export default function CoupleRegistrationAdvanced({
  tournamentId,
  onComplete,
  players,
  isClubMode = false,
  userPlayerId = null
}: CoupleRegistrationAdvancedProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  
  const {
    coupleState,
    updatePlayerSelection,
    clearPlayerSelection,
    resetSelection,
    isSelectionComplete,
    areSamePlayer,
    getValidationErrors
  } = usePlayerSelection()

  const handleSubmit = async () => {
    const errors = getValidationErrors()
    if (errors.length > 0) {
      toast({
        title: "Error de validación",
        description: errors.join(', '),
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      const { player1, player2 } = coupleState
      
      // Escenario 1: Ambos jugadores existentes
      if (player1.type === 'existing' && player2.type === 'existing') {
        const result = await registerCoupleForTournament(
          tournamentId, 
          player1.existingPlayer!.id, 
          player2.existingPlayer!.id
        )
        
        if (result.success) {
          toast({
            title: "¡Pareja registrada!",
            description: "La pareja se ha inscrito exitosamente en el torneo",
          })
          onComplete(true)
        } else {
          toast({
            title: "Error en el registro",
            description: result.error || "No se pudo registrar la pareja",
            variant: "destructive"
          })
          onComplete(false)
        }
        return
      }
      
      // Para otros escenarios que involucran jugadores nuevos, 
      // necesitamos crear los jugadores primero
      let player1Id: string
      let player2Id: string
      
      // Crear o usar jugador 1
      if (player1.type === 'new') {
        const newPlayerResult = await createPlayerForCouple({
          tournamentId,
          playerData: {
            first_name: player1.newPlayerData!.first_name,
            last_name: player1.newPlayerData!.last_name,
            gender: "MALE", // Por defecto, se podría hacer configurable
            dni: player1.newPlayerData!.dni
          }
        })
        
        if (!newPlayerResult.success) {
          throw new Error("No se pudo crear el jugador 1")
        }
        
        // Usar el ID devuelto por createPlayerForCouple
        player1Id = newPlayerResult.playerId!
        console.log("[CoupleRegistration] Jugador 1 creado con ID:", player1Id)
      } else {
        player1Id = player1.existingPlayer!.id
      }
      
      // Crear o usar jugador 2
      if (player2.type === 'new') {
        const newPlayerResult = await createPlayerForCouple({
          tournamentId,
          playerData: {
            first_name: player2.newPlayerData!.first_name,
            last_name: player2.newPlayerData!.last_name,
            gender: "MALE", // Por defecto, se podría hacer configurable
            dni: player2.newPlayerData!.dni
          }
        })
        
        if (!newPlayerResult.success) {
          throw new Error("No se pudo crear el jugador 2")
        }
        
        // Usar el ID devuelto por createPlayerForCouple
        player2Id = newPlayerResult.playerId!
        console.log("[CoupleRegistration] Jugador 2 creado con ID:", player2Id)
      } else {
        player2Id = player2.existingPlayer!.id
      }
      
      // Registrar la pareja con los IDs obtenidos
      const result = await registerCoupleForTournament(tournamentId, player1Id, player2Id)
      
      if (result.success) {
        toast({
          title: "¡Pareja registrada!",
          description: "La pareja se ha inscrito exitosamente en el torneo",
        })
        onComplete(true)
      } else {
        toast({
          title: "Error en el registro",
          description: result.error || "No se pudo registrar la pareja",
          variant: "destructive"
        })
        onComplete(false)
      }
      
    } catch (error) {
      console.error('Error registrando pareja:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo registrar la pareja. Intente nuevamente.",
        variant: "destructive"
      })
      onComplete(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    resetSelection()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Registro de Pareja - Modo {isClubMode ? 'Club' : 'Jugador'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Sistema Avanzado de Registro</AlertTitle>
            <AlertDescription>
              Seleccione para cada posición si desea registrar un jugador nuevo o buscar uno existente. 
              Puede combinar cualquier opción: ambos nuevos, ambos existentes, o uno de cada tipo.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Player Selectors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlayerSelector
          playerNumber={1}
          playerSelection={coupleState.player1}
          availablePlayers={players}
          onUpdateSelection={updatePlayerSelection}
          onClearSelection={clearPlayerSelection}
          isClubMode={isClubMode}
          userPlayerId={userPlayerId}
        />
        
        <PlayerSelector
          playerNumber={2}
          playerSelection={coupleState.player2}
          availablePlayers={players}
          onUpdateSelection={updatePlayerSelection}
          onClearSelection={clearPlayerSelection}
          isClubMode={isClubMode}
          userPlayerId={userPlayerId}
        />
      </div>

      {/* Couple Preview */}
      <CouplePreview
        coupleState={coupleState}
        onClearPlayer={clearPlayerSelection}
      />

      {/* Validation Errors */}
      {getValidationErrors().length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Errores de validación</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside">
              {getValidationErrors().map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <RegistrationActions
        isSelectionComplete={isSelectionComplete()}
        hasErrors={getValidationErrors().length > 0}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        onReset={handleReset}
      />
    </div>
  )
} 