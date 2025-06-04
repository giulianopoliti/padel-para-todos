"use client"

import { useState, useCallback } from 'react'
import { PlayerSelection, CoupleSelectionState, PlayerInfo, NewPlayerData, PlayerSelectionType } from '../types'

export function usePlayerSelection() {
  const [coupleState, setCoupleState] = useState<CoupleSelectionState>({
    player1: { type: 'none' },
    player2: { type: 'none' }
  })

  const updatePlayerSelection = useCallback((
    playerNumber: 1 | 2,
    type: PlayerSelectionType,
    data?: PlayerInfo | NewPlayerData
  ) => {
    setCoupleState(prev => ({
      ...prev,
      [`player${playerNumber}`]: {
        type,
        ...(type === 'existing' && data ? { existingPlayer: data as PlayerInfo } : {}),
        ...(type === 'new' && data ? { newPlayerData: data as NewPlayerData } : {})
      }
    }))
  }, [])

  const clearPlayerSelection = useCallback((playerNumber: 1 | 2) => {
    setCoupleState(prev => ({
      ...prev,
      [`player${playerNumber}`]: { type: 'none' }
    }))
  }, [])

  const resetSelection = useCallback(() => {
    setCoupleState({
      player1: { type: 'none' },
      player2: { type: 'none' }
    })
  }, [])

  // Validaciones
  const isSelectionComplete = useCallback(() => {
    return coupleState.player1.type !== 'none' && coupleState.player2.type !== 'none'
  }, [coupleState])

  const areSamePlayer = useCallback(() => {
    const { player1, player2 } = coupleState
    
    // Si ambos son jugadores existentes, verificar que no sean el mismo
    if (player1.type === 'existing' && player2.type === 'existing') {
      return player1.existingPlayer?.id === player2.existingPlayer?.id
    }
    
    // Si ambos son nuevos, verificar DNI
    if (player1.type === 'new' && player2.type === 'new') {
      return player1.newPlayerData?.dni === player2.newPlayerData?.dni
    }
    
    // Si uno es nuevo y otro existente, verificar DNI vs DNI del existente
    if (player1.type === 'new' && player2.type === 'existing') {
      return player1.newPlayerData?.dni === player2.existingPlayer?.dni
    }
    
    if (player1.type === 'existing' && player2.type === 'new') {
      return player1.existingPlayer?.dni === player2.newPlayerData?.dni
    }
    
    return false
  }, [coupleState])

  const getValidationErrors = useCallback(() => {
    const errors: string[] = []
    
    if (!isSelectionComplete()) {
      errors.push('Debe seleccionar ambos jugadores para formar la pareja')
    }
    
    if (areSamePlayer()) {
      errors.push('No puede seleccionar el mismo jugador dos veces')
    }
    
    return errors
  }, [isSelectionComplete, areSamePlayer])

  return {
    coupleState,
    updatePlayerSelection,
    clearPlayerSelection,
    resetSelection,
    isSelectionComplete,
    areSamePlayer,
    getValidationErrors
  }
} 