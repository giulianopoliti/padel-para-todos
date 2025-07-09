"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { fetchTournamentMatches } from "@/app/api/tournaments/actions"
import { getPlayerProfile } from "@/app/api/users"
import { Loader2, CheckCircle, Clock, Eye } from "lucide-react"
import Link from "next/link"

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
  // Additional detailed information from fetchTournamentMatches
  couple1?: {
    id: string
    player1_id: string
    player2_id: string
    player1_details?: {
      id: string
      first_name: string
      last_name: string
    }
    player2_details?: {
      id: string
      first_name: string
      last_name: string
    }
  }
  couple2?: {
    id: string
    player1_id: string
    player2_id: string
    player1_details?: {
      id: string
      first_name: string
      last_name: string
    }
    player2_details?: {
      id: string
      first_name: string
      last_name: string
    }
  }
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
  const [selectedMatchForDetails, setSelectedMatchForDetails] = useState<Match | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [matchDetailsLoading, setMatchDetailsLoading] = useState(false)
  const [playerDetails, setPlayerDetails] = useState<Record<string, any>>({})
  const bracketRef = useRef<HTMLDivElement>(null)
  const [viewportWidth, setViewportWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)

  // Add responsive viewport tracking
  useEffect(() => {
    const updateViewportWidth = () => {
      setViewportWidth(window.innerWidth)
    }

    updateViewportWidth()
    window.addEventListener('resize', updateViewportWidth)
    return () => window.removeEventListener('resize', updateViewportWidth)
  }, [])

  // Responsive dimensions
  const isMobile = viewportWidth < 768
  const matchSpacing = isMobile ? 40 : 80
  const matchHeight = isMobile ? 110 : 130  // Adjusted for better mobile footer visibility
  const columnWidth = isMobile ? 200 : 380  // Adjusted for mobile screens
  const matchWidth = isMobile ? 185 : 320   // Adjusted to fit mobile screens properly

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

    // Helper function to find parent match by winner_id
    const findParentMatchByWinner = (coupleId: string | null, previousRoundPositions: MatchPosition[]): MatchPosition | null => {
      if (!coupleId) return null
      return previousRoundPositions.find(pos => pos.match.winner_id === coupleId) || null
    }

    // Helper function to calculate center Y between two parents
    const calculateCenterY = (parent1: MatchPosition | null, parent2: MatchPosition | null): number => {
      if (parent1 && parent2) {
        const parent1CenterY = parent1.y + parent1.height / 2
        const parent2CenterY = parent2.y + parent2.height / 2
        return (parent1CenterY + parent2CenterY) / 2 - matchHeight / 2
      } else if (parent1) {
        return parent1.y + (parent1.height - matchHeight) / 2
      } else if (parent2) {
        return parent2.y + (parent2.height - matchHeight) / 2
      }
      // Fallback to default positioning if no parents found
      return 60
    }

    activeRounds.forEach((round, roundIndex) => {
      const roundMatches = matchesByRound[round]
      const x = roundIndex * columnWidth

      if (roundIndex === 0) {
        // First round: position matches from top to bottom (backend now generates in correct order)
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
        // Subsequent rounds: find parent matches by winner_id
        const prevRoundPositions = positions.filter(pos => {
          const prevRound = activeRounds[roundIndex - 1]
          return matchesByRound[prevRound].some(m => m.id === pos.match.id)
        })

        roundMatches.forEach((match, matchIndex) => {
          // Find parent matches by winner_id instead of assuming position
          const parent1 = findParentMatchByWinner(match.couple1_id || null, prevRoundPositions)
          const parent2 = findParentMatchByWinner(match.couple2_id || null, prevRoundPositions)

          // Calculate position based on actual parent positions
          const centerY = calculateCenterY(parent1, parent2)

          // Add current match position
          const currentMatchPos: MatchPosition = {
            match,
            x,
            y: centerY,
            width: matchWidth,
            height: matchHeight,
          }
          positions.push(currentMatchPos)

          // Create connector lines from actual parents
          if (parent1 && parent2) {
            // Two parents case: draw lines meeting at midpoint
            const parent1CenterY = parent1.y + parent1.height / 2
            const parent2CenterY = parent2.y + parent2.height / 2
            const currentMatchCenterY = currentMatchPos.y + currentMatchPos.height / 2
            const connectionX = Math.max(parent1.x + parent1.width, parent2.x + parent2.width) + 30
            const midPointY = (parent1CenterY + parent2CenterY) / 2

            // Create lines: horizontal from parents + vertical connector + horizontal to current match
            lines.push(
              // Horizontal line from parent1 to connection point
              { x1: parent1.x + parent1.width, y1: parent1CenterY, x2: connectionX, y2: parent1CenterY, roundIndex },
              // Horizontal line from parent2 to connection point  
              { x1: parent2.x + parent2.width, y1: parent2CenterY, x2: connectionX, y2: parent2CenterY, roundIndex },
              // Vertical line connecting the two horizontal lines
              { x1: connectionX, y1: parent1CenterY, x2: connectionX, y2: parent2CenterY, roundIndex },
              // Horizontal line from midpoint to current match
              { x1: connectionX, y1: midPointY, x2: currentMatchPos.x, y2: currentMatchCenterY, roundIndex }
            )
          } else if (parent1) {
            // Single parent case
            const parent1CenterY = parent1.y + parent1.height / 2
            const currentMatchCenterY = currentMatchPos.y + currentMatchPos.height / 2
            lines.push(
              { x1: parent1.x + parent1.width, y1: parent1CenterY, x2: currentMatchPos.x, y2: currentMatchCenterY, roundIndex }
            )
          } else if (parent2) {
            // Single parent case (rare scenario)
            const parent2CenterY = parent2.y + parent2.height / 2
            const currentMatchCenterY = currentMatchPos.y + currentMatchPos.height / 2
            lines.push(
              { x1: parent2.x + parent2.width, y1: parent2CenterY, x2: currentMatchPos.x, y2: currentMatchCenterY, roundIndex }
            )
          }
          // If no parents found, no lines are drawn (which is correct for orphaned matches)
        })
      }
    })

    setMatchPositions(positions)
    setConnectorLines(lines)
    
    // DEBUG: Log temporal para verificar que las líneas se están creando
    console.log(`ReadOnlyBracketVisualization - Created ${lines.length} connector lines:`, lines)
  }

  const handleOpenMatchDetails = async (match: Match) => {
    setSelectedMatchForDetails(match)
    setIsDetailsDialogOpen(true)
    setMatchDetailsLoading(true)

    try {
      const playerIds = [
        match.couple1?.player1_id,
        match.couple1?.player2_id,
        match.couple2?.player1_id,
        match.couple2?.player2_id,
      ].filter(Boolean) as string[]

      const playerData: Record<string, any> = {}
      
      await Promise.all(
        playerIds.map(async (playerId) => {
          try {
            const player = await getPlayerProfile(playerId)
            if (player) {
              playerData[playerId] = player
            }
          } catch (error) {
            console.error(`Error fetching player ${playerId}:`, error)
          }
        })
      )

      setPlayerDetails(playerData)
    } catch (error) {
      console.error("Error loading match details:", error)
    } finally {
      setMatchDetailsLoading(false)
    }
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

                  {/* Footer con botón de ojo */}
                  <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 flex justify-between items-center min-h-[40px]">
                    <div className="flex items-center gap-2">
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />
                      )}
                      <span className={`text-xs font-medium ${isCompleted ? "text-emerald-700" : "text-amber-600"}`}>
                        {isCompleted ? "Completado" : "Pendiente"}
                      </span>
                    </div>

                    {/* Botón del ojo para ver detalles */}
                    {match.couple1_id !== "BYE_MARKER" && match.couple2_id !== "BYE_MARKER" && match.couple2_id !== null && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 w-7 p-0 bg-white text-blue-600 border border-blue-300 hover:bg-blue-50 rounded flex-shrink-0"
                        onClick={() => handleOpenMatchDetails(match)}
                        title="Ver detalles del partido"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal de detalles del partido */}
      {selectedMatchForDetails && (
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-center">
                Detalles del Partido - {selectedMatchForDetails.round}
              </DialogTitle>
            </DialogHeader>
            
            {matchDetailsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Cargando detalles...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Header del resultado si está completado */}
                {selectedMatchForDetails.status === "COMPLETED" && (
                  <div className="text-center">
                    <Badge variant="default" className="bg-emerald-600 text-white text-lg px-4 py-2">
                      Resultado: {selectedMatchForDetails.result_couple1} - {selectedMatchForDetails.result_couple2}
                    </Badge>
                  </div>
                )}
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                  {/* Pareja 1 */}
                  <div className={`space-y-4 p-6 rounded-lg border-2 ${
                    selectedMatchForDetails.status === "COMPLETED" && selectedMatchForDetails.winner_id === selectedMatchForDetails.couple1_id
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-gray-200 bg-white"
                  }`}>
                    <h3 className="text-lg font-semibold text-center text-gray-800">Pareja 1</h3>
                    
                    {/* Jugador 1 de la pareja 1 */}
                    {selectedMatchForDetails.couple1?.player1_id && playerDetails[selectedMatchForDetails.couple1.player1_id] && (
                      <Link 
                        href={`/ranking/${selectedMatchForDetails.couple1.player1_id}`}
                        className="block hover:bg-gray-50 p-3 rounded-lg transition-colors border border-gray-100"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage 
                              src={playerDetails[selectedMatchForDetails.couple1.player1_id].profileImage} 
                              alt={playerDetails[selectedMatchForDetails.couple1.player1_id].name}
                            />
                            <AvatarFallback>
                              {playerDetails[selectedMatchForDetails.couple1.player1_id].name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {playerDetails[selectedMatchForDetails.couple1.player1_id].name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {playerDetails[selectedMatchForDetails.couple1.player1_id].club?.name || "Sin club"}
                            </p>
                            <p className="text-sm font-medium text-blue-600">
                              {playerDetails[selectedMatchForDetails.couple1.player1_id].score || 0} pts
                            </p>
                          </div>
                        </div>
                      </Link>
                    )}
                    
                    {/* Jugador 2 de la pareja 1 */}
                    {selectedMatchForDetails.couple1?.player2_id && playerDetails[selectedMatchForDetails.couple1.player2_id] && (
                      <Link 
                        href={`/ranking/${selectedMatchForDetails.couple1.player2_id}`}
                        className="block hover:bg-gray-50 p-3 rounded-lg transition-colors border border-gray-100"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage 
                              src={playerDetails[selectedMatchForDetails.couple1.player2_id].profileImage} 
                              alt={playerDetails[selectedMatchForDetails.couple1.player2_id].name}
                            />
                            <AvatarFallback>
                              {playerDetails[selectedMatchForDetails.couple1.player2_id].name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {playerDetails[selectedMatchForDetails.couple1.player2_id].name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {playerDetails[selectedMatchForDetails.couple1.player2_id].club?.name || "Sin club"}
                            </p>
                            <p className="text-sm font-medium text-blue-600">
                              {playerDetails[selectedMatchForDetails.couple1.player2_id].score || 0} pts
                            </p>
                          </div>
                        </div>
                      </Link>
                    )}
                  </div>
                  
                  {/* VS */}
                  <div className="text-center">
                    <div className="bg-slate-900 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto text-xl font-bold">
                      VS
                    </div>
                  </div>
                  
                  {/* Pareja 2 */}
                  <div className={`space-y-4 p-6 rounded-lg border-2 ${
                    selectedMatchForDetails.status === "COMPLETED" && selectedMatchForDetails.winner_id === selectedMatchForDetails.couple2_id
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-gray-200 bg-white"
                  }`}>
                    <h3 className="text-lg font-semibold text-center text-gray-800">Pareja 2</h3>
                    
                    {/* Jugador 1 de la pareja 2 */}
                    {selectedMatchForDetails.couple2?.player1_id && playerDetails[selectedMatchForDetails.couple2.player1_id] && (
                      <Link 
                        href={`/ranking/${selectedMatchForDetails.couple2.player1_id}`}
                        className="block hover:bg-gray-50 p-3 rounded-lg transition-colors border border-gray-100"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage 
                              src={playerDetails[selectedMatchForDetails.couple2.player1_id].profileImage} 
                              alt={playerDetails[selectedMatchForDetails.couple2.player1_id].name}
                            />
                            <AvatarFallback>
                              {playerDetails[selectedMatchForDetails.couple2.player1_id].name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {playerDetails[selectedMatchForDetails.couple2.player1_id].name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {playerDetails[selectedMatchForDetails.couple2.player1_id].club?.name || "Sin club"}
                            </p>
                            <p className="text-sm font-medium text-blue-600">
                              {playerDetails[selectedMatchForDetails.couple2.player1_id].score || 0} pts
                            </p>
                          </div>
                        </div>
                      </Link>
                    )}
                    
                    {/* Jugador 2 de la pareja 2 */}
                    {selectedMatchForDetails.couple2?.player2_id && playerDetails[selectedMatchForDetails.couple2.player2_id] && (
                      <Link 
                        href={`/ranking/${selectedMatchForDetails.couple2.player2_id}`}
                        className="block hover:bg-gray-50 p-3 rounded-lg transition-colors border border-gray-100"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage 
                              src={playerDetails[selectedMatchForDetails.couple2.player2_id].profileImage} 
                              alt={playerDetails[selectedMatchForDetails.couple2.player2_id].name}
                            />
                            <AvatarFallback>
                              {playerDetails[selectedMatchForDetails.couple2.player2_id].name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {playerDetails[selectedMatchForDetails.couple2.player2_id].name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {playerDetails[selectedMatchForDetails.couple2.player2_id].club?.name || "Sin club"}
                            </p>
                            <p className="text-sm font-medium text-blue-600">
                              {playerDetails[selectedMatchForDetails.couple2.player2_id].score || 0} pts
                            </p>
                          </div>
                        </div>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
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