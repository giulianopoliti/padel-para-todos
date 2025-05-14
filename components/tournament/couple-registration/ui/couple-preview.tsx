"use client"

import PlayerSelection from "./player-selection"

interface PlayerInfo {
  id: string
  first_name: string | null
  last_name: string | null
  score?: number | null
  dni?: string | null
  phone?: string | null
}

interface CouplePreviewProps {
  player1: PlayerInfo | null
  player2: PlayerInfo | null
  onRemovePlayer1?: () => void
  onRemovePlayer2?: () => void
  isClubMode?: boolean
}

export default function CouplePreview({
  player1,
  player2,
  onRemovePlayer1,
  onRemovePlayer2,
  isClubMode = false
}: CouplePreviewProps) {
  return (
    <div className="mt-6 p-4 border border-slate-200 rounded-lg bg-slate-50">
      <h3 className="text-lg font-medium text-teal-700 mb-3">Pareja Seleccionada</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PlayerSelection 
          player={player1}
          label="Jugador 1"
          onRemove={onRemovePlayer1}
          placeholder={isClubMode ? "Selecciona el primer jugador" : "No se pudo obtener tus datos"}
          removable={isClubMode}
        />
        
        <PlayerSelection 
          player={player2}
          label="Jugador 2"
          onRemove={onRemovePlayer2}
          placeholder={isClubMode ? "Selecciona el segundo jugador" : "Selecciona un compañero"}
        />
      </div>
    </div>
  )
} 