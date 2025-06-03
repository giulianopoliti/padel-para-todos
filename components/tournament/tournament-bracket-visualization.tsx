"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { fetchTournamentMatches } from "@/app/api/tournaments/actions"
import { getTournamentById } from "@/app/api/tournaments/actions"
import { advanceToNextStageAction } from "@/app/api/tournaments/actions"
import { updateMatchResult } from "@/app/api/tournaments/actions"
import { Loader2, GitFork, CheckCircle, Clock, Trophy, ArrowRight } from "lucide-react"
import MatchResultDialog from "@/components/tournament/match-result-dialog"

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

  const matchSpacing = 80
  const matchHeight = 130
  const columnWidth = 380
  const matchWidth = 320

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
            SEMIFINAL: 4,
            FINAL: 5,
          }
          const roundAIndex = roundOrderMap[a.round] ?? 99
          const roundBIndex = roundOrderMap[b.round] ?? 99

          if (roundAIndex !== roundBIndex) return roundAIndex - roundBIndex

          const orderA = typeof a.order === "number" ? a.order : Number.POSITIVE_INFINITY
          const orderB = typeof b.order === "number" ? b.order : Number.POSITIVE_INFINITY
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

    const positions: MatchPosition[] = []
    const lines: ConnectorLine[] = []

    activeRounds.forEach((round, roundIndex) => {
      const roundMatches = matchesByRound[round]
      const x = roundIndex * columnWidth

      if (roundIndex === 0) {
        const startY = 60

        roundMatches.forEach((match, matchIndex) => {
          const y = startY + matchIndex * (matchHeight + matchSpacing)
          positions.push({
            match,
            x,
            y,
            width: matchWidth,
            height: matchHeight,
          })
        })
      } else {
        const prevRoundMatches = matchesByRound[activeRounds[roundIndex - 1]]

        roundMatches.forEach((match, matchIndex) => {
          const startParentIndex = matchIndex * 2
          const endParentIndex = startParentIndex + 1

          const startParent = positions.find((p) => p.match.id === prevRoundMatches[startParentIndex]?.id)
          const endParent = positions.find((p) => p.match.id === prevRoundMatches[endParentIndex]?.id)

          if (startParent && endParent) {
            const centerY =
              (startParent.y + startParent.height / 2 + endParent.y + endParent.height / 2) / 2 - matchHeight / 2

            positions.push({
              match,
              x,
              y: centerY,
              width: matchWidth,
              height: matchHeight,
            })

            const currentMatchPos = positions[positions.length - 1]
            const currentMatchCenterY = currentMatchPos.y + currentMatchPos.height / 2
            const startParentCenterY = startParent.y + startParent.height / 2
            const endParentCenterY = endParent.y + endParent.height / 2

            const connectionX = startParent.x + startParent.width + 30
            const midPointY = (startParentCenterY + endParentCenterY) / 2

            if (prevRoundMatches[startParentIndex]?.status === "COMPLETED") {
              lines.push({
                x1: startParent.x + startParent.width,
                y1: startParentCenterY,
                x2: connectionX,
                y2: startParentCenterY,
                roundIndex: roundIndex - 1,
              })
              
              lines.push({
                x1: connectionX,
                y1: startParentCenterY,
                x2: connectionX,
                y2: midPointY,
                roundIndex: roundIndex - 1,
              })
            }

            if (prevRoundMatches[endParentIndex]?.status === "COMPLETED") {
              lines.push({
                x1: endParent.x + endParent.width,
                y1: endParentCenterY,
                x2: connectionX,
                y2: endParentCenterY,
                roundIndex: roundIndex - 1,
              })
              
              lines.push({
                x1: connectionX,
                y1: endParentCenterY,
                x2: connectionX,
                y2: midPointY,
                roundIndex: roundIndex - 1,
              })
            }

            if (
              prevRoundMatches[startParentIndex]?.status === "COMPLETED" ||
              prevRoundMatches[endParentIndex]?.status === "COMPLETED"
            ) {
              lines.push({
                x1: connectionX,
                y1: midPointY,
                x2: currentMatchPos.x,
                y2: currentMatchCenterY,
                roundIndex: roundIndex - 1,
              })
            }
          } else if (startParent && !endParent) {
            const centerY = startParent.y + (startParent.height - matchHeight) / 2

            positions.push({
              match,
              x,
              y: centerY,
              width: matchWidth,
              height: matchHeight,
            })

            const currentMatchPos = positions[positions.length - 1]
            const currentMatchCenterY = currentMatchPos.y + currentMatchPos.height / 2
            const startParentCenterY = startParent.y + startParent.height / 2

            if (prevRoundMatches[startParentIndex]?.status === "COMPLETED") {
              lines.push({
                x1: startParent.x + startParent.width,
                y1: startParentCenterY,
                x2: currentMatchPos.x,
                y2: currentMatchCenterY,
                roundIndex: roundIndex - 1,
              })
            }
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
          description:
            result.message ||
            (result.isFinal ? "El torneo ha concluido." : "Se ha avanzado a la siguiente etapa del torneo."),
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
      <div className="flex justify-center items-center py-16">
        <Loader2 className="h-8 w-8 text-slate-600 animate-spin" />
        <span className="ml-3 text-slate-500">Cargando llaves del torneo...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-6 rounded-lg border border-red-200 text-center">
        <div className="font-semibold mb-1">Error al cargar llaves</div>
        <div className="text-sm">{error}</div>
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <GitFork className="h-10 w-10 text-slate-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">No hay llaves generadas</h3>
        <p className="text-slate-500 max-w-md mx-auto">
          Aún no se han generado las llaves para la etapa de eliminación directa. Las llaves se crearán automáticamente
          cuando termine la fase de grupos.
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

  const activeRoundsForLayout = roundOrder.filter((round) => matchesByRound[round] && matchesByRound[round].length > 0)

  const totalWidthForLayout = activeRoundsForLayout.length * columnWidth
  const allMatches = Object.values(matchesByRound).flat()
  const maxMatchesInRound = Math.max(...activeRoundsForLayout.map((round) => matchesByRound[round].length))
  const calculatedTotalHeightForLayout = Math.max(600, 60 + maxMatchesInRound * (matchHeight + matchSpacing) + 100)

  return (
    <div className="space-y-6">
      <div
        ref={bracketRef}
        className="tournament-bracket overflow-x-auto overflow-y-auto border border-gray-200 rounded-lg bg-gray-50"
        style={{ maxHeight: "70vh" }}
      >
        <div
          className="relative py-8"
          style={{ width: totalWidthForLayout, minHeight: calculatedTotalHeightForLayout }}
        >
          <svg
            className="absolute top-0 left-0 pointer-events-none"
            width={totalWidthForLayout}
            height={calculatedTotalHeightForLayout}
            style={{ zIndex: 1 }}
          >
            {connectorLines.map((line, index) => (
              <g key={index}>
                <line
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke="#64748b"
                  strokeWidth="2"
                  fill="none"
                />
              </g>
            ))}
          </svg>

          {activeRoundsForLayout.map((round: string, roundIndex: number) => (
            <div
              key={`header-${round}`}
              className="absolute text-center"
              style={{
                left: roundIndex * columnWidth,
                top: 0,
                width: matchWidth,
                zIndex: 2,
              }}
            >
              <div className="bg-slate-900 text-white rounded-lg py-3 px-4 shadow-sm">
                <h3 className="text-sm font-semibold">{roundTranslation[round] || round}</h3>
              </div>
            </div>
          ))}

          {matchPositions.map((position, index) => {
            const match = position.match
            const isCompleted = match.status === "COMPLETED"
            const isBye =
              match.couple1_id === "BYE_MARKER" || match.couple2_id === "BYE_MARKER" || match.couple2_id === null

            return (
              <div
                key={match.id}
                className="absolute"
                style={{
                  left: position.x,
                  top: position.y,
                  width: position.width,
                  height: position.height,
                  zIndex: 3,
                }}
              >
                <div
                  className={`bg-white rounded-lg shadow-md h-full transition-all hover:shadow-lg border-2 ${
                    isCompleted ? "border-slate-300" : "border-gray-200"
                  } overflow-hidden`}
                >
                  {/* Pareja 1 */}
                  <div
                    className={`px-4 py-2 ${
                      isCompleted && match.winner_id === match.couple1_id
                        ? "bg-emerald-50 border-l-4 border-emerald-500"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-center min-h-6">
                      <div className="font-medium text-slate-900 text-sm max-w-[240px]">
                        {match.couple1_player1_name && match.couple1_player2_name
                          ? `${match.couple1_player1_name} / ${match.couple1_player2_name}`
                          : match.couple1_id === "BYE_MARKER"
                            ? "BYE"
                            : "Por determinar"}
                      </div>
                      {isCompleted && (
                        <div className="bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                          {match.result_couple1}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Separador */}
                  <div className="border-t border-gray-200"></div>

                  {/* Pareja 2 */}
                  <div
                    className={`px-4 py-2 ${
                      isCompleted && match.winner_id === match.couple2_id
                        ? "bg-emerald-50 border-l-4 border-emerald-500"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-center min-h-6">
                      <div className="font-medium text-slate-900 text-sm max-w-[240px]">
                        {match.couple2_player1_name && match.couple2_player2_name
                          ? `${match.couple2_player1_name} / ${match.couple2_player2_name}`
                          : match.couple2_id === "BYE_MARKER" || match.couple2_id === null
                            ? "BYE"
                            : "Por determinar"}
                      </div>
                      {isCompleted && (
                        <div className="bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                          {match.result_couple2}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-amber-500" />
                      )}
                      <span className={`text-xs font-medium ${isCompleted ? "text-emerald-700" : "text-amber-600"}`}>
                        {isCompleted ? "Completado" : "Pendiente"}
                      </span>
                    </div>

                    {!isBye && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-6 px-2 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 rounded"
                        onClick={() => handleOpenResultDialog(match)}
                      >
                        {isCompleted ? "Editar" : "Cargar"}
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
            className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-lg shadow-sm"
            disabled={isAdvancing || isTournamentFinished}
          >
            {isAdvancing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Trophy className="mr-2 h-5 w-5" />}
            {isAdvancing ? "Avanzando..." : "Avanzar a la siguiente etapa"}
            {!isAdvancing && <ArrowRight className="ml-2 h-5 w-5" />}
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
          background: #f1f5f9;
          border-radius: 4px;
        }
        .tournament-bracket::-webkit-scrollbar-thumb {
          background: #64748b;
          border-radius: 4px;
        }
        .tournament-bracket::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>
    </div>
  )
}
