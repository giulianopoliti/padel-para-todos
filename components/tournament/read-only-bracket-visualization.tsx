"use client"

import { useState, useEffect, useRef } from "react"
import { fetchTournamentMatches } from "@/app/api/tournaments/actions"
import { Loader2, CheckCircle, Clock } from "lucide-react"

interface ReadOnlyBracketVisualizationProps {
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

export default function ReadOnlyBracketVisualization({ tournamentId }: ReadOnlyBracketVisualizationProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [matches, setMatches] = useState<Match[]>([])
  const [error, setError] = useState<string | null>(null)
  const [matchPositions, setMatchPositions] = useState<MatchPosition[]>([])
  const [connectorLines, setConnectorLines] = useState<ConnectorLine[]>([])
  const bracketRef = useRef<HTMLDivElement>(null)

  const matchSpacing = 80
  const matchHeight = 130
  const columnWidth = 380
  const matchWidth = 320

  const loadTournamentData = async () => {
    try {
      setIsLoading(true)
      setError(null)

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

            lines.push(
              { x1: startParent.x + startParent.width, y1: startParentCenterY, x2: connectionX, y2: startParentCenterY, roundIndex },
              { x1: endParent.x + endParent.width, y1: endParentCenterY, x2: connectionX, y2: endParentCenterY, roundIndex },
              { x1: connectionX, y1: startParentCenterY, x2: connectionX, y2: endParentCenterY, roundIndex },
              { x1: connectionX, y1: midPointY, x2: currentMatchPos.x, y2: currentMatchCenterY, roundIndex },
            )
          }
        })
      }
    })

    setMatchPositions(positions)
    setConnectorLines(lines)
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
        <div className="font-semibold mb-1">Error al cargar las llaves</div>
        <div className="text-sm">{error}</div>
      </div>
    )
  }

  if (!matches || matches.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-slate-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">No hay llaves disponibles</h3>
        <p className="text-slate-500 max-w-md mx-auto">
          Las llaves se generarán automáticamente cuando el torneo avance a la fase de eliminación directa.
        </p>
      </div>
    )
  }

  const roundOrder = ["32VOS", "16VOS", "8VOS", "4TOS", "SEMIFINAL", "FINAL"]

  const roundTranslation: Record<string, string> = {
    "32VOS": "32vos de Final",
    "16VOS": "16vos de Final",
    "8VOS": "Octavos de Final",
    "4TOS": "Cuartos de Final",
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

  const totalWidthForLayout = activeRoundsForLayout.length * columnWidth + 100

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
                  className={`bg-white rounded-lg shadow-md h-full border-2 ${
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

                  {/* Footer - SIN BOTONES DE EDICIÓN */}
                  <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex justify-center items-center">
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
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

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