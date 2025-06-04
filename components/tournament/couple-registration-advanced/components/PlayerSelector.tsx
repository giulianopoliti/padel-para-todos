"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { UserPlus, Search, X, User } from 'lucide-react'

import { PlayerSelection, PlayerInfo, NewPlayerData, PlayerSelectionType } from '../types'
import NewPlayerForm from './NewPlayerForm'
import PlayerSearchForm from './PlayerSearchForm'

interface PlayerSelectorProps {
  playerNumber: 1 | 2
  playerSelection: PlayerSelection
  availablePlayers: PlayerInfo[]
  onUpdateSelection: (playerNumber: 1 | 2, type: PlayerSelectionType, data?: PlayerInfo | NewPlayerData) => void
  onClearSelection: (playerNumber: 1 | 2) => void
  isClubMode: boolean
  userPlayerId?: string | null
}

export default function PlayerSelector({
  playerNumber,
  playerSelection,
  availablePlayers,
  onUpdateSelection,
  onClearSelection,
  isClubMode,
  userPlayerId
}: PlayerSelectorProps) {
  const [activeTab, setActiveTab] = useState<'search' | 'new'>('search')

  const handleNewPlayerSubmit = (data: NewPlayerData) => {
    onUpdateSelection(playerNumber, 'new', data)
  }

  const handleExistingPlayerSelect = (player: PlayerInfo) => {
    onUpdateSelection(playerNumber, 'existing', player)
  }

  const handleClear = () => {
    onClearSelection(playerNumber)
    setActiveTab('search') // Reset to search tab
  }

  const getPlayerDisplay = () => {
    if (playerSelection.type === 'existing' && playerSelection.existingPlayer) {
      const player = playerSelection.existingPlayer
      return (
        <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h4 className="font-medium text-green-900">
                {player.first_name} {player.last_name}
              </h4>
              <p className="text-sm text-green-700">
                DNI: {player.dni || 'No disponible'}
              </p>
              {player.score && (
                <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                  Score: {player.score}
                </Badge>
              )}
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClear}
            className="text-green-600 hover:text-green-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )
    }

    if (playerSelection.type === 'new' && playerSelection.newPlayerData) {
      const player = playerSelection.newPlayerData
      return (
        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900">
                {player.first_name} {player.last_name}
              </h4>
              <p className="text-sm text-blue-700">
                DNI: {player.dni}
              </p>
              <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                Nuevo jugador
              </Badge>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClear}
            className="text-blue-600 hover:text-blue-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )
    }

    return null
  }

  const selectedPlayer = getPlayerDisplay()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Jugador {playerNumber}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {selectedPlayer ? (
          selectedPlayer
        ) : (
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'search' | 'new')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="search" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Buscar Existente
              </TabsTrigger>
              <TabsTrigger value="new" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Crear Nuevo
              </TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="mt-4">
              <PlayerSearchForm
                availablePlayers={availablePlayers}
                onPlayerSelect={handleExistingPlayerSelect}
                isClubMode={isClubMode}
                userPlayerId={userPlayerId}
                playerNumber={playerNumber}
              />
            </TabsContent>

            <TabsContent value="new" className="mt-4">
              <NewPlayerForm
                onSubmit={handleNewPlayerSubmit}
                playerNumber={playerNumber}
              />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
} 