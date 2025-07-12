"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Trophy, Loader2, CheckCircle, Clock, Edit, ArrowRight, Users } from "lucide-react"
import { fetchTournamentMatches, createKnockoutStageMatchesAction } from "@/app/api/tournaments/actions"
import { updateMatch } from "@/app/api/matches/actions"
import MatchResultDialog from "@/components/tournament/match-result-dialog"
import MatchStatusBadge from "@/components/tournament/match-status-badge"
import MatchActionsMenu from "@/components/tournament/match-actions-menu"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { Database } from "@/database.types"
import MatchTable from "@/components/tournament/match-table"

type MatchStatus = Database["public"]["Enums"]["match_status"]

interface TournamentMatchesTabProps {
  tournamentId: string
  isOwner?: boolean
}

// Componente para nombres de jugadores clickeables
const PlayerName = ({ playerId, playerName }: { playerId: string; playerName: string }) => {
  if (!playerId || !playerName) {
    return <span className="text-slate-500">Por determinar</span>
  }
  
  return (
    <Link 
      href={`/ranking/${playerId}`} 
      className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
    >
      {playerName}
    </Link>
  )
}

// Componente para una pareja clickeable
const CoupleNames = ({ couple, playerNames }: { 
  couple?: { player1_id: string; player2_id: string };
  playerNames: string;
}) => {
  if (!couple?.player1_id || !couple?.player2_id) {
    return <span className="font-medium text-slate-900">{playerNames}</span>
  }

  const [player1Name, player2Name] = playerNames.split(' / ')
  
  return (
    <span className="font-medium">
      <PlayerName playerId={couple.player1_id} playerName={player1Name} />
      <span className="text-slate-500"> / </span>
      <PlayerName playerId={couple.player2_id} playerName={player2Name} />
    </span>
  )
}

export default function TournamentMatchesTab({ tournamentId, isOwner = false }: TournamentMatchesTabProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAdvancing, setIsAdvancing] = useState(false)
  const [matches, setMatches] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const loadMatches = async () => {
      try {
        setIsLoading(true)
        const result = await fetchTournamentMatches(tournamentId)
        if (result.success && result.matches) {
          console.log('Matches data:', result.matches.map(m => ({ id: m.id, status: m.status, court: m.court })))
          setMatches(result.matches)
        } else {
          setError(result.error || "Error al cargar los partidos")
        }
      } catch (err) {
        console.error("Error loading matches:", err)
        setError("Ocurrió un error inesperado")
      } finally {
        setIsLoading(false)
      }
    }

    loadMatches()
  }, [tournamentId])

  const handleOpenResultDialog = (match: any) => {
    setSelectedMatch(match)
    setIsDialogOpen(true)
  }

  const handleResultSaved = () => {
    setIsDialogOpen(false)
    fetchTournamentMatches(tournamentId).then((result) => {
      if (result.success && result.matches) {
        setMatches(result.matches)
      }
    })
  }

  const handleUpdateMatch = async (matchId: string, data: { status?: MatchStatus; court?: string }) => {
    try {
      await updateMatch(matchId, data)
      toast({
        title: "Partido actualizado",
        description: "El estado del partido ha sido actualizado correctamente",
        variant: "default"
      })
      
      // Recargar partidos
      const result = await fetchTournamentMatches(tournamentId)
      if (result.success && result.matches) {
        setMatches(result.matches)
      }
    } catch (error) {
      console.error("Error updating match:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el partido. Intenta nuevamente.",
        variant: "destructive"
      })
    }
  }

  const allMatchesCompleted = matches.length > 0 && matches.every((match) => match.status === "FINISHED")

  const handleAdvanceToNextStage = async () => {
    setIsAdvancing(true)
    setError(null)
    try {
      const result = await createKnockoutStageMatchesAction(tournamentId)
      if (result.success) {
        toast({
          title: "Éxito",
          description: result.message || "Siguiente etapa generada correctamente.",
        })
        const updatedMatchesResult = await fetchTournamentMatches(tournamentId)
        if (updatedMatchesResult.success && updatedMatchesResult.matches) {
          setMatches(updatedMatchesResult.matches)
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo avanzar a la siguiente etapa.",
          variant: "destructive",
        })
        setError(result.error || "No se pudo avanzar a la siguiente etapa.")
      }
    } catch (error: any) {
      console.error("Error advancing to next stage:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado al avanzar de etapa.",
        variant: "destructive",
      })
      setError("Ocurrió un error inesperado al avanzar de etapa.")
    } finally {
      setIsAdvancing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="h-8 w-8 text-slate-600 animate-spin" />
        <span className="ml-3 text-slate-500">Cargando partidos...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-6 rounded-lg border border-red-200 text-center">
        <div className="font-semibold mb-1">Error al cargar partidos</div>
        <div className="text-sm">{error}</div>
      </div>
    )
  }

  if (!matches || matches.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Trophy className="h-10 w-10 text-slate-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">No hay partidos programados</h3>
        <p className="text-slate-500 max-w-md mx-auto">
          Aún no se han programado partidos para este torneo. Los partidos se generarán automáticamente cuando comience.
        </p>
      </div>
    )
  }

  // Agrupar partidos por zona en lugar de por ronda
  const matchesByZone: Record<string, any[]> = {}
  const eliminationMatches: any[] = []

  matches.forEach((match) => {
    if (match.zone_info) {
      const zoneName = match.zone_info.name
      if (!matchesByZone[zoneName]) {
        matchesByZone[zoneName] = []
      }
      matchesByZone[zoneName].push({
        ...match,
        couple_1: {
          player_1: match.couple1_player1_name,
          player_2: match.couple1_player2_name
        },
        couple_2: {
          player_1: match.couple2_player1_name,
          player_2: match.couple2_player2_name
        }
      })
    } else {
      eliminationMatches.push({
        ...match,
        couple_1: {
          player_1: match.couple1_player1_name,
          player_2: match.couple1_player2_name
        },
        couple_2: {
          player_1: match.couple2_player1_name,
          player_2: match.couple2_player2_name
        }
      })
    }
  })

  const formatDate = (date: string | undefined) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Partidos por zona */}
      {Object.entries(matchesByZone).map(([zoneName, zoneMatches]) => {
        // Si el nombre de la zona es 'Zone A', 'Zone B', etc., mostrar solo la letra
        let label = zoneName;
        if (/^Zone\s+/i.test(zoneName)) {
          label = zoneName.replace(/^Zone\s+/i, '');
        }
        return (
          <Card key={zoneName} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">
                  Zona {label}
                </h3>
              </div>
              <MatchTable
                matches={zoneMatches}
                formatDate={formatDate}
                isOwner={isOwner}
                onUpdateMatch={handleUpdateMatch}
                onOpenResultDialog={handleOpenResultDialog}
              />
            </CardContent>
          </Card>
        );
      })}

      {/* Partidos de eliminación */}
      {eliminationMatches.length > 0 && (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                Fase Eliminatoria
              </h3>
            </div>
            <MatchTable
              matches={eliminationMatches}
              formatDate={formatDate}
              isOwner={isOwner}
              onUpdateMatch={handleUpdateMatch}
              onOpenResultDialog={handleOpenResultDialog}
            />
          </CardContent>
        </Card>
      )}

      {/* Botón para avanzar a la siguiente etapa */}
      {isOwner && allMatchesCompleted && !eliminationMatches.length && (
        <div className="flex justify-center mt-8">
          <Button
            onClick={handleAdvanceToNextStage}
            disabled={isAdvancing}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            {isAdvancing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando siguiente etapa...
              </>
            ) : (
              <>
                <ArrowRight className="mr-2 h-4 w-4" />
                Avanzar a fase eliminatoria
              </>
            )}
          </Button>
        </div>
      )}

      {/* Diálogo para editar resultado */}
      {selectedMatch && (
        <MatchResultDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          match={selectedMatch}
          onSave={handleResultSaved}
        />
      )}
    </div>
  )
}
