"use client"

import { UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PlayerInfo {
  id: string
  first_name: string | null
  last_name: string | null
  score?: number | null
  dni?: string | null
  phone?: string | null
}

interface PlayerSearchResultsProps {
  results: PlayerInfo[]
  onSelectPlayer: (playerId: string) => void
  selectedPlayer1Id?: string | null
  selectedPlayer2Id?: string | null
  isLoading?: boolean
  emptyMessage?: string
}

export default function PlayerSearchResults({
  results,
  onSelectPlayer,
  selectedPlayer1Id,
  selectedPlayer2Id,
  isLoading = false,
  emptyMessage = "No se encontraron resultados"
}: PlayerSearchResultsProps) {
  if (isLoading) {
    return <div className="text-center py-4">Buscando jugadores...</div>
  }

  if (!results || results.length === 0) {
    return (
      <div className="text-center py-4 text-slate-500">{emptyMessage}</div>
    )
  }

  return (
    <div className="mt-4 border rounded-md border-slate-200 divide-y divide-slate-200 max-h-64 overflow-y-auto">
      {results.map((player) => {
        // Determine if this player is already selected
        const isPlayer1 = selectedPlayer1Id === player.id
        const isPlayer2 = selectedPlayer2Id === player.id
        const isSelected = isPlayer1 || isPlayer2
        
        // Determine the button style based on selection state
        let buttonClasses = "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100"
        if (isPlayer1) {
          buttonClasses = "bg-violet-100 text-violet-700 border-violet-300 font-medium"
        } else if (isPlayer2) {
          buttonClasses = "bg-emerald-100 text-emerald-700 border-emerald-300 font-medium"
        }

        return (
          <div
            key={player.id}
            className="flex items-center justify-between p-3 hover:bg-slate-50"
          >
            <div>
              <div className="font-medium text-slate-800">
                {player.first_name} {player.last_name}
              </div>
              <div className="text-sm text-slate-500">
                {player.dni ? `DNI: ${player.dni}` : ""}
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className={buttonClasses}
              onClick={() => onSelectPlayer(player.id)}
            >
              <UserPlus className="h-4 w-4 mr-1" />
              {isSelected ? "Seleccionado" : "Seleccionar"}
            </Button>
          </div>
        )
      })}
    </div>
  )
} 