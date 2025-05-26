import { useState, useEffect, useRef } from "react"
import { Loader2, Trophy, GitFork, ArrowRight, CheckCircle, Clock, Users } from "lucide-react"
import { fetchTournamentMatches, advanceToNextStageAction, getTournamentById } from "@/app/api/tournaments/actions"
import { useToast } from "@/components/ui/use-toast"
import MatchResultDialog from "@/components/tournament/match-result-dialog"
import { Button } from "../ui/button"

interface TournamentBracketVisualizationProps {
  tournamentId: string
}

interface Match {
  id: string
  round: string
  status: string
  couple1_id?: string | null
  couple2_id?: string | null
  couple1_player1_name?: string
  couple1_player2_name?: string
  couple2_player1_name?: string
  couple2_player2_name?: string
  result_couple1?: string | null
  result_couple2?: string | null
  winner_id?: string | null
  zone_name?: string | null
  order?: number
}

interface MatchPosition {
  match: Match
  x: number
  y: number
  width: number
  height: number
}

interface ConnectorLine {
  x1: number
  y1: number
  x2: number
  y2: number
  roundIndex: number
}

interface TournamentData {
    id: string;
    status: string;
}

export default function TournamentBracketVisualization({ tournamentId }: TournamentBracketVisualizationProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAdvancing, setIsAdvancing] = useState(false)
  const [matches, setMatches] = useState<Match[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isTournamentFinished, setIsTournamentFinished] = useState(false)
  const [currentTournamentRound, setCurrentTournamentRound] = useState<string>("")
  const [matchPositions, setMatchPositions] = useState<MatchPosition[]>([])
  const [connectorLines, setConnectorLines] = useState<ConnectorLine[]>([])
  const bracketRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const loadTournamentData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setIsTournamentFinished(false)

      const tournamentDetails = await getTournamentById(tournamentId)
      if (tournamentDetails && tournamentDetails.status === "FINISHED") {
        setIsTournamentFinished(true)
      }
      const result = await fetchTournamentMatches(tournamentId)
      if (result.success && result.matches) {
        const knockoutMatches = result.matches.filter(
          (match: any) => match.type === "ELIMINATION" || (match.round && match.round !== "ZONE"),
        )

        const sortedMatches = [...knockoutMatches].sort((a, b) => {
          const roundOrderMap: Record<string, number> = {
            "32VOS": 0,
            "16VOS": 1,
            "8VOS": 2,
            "4TOS": 3,
            "SEMIFINAL": 4,
            "FINAL": 5,
          }
          const roundAIndex = roundOrderMap[a.round] ?? 99
          const roundBIndex = roundOrderMap[b.round] ?? 99

          if (roundAIndex !== roundBIndex) return roundAIndex - roundBIndex

          const orderA = typeof a.order === 'number' ? a.order : Infinity
          const orderB = typeof b.order === 'number' ? b.order : Infinity
          return orderA - orderB
        })

        setMatches(sortedMatches)
        
        const currentRoundVal = getCurrentRound(sortedMatches)
        setCurrentTournamentRound(currentRoundVal)

        if (!isTournamentFinished && currentRoundVal === "FINAL") {
            const finalRoundMatches = sortedMatches.filter((match: Match) => match.round === "FINAL")
            if (finalRoundMatches.length > 0 && finalRoundMatches.every((match: Match) => match.status === "COMPLETED")) {
                setIsTournamentFinished(true)
            }
        }
      } else {
        setError(result.error || "Error al cargar los partidos de llaves")
      }
    } catch (err) {
      console.error("Error al cargar datos del torneo y partidos:", err)
      setError("Ocurrió un error inesperado al cargar las llaves.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTournamentData()
  }, [tournamentId])

  useEffect(() => {
    if (matches.length > 0) {
      calculatePositionsAndLines()
    }
  }, [matches])

  const calculatePositionsAndLines = () => {
    const roundOrder = ["32VOS", "16VOS", "8VOS", "4TOS", "SEMIFINAL", "FINAL"]
    
    const matchesByRound: Record<string, Match[]> = {}
    matches.forEach((match) => {
      const round = match.round || "Unknown"
      if (!matchesByRound[round]) {
        matchesByRound[round] = []
      }
      matchesByRound[round].push(match)
    })

    const activeRounds = roundOrder.filter((round) => matchesByRound[round] && matchesByRound[round].length > 0)
    
    const columnWidth = 300
    const matchHeight = 120
    const matchSpacing = 40
    const positions: MatchPosition[] = []
    const lines: ConnectorLine[] = []

    activeRounds.forEach((round, roundIndex) => {
      const roundMatches = matchesByRound[round]
      const x = roundIndex * columnWidth

      if (roundIndex === 0) {
        roundMatches.forEach((match, matchIndex) => {
          const y = matchIndex * (matchHeight + matchSpacing)
          positions.push({
            match,
            x,
            y,
            width: 260,
            height: matchHeight
          })
        })
      } else {
        const prevRoundMatches = matchesByRound[activeRounds[roundIndex - 1]]
        const matchesPerPrevMatch = 2
        
        roundMatches.forEach((match, matchIndex) => {
          const startParentIndex = matchIndex * matchesPerPrevMatch
          const endParentIndex = Math.min(startParentIndex + matchesPerPrevMatch - 1, prevRoundMatches.length - 1)
          
          const startParentPos = positions.find(p => p.match.id === prevRoundMatches[startParentIndex]?.id)
          const endParentPos = positions.find(p => p.match.id === prevRoundMatches[endParentIndex]?.id)
          
          if (startParentPos && endParentPos) {
            const centerY = (startParentPos.y + endParentPos.y + endParentPos.height) / 2 - matchHeight / 2
            
            positions.push({
              match,
              x,
              y: centerY,
              width: 260,
              height: matchHeight
            })

            const currentMatchPos = positions[positions.length - 1]
            const currentMatchCenterY = currentMatchPos.y + currentMatchPos.height / 2

            for (let parentIndex = startParentIndex; parentIndex <= endParentIndex; parentIndex++) {
              const parentMatch = prevRoundMatches[parentIndex]
              if (parentMatch && parentMatch.status === "COMPLETED") {
                const parentPos = positions.find(p => p.match.id === parentMatch.id)
                if (parentPos) {
                  const parentCenterY = parentPos.y + parentPos.height / 2
                  
                  lines.push({
                    x1: parentPos.x + parentPos.width,
                    y1: parentCenterY,
                    x2: parentPos.x + parentPos.width + 50,
                    y2: parentCenterY,
                    roundIndex: roundIndex - 1
                  })
                }
              }
            }

            if (startParentIndex !== endParentIndex) {
              const startParentCenterY = startParentPos.y + startParentPos.height / 2
              const endParentCenterY = endParentPos.y + endParentPos.height / 2
              
              lines.push({
                x1: startParentPos.x + startParentPos.width + 50,
                y1: startParentCenterY,
                x2: startParentPos.x + startParentPos.width + 50,
                y2: endParentCenterY,
                roundIndex: roundIndex - 1
              })
            }

            const parentCenterY = (startParentPos.y + startParentPos.height / 2 + endParentPos.y + endParentPos.height / 2) / 2
            lines.push({
              x1: startParentPos.x + startParentPos.width + 50,
              y1: parentCenterY,
              x2: currentMatchPos.x,
              y2: currentMatchCenterY,
              roundIndex: roundIndex - 1
            })
          }
        })
      }
    })

    setMatchPositions(positions)
    setConnectorLines(lines)
  }

  const handleOpenResultDialog = (match: Match) => {
    setSelectedMatch(match)
    setIsDialogOpen(true)
  }

  const handleResultSaved = () => {
    setIsDialogOpen(false)
    toast({
      title: "Resultado Guardado",
      description: "El resultado del partido ha sido actualizado.",
    })
    loadTournamentData()
  }

  const handleAdvanceToNextStage = async () => {
    setIsAdvancing(true)
    try {
      const result = await advanceToNextStageAction(tournamentId)
      if (result.success) {
        toast({
          title: result.isFinal ? "Torneo Finalizado" : "Avance Exitoso",
          description: result.message || (result.isFinal ? "El torneo ha concluido." : "Se ha avanzado a la siguiente etapa del torneo."),
        })
        if (result.isFinal) {
          setIsTournamentFinished(true)
        }
        loadTournamentData()
      } else {
        toast({
          title: "Error al Avanzar",
          description: result.error || "No se pudo avanzar a la siguiente etapa.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error inesperado al avanzar.",
        variant: "destructive",
      })
    } finally {
      setIsAdvancing(false)
    }
  }

  const getCurrentRound = (matchesData: Match[]) => {
    const rounds = ["32VOS", "16VOS", "8VOS", "4TOS", "SEMIFINAL", "FINAL"]
    for (const round of rounds) {
      const roundMatches = matchesData.filter((match) => match.round === round)
      if (roundMatches.length > 0 && roundMatches.some((match) => match.status !== "COMPLETED")) {
        return round
      }
    }
    for (const round of [...rounds].reverse()) {
      if (matchesData.some((match) => match.round === round)) {
        return round
      }
    }
    return ""
  }

  const allCurrentRoundMatchesCompleted = () => {
    if (!currentTournamentRound || matches.length === 0) return false
    const currentRoundMatches = matches.filter((match: Match) => match.round === currentTournamentRound)
    return currentRoundMatches.length > 0 && currentRoundMatches.every((match: Match) => match.status === "COMPLETED")
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
        <span className="ml-2 text-slate-500">Cargando llaves del torneo...</span>
      </div>
    )
  }

  if (error) {
    return <div className="bg-rose-50 text-rose-600 p-4 rounded-lg border border-rose-100 text-center">{error}</div>
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="bg-emerald-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
          <GitFork className="h-8 w-8 text-emerald-500" />
        </div>
        <h3 className="text-xl font-medium text-emerald-600 mb-2">No hay llaves generadas</h3>
        <p className="text-slate-500 max-w-md mx-auto">
          Aún no se han generado las llaves para la etapa de eliminación directa o no hay partidos de este tipo.
        </p>
      </div>
    )
  }

  const roundOrder = ["32VOS", "16VOS", "8VOS", "4TOS", "SEMIFINAL", "FINAL"]
  const roundTranslation: Record<string, string> = {
    "32VOS": "32vos de Final",
    "16VOS": "16vos de Final",
    "8VOS": "8vos de Final",
    "4TOS": "4tos de Final",
    SEMIFINAL: "Semifinales",
    FINAL: "Final",
  }

  const matchesByRound: Record<string, Match[]> = {}
  matches.forEach((match) => {
    const round = match.round || "Unknown"
    if (!matchesByRound[round]) {
      matchesByRound[round] = []
    }
    matchesByRound[round].push(match)
  })

  const activeRounds = roundOrder.filter((round) => matchesByRound[round] && matchesByRound[round].length > 0)
  const totalWidth = activeRounds.length * 300
  const maxMatches = Math.max(...activeRounds.map(round => matchesByRound[round].length))
  const totalHeight = maxMatches * 160 + 100

  return (
    <div className="space-y-8">
      <div className="flex justify-center mb-4">
        <div className="bg-white rounded-full p-1 shadow-sm border border-emerald-100 inline-flex">
          <Button variant="ghost" className="bg-emerald-500 text-white rounded-full px-4">
            <Trophy className="h-4 w-4 mr-2" />
            Vista de Llaves
          </Button>
          <Button variant="ghost" className="text-emerald-600 rounded-full px-4">
            <Clock className="h-4 w-4 mr-2" />
            Vista de Tabla
          </Button>
        </div>
      </div>

      <div className="tournament-bracket px-4 overflow-x-auto" ref={bracketRef}>
        <div className="relative" style={{ width: totalWidth, minHeight: totalHeight }}>
          <svg
            className="absolute top-0 left-0 pointer-events-none"
            width={totalWidth}
            height={totalHeight}
            style={{ zIndex: 1 }}
          >
            {connectorLines.map((line, index) => (
              <g key={index}>
                <line
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke="#10b981"
                  strokeWidth="2"
                  fill="none"
                />
              </g>
            ))}
          </svg>

          {activeRounds.map((round, roundIndex) => (
            <div
              key={`header-${round}`}
              className="absolute text-center"
              style={{
                left: roundIndex * 300,
                top: -60,
                width: 260,
                zIndex: 2
              }}
            >
              <h3 className="text-lg font-semibold text-emerald-700 bg-emerald-50 rounded-lg py-2 px-4 border border-emerald-200">
                {roundTranslation[round] || round}
              </h3>
            </div>
          ))}

          {matchPositions.map((position, index) => {
            const match = position.match
            const isCompleted = match.status === "COMPLETED"
            const isBye = match.couple1_id === "BYE_MARKER" || match.couple2_id === "BYE_MARKER" || match.couple2_id === null

            return (
              <div
                key={match.id}
                className="absolute"
                style={{
                  left: position.x,
                  top: position.y,
                  width: position.width,
                  height: position.height,
                  zIndex: 3
                }}
              >
                <div
                  className={`bg-white rounded-lg shadow-sm border-2 h-full transition-all hover:shadow-md ${
                    isCompleted ? "border-emerald-300" : "border-slate-200"
                  }`}
                >
                  <div className={`px-3 py-2 border-b ${isCompleted ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 text-slate-500 mr-2" />
                        <span className="text-xs font-medium text-slate-600">Partido {match.order || index + 1}</span>
                      </div>
                      <div className="flex items-center">
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`px-3 py-2 ${
                      isCompleted && match.winner_id === match.couple1_id
                        ? "bg-emerald-100"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="font-medium text-slate-800 text-sm truncate max-w-[140px]">
                        {match.couple1_player1_name && match.couple1_player2_name
                          ? `${match.couple1_player1_name} / ${match.couple1_player2_name}`
                          : match.couple1_id === "BYE_MARKER"
                            ? "BYE"
                            : "Por determinar"}
                      </div>
                      {isCompleted && (
                        <div className="bg-emerald-500 text-white text-sm font-bold px-2 py-1 rounded">
                          {match.result_couple1}
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    className={`px-3 py-2 ${
                      isCompleted && match.winner_id === match.couple2_id
                        ? "bg-emerald-100"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="font-medium text-slate-800 text-sm truncate max-w-[140px]">
                        {match.couple2_player1_name && match.couple2_player2_name
                          ? `${match.couple2_player1_name} / ${match.couple2_player2_name}`
                          : match.couple2_id === "BYE_MARKER" || match.couple2_id === null
                            ? "BYE"
                            : "Por determinar"}
                      </div>
                      {isCompleted && (
                        <div className="bg-emerald-500 text-white text-sm font-bold px-2 py-1 rounded">
                          {match.result_couple2}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                    <span className={`text-xs font-medium ${isCompleted ? "text-emerald-600" : "text-amber-600"}`}>
                      {isCompleted ? "Completado" : "Pendiente"}
                    </span>

                    {!isBye && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-6 px-2 bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400 hover:text-emerald-800"
                        onClick={() => handleOpenResultDialog(match)}
                      >
                        Editar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {allCurrentRoundMatchesCompleted() && !isAdvancing && !isTournamentFinished && (
        <div className="flex justify-center mt-8">
          <Button
            onClick={handleAdvanceToNextStage}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-6 rounded-full shadow-md hover:shadow-lg transition-all"
            disabled={isAdvancing || isTournamentFinished}
          >
            {isAdvancing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Trophy className="mr-2 h-5 w-5" />}
            {isAdvancing ? "Avanzando..." : "Avanzar a la siguiente etapa"}
            {!isAdvancing && <ArrowRight className="ml-2 h-5 w-5" />}
          </Button>
        </div>
      )}
      {isAdvancing && (
        <div className="flex justify-center mt-8">
          <Button disabled className="bg-emerald-100 text-emerald-700 cursor-not-allowed">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Avanzando...
          </Button>
        </div>
      )}

      {selectedMatch && (
        <MatchResultDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          match={selectedMatch}
          onSave={handleResultSaved}
        />
      )}

      <style>{`
        .tournament-bracket::-webkit-scrollbar {
          height: 8px;
        }
        .tournament-bracket::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .tournament-bracket::-webkit-scrollbar-thumb {
          background: #10b981;
          border-radius: 4px;
        }
        .tournament-bracket::-webkit-scrollbar-thumb:hover {
          background: #0d9488;
        }
      `}</style>
    </div>
  )
}
