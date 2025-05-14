"use client"

import { Button } from "@/components/ui/button"

interface PlayerInfo {
  id: string
  first_name: string | null
  last_name: string | null
  score?: number | null
  dni?: string | null
  phone?: string | null
}

interface PlayerSelectionProps {
  player: PlayerInfo | null
  label: string
  onRemove?: () => void
  placeholder?: string
  removable?: boolean
}

export default function PlayerSelection({
  player,
  label,
  onRemove,
  placeholder = "Selecciona un jugador",
  removable = true
}: PlayerSelectionProps) {
  return (
    <div className="p-3 border border-slate-300 bg-white rounded-md shadow-sm relative">
      <p className="text-sm text-slate-500 mb-1">{label}</p>
      
      {player ? (
        <>
          <p className="font-medium text-slate-700">
            {`${player.first_name || ""} ${player.last_name || ""}`}
          </p>
          
          {removable && onRemove && (
            <Button 
              className="absolute top-2 right-2 h-6 w-6 p-0 rounded-full" 
              variant="outline"
              onClick={onRemove}
              type="button"
            >
              &times;
            </Button>
          )}
        </>
      ) : (
        <p className="text-slate-400 italic">{placeholder}</p>
      )}
    </div>
  )
} 