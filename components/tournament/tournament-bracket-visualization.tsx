"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { fetchTournamentMatches } from "@/app/api/tournaments/actions"
import { getTournamentById } from "@/app/api/tournaments/actions"
import { advanceToNextStageAction } from "@/app/api/tournaments/actions"
import { updateMatchResult } from "@/app/api/tournaments/actions"
import { generateEliminationBracketAction, checkZonesReadyForElimination } from "@/app/api/tournaments/actions"
import { getPlayerProfile } from "@/app/api/users"
import { Loader2, GitFork, CheckCircle, Clock, Trophy, ArrowRight, Settings, Users, Eye } from "lucide-react"
import Link from "next/link"
import MatchResultDialog from "@/components/tournament/match-result-dialog"
import SeedingExampleDemo from "@/components/tournament/seeding-example-demo"
import MatchStatusBadge from "@/components/tournament/match-status-badge"
import { Round } from "@/types"
import type { Database } from '@/database.types'

type MatchStatus = Database["public"]["Enums"]["match_status"]

// Import Match type from match-result-dialog.tsx
interface Match {
  id: string
  round: string
  status: "PENDING" | "IN_PROGRESS" | "FINISHED" | "CANCELED"
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

// Extended match type for our visualization needs
interface BracketMatch extends Match {
  court?: string | null
  type?: string
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
  match: BracketMatch
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

interface TournamentBracketVisualizationProps {
  tournamentId: string
}

export default function TournamentBracketVisualization({ tournamentId }: TournamentBracketVisualizationProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAdvancing, setIsAdvancing] = useState(false)
  const [isGeneratingBracket, setIsGeneratingBracket] = useState(false)
  const [matches, setMatches] = useState<BracketMatch[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedMatch, setSelectedMatch] = useState<BracketMatch | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedMatchForDetails, setSelectedMatchForDetails] = useState<BracketMatch | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [matchDetailsLoading, setMatchDetailsLoading] = useState(false)
  const [playerDetails, setPlayerDetails] = useState<Record<string, any>>({})
  const [isTournamentFinished, setIsTournamentFinished] = useState(false)
  const [currentTournamentRound, setCurrentTournamentRound] = useState<string>("")
  const [matchPositions, setMatchPositions] = useState<MatchPosition[]>([])
  const [connectorLines, setConnectorLines] = useState<ConnectorLine[]>([])
  const [zonesReady, setZonesReady] = useState<{ready: boolean; message: string; totalCouples?: number} | null>(null)
  const [viewportWidth, setViewportWidth] = useState<number>(1200) // Default fallback
  const bracketRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Update viewport width on mount and resize
  useEffect(() => {
    const updateViewportWidth = () => {
      setViewportWidth(window.innerWidth)
    }
    
    // Set initial width
    updateViewportWidth()
    
    // Add resize listener
    window.addEventListener('resize', updateViewportWidth)
    return () => window.removeEventListener('resize', updateViewportWidth)
  }, [])

  // Responsive sizing based on screen size - COMPACT for better bracket fit
  const isMobile = viewportWidth < 768
  const matchSpacing = isMobile ? 30 : 40  // Reduced spacing for more compact view
  const matchHeight = isMobile ? 95 : 110  // Reduced height for compactness
  const columnWidth = isMobile ? 180 : 250  // Reduced width for better fit
  const matchWidth = isMobile ? 165 : 230   // Reduced width for more compact display

  // Calculate available width for bracket (accounting for sidebar and padding)
  const availableWidth = viewportWidth - (viewportWidth > 1024 ? 280 : 40)

  // Helper function to format player names with initials
  const formatPlayerName = (fullName: string | undefined) => {
    if (!fullName) return ""
    const nameParts = fullName.trim().split(" ")
    if (nameParts.length < 2) return fullName // Return as-is if not enough parts
    
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(" ") // Handle multiple last names
    const firstInitial = firstName.charAt(0).toUpperCase()
    return `${firstInitial}. ${lastName}`
  }

  // Helper function to format couple names
  const formatCoupleNames = (player1Name: string | undefined, player2Name: string | undefined) => {
    if (!player1Name || !player2Name) return ""
    const player1 = formatPlayerName(player1Name)
    const player2 = formatPlayerName(player2Name)
    return `${player1} / ${player2}`
  }

  const checkZonesStatus = async () => {
    try {
      const zonesStatus = await checkZonesReadyForElimination(tournamentId)
      setZonesReady(zonesStatus)
    } catch (error) {
      console.error("Error checking zones status:", error)
      setZonesReady({ ready: false, message: "Error al verificar el estado de las zonas" })
    }
  }

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

        // Transform API response to BracketMatch type
        const transformedMatches: BracketMatch[] = knockoutMatches.map((match: any) => ({
          id: match.id,
          round: match.round,
          status: match.status,
          couple1_id: match.couple1_id,
          couple2_id: match.couple2_id,
          couple1_player1_name: match.couple1_player1_name,
          couple1_player2_name: match.couple1_player2_name,
          couple2_player1_name: match.couple2_player1_name,
          couple2_player2_name: match.couple2_player2_name,
          result_couple1: match.result_couple1,
          result_couple2: match.result_couple2,
          winner_id: match.winner_id,
          zone_name: match.zone_name,
          order: match.order,
          court: match.court,
          type: match.type,
          couple1: match.couple1 ? {
            id: match.couple1.id,
            player1_id: match.couple1.player1_id,
            player2_id: match.couple1.player2_id,
            player1_details: match.couple1.player1_details,
            player2_details: match.couple1.player2_details
          } : undefined,
          couple2: match.couple2 ? {
            id: match.couple2.id,
            player1_id: match.couple2.player1_id,
            player2_id: match.couple2.player2_id,
            player1_details: match.couple2.player1_details,
            player2_details: match.couple2.player2_details
          } : undefined
        }))

        const sortedMatches = [...transformedMatches].sort((a: BracketMatch, b: BracketMatch) => {
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

          const orderA = a.order ?? Number.POSITIVE_INFINITY
          const orderB = b.order ?? Number.POSITIVE_INFINITY
          return orderA - orderB
        })

        setMatches(sortedMatches)

        const currentRoundVal: string = getCurrentRound(sortedMatches)
        setCurrentTournamentRound(currentRoundVal)

        if (!isTournamentFinished && currentRoundVal === "FINAL") {
          const finalRoundMatches = sortedMatches.filter((match: BracketMatch) => match.round === "FINAL")
          if (finalRoundMatches.length > 0 && finalRoundMatches.every((match: BracketMatch) => match.status === "FINISHED")) {
            setIsTournamentFinished(true)
          }
        }

        // Si no hay matches eliminatorios, verificar estado de las zonas
        if (knockoutMatches.length === 0) {
          await checkZonesStatus()
        }
      } else {
        setError(result.error || "Error al cargar los partidos de llaves")
        // También verificar zonas si hay error cargando matches
        await checkZonesStatus()
      }
    } catch (err) {
      console.error("Error al cargar datos del torneo y partidos:", err)
      setError("Ocurrió un error inesperado al cargar las llaves.")
      await checkZonesStatus()
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateBracket = async () => {
    if (!zonesReady?.ready) {
      toast({
        variant: "destructive",
        title: "Error",
        description: zonesReady?.message || "Las zonas no están listas para generar el bracket"
      })
      return
    }

    try {
      setIsGeneratingBracket(true)
      
      console.log("Generando bracket eliminatorio...")
      const result = await generateEliminationBracketAction(tournamentId)
      
      if (result.success) {
        toast({
          title: "¡Bracket generado exitosamente!",
          description: `Se crearon ${result.matches?.length || 0} matches eliminatorios con ${result.seededCouples?.length || 0} parejas clasificadas.`
        })
        
        // Recargar los datos para mostrar el nuevo bracket
        await loadTournamentData()
      } else {
        toast({
          variant: "destructive",
          title: "Error generando bracket",
          description: result.error || "Error desconocido al generar el bracket"
        })
      }
    } catch (error) {
      console.error("Error generating bracket:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error inesperado al generar el bracket eliminatorio"
      })
    } finally {
      setIsGeneratingBracket(false)
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

    const matchesByRound: Record<string, BracketMatch[]> = {}
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

          // DEBUG: Log para ver qué está pasando
          console.log(`Match ${match.id} (${round}):`, {
            couple1_id: match.couple1_id,
            couple2_id: match.couple2_id,
            parent1_found: !!parent1,
            parent2_found: !!parent2,
            prevRoundPositions_length: prevRoundPositions.length,
            prevRoundWinners: prevRoundPositions.map(p => ({ id: p.match.id, winner_id: p.match.winner_id }))
          })

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

            // Create lines directly (simplified approach like read-only version)
            lines.push(
              { x1: parent1.x + parent1.width, y1: parent1CenterY, x2: connectionX, y2: parent1CenterY, roundIndex },
              { x1: parent2.x + parent2.width, y1: parent2CenterY, x2: connectionX, y2: parent2CenterY, roundIndex },
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
    
    // DEBUG: Log para ver cuántas líneas se crearon
    console.log(`Created ${lines.length} connector lines:`, lines)
  }

  const handleOpenResultDialog = (match: BracketMatch) => {
    setSelectedMatch(match)
    setIsDialogOpen(true)
  }

  const handleOpenMatchDetails = async (match: BracketMatch) => {
    setSelectedMatchForDetails(match)
    setIsDetailsDialogOpen(true)
    setMatchDetailsLoading(true)
    
    // Obtener información detallada de todos los jugadores del partido
    const playerIds = []
    if (match.couple1?.player1_id) playerIds.push(match.couple1.player1_id)
    if (match.couple1?.player2_id) playerIds.push(match.couple1.player2_id)
    if (match.couple2?.player1_id) playerIds.push(match.couple2.player1_id)
    if (match.couple2?.player2_id) playerIds.push(match.couple2.player2_id)
    
    const newPlayerDetails: Record<string, any> = {}
    
    try {
      await Promise.all(
        playerIds.map(async (playerId) => {
          const profile = await getPlayerProfile(playerId)
          if (profile) {
            newPlayerDetails[playerId] = profile
          }
        })
      )
      setPlayerDetails(newPlayerDetails)
    } catch (error) {
      console.error("Error fetching player details:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los detalles de los jugadores"
      })
    } finally {
      setMatchDetailsLoading(false)
    }
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

  const getCurrentRound = (matchesData: BracketMatch[]) => {
    const rounds = ["32VOS", "16VOS", "8VOS", "4TOS", "SEMIFINAL", "FINAL"]
    for (const round of rounds) {
      const roundMatches = matchesData.filter((match) => match.round === round)
      if (roundMatches.length > 0 && roundMatches.some((match) => match.status !== "FINISHED")) {
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
    const currentRoundMatches = matches.filter((match: BracketMatch) => match.round === currentTournamentRound)
    return currentRoundMatches.length > 0 && currentRoundMatches.every((match: BracketMatch) => match.status === "FINISHED")
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
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-16">
          <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <GitFork className="h-10 w-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Generar Bracket Eliminatorio</h3>
          <p className="text-slate-500 max-w-md mx-auto mb-8">
            Las llaves eliminatorias se generarán con todos los participantes de las zonas usando nuestro algoritmo de seeding optimizado.
          </p>

          {/* Estado de las zonas */}
          {zonesReady && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 text-left">
              <div className="flex items-center gap-3 mb-4">
                <Users className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium text-gray-900">Estado de las Zonas</h4>
              </div>
              
              <div className="flex items-center gap-2 mb-4">
                {zonesReady.ready ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Clock className="h-4 w-4 text-amber-500" />
                )}
                <span className={`text-sm ${zonesReady.ready ? 'text-green-700' : 'text-amber-600'}`}>
                  {zonesReady.message}
                </span>
              </div>

              {zonesReady.totalCouples && zonesReady.totalCouples > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="text-sm text-blue-800">
                    <strong>{zonesReady.totalCouples} parejas</strong> participarán en el bracket eliminatorio
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    Tamaño del bracket: <strong>{Math.pow(2, Math.ceil(Math.log2(Math.max(2, zonesReady.totalCouples))))}</strong> posiciones
                    {Math.pow(2, Math.ceil(Math.log2(Math.max(2, zonesReady.totalCouples)))) - zonesReady.totalCouples > 0 && (
                      <span className="ml-2">
                        ({Math.pow(2, Math.ceil(Math.log2(Math.max(2, zonesReady.totalCouples)))) - zonesReady.totalCouples} BYEs automáticos)
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Características del algoritmo */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8 text-left">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="h-5 w-5 text-gray-600" />
              <h4 className="font-medium text-gray-900">Algoritmo de Seeding</h4>
            </div>
            <ul className="text-sm text-gray-700 space-y-2">
              <li className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>Agrupamiento por posición:</strong> Todos los primeros de zona juntos, luego segundos, etc.</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>Ordenamiento inteligente:</strong> Por zona alfabética y puntos obtenidos</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>Emparejamiento tradicional:</strong> Seed 1 vs Seed N, Seed 2 vs Seed N-1</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>BYEs automáticos:</strong> Para números no potencia de 2</span>
              </li>
            </ul>
          </div>

          {/* Ejemplo del algoritmo */}
          <div className="flex justify-center">
            <SeedingExampleDemo totalCouples={zonesReady?.totalCouples || 21} />
          </div>

          {/* Botón de generar */}
          <Button
            onClick={handleGenerateBracket}
            disabled={!zonesReady?.ready || isGeneratingBracket}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg shadow-sm"
            size="lg"
          >
            {isGeneratingBracket ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Generando Bracket...
              </>
            ) : (
              <>
                <Trophy className="h-5 w-5 mr-2" />
                Generar Bracket Eliminatorio
              </>
            )}
          </Button>

          {!zonesReady?.ready && zonesReady && (
            <p className="text-sm text-amber-600 mt-4">
              Complete todos los matches de zona antes de generar el bracket
            </p>
          )}
        </div>
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

  const matchesByRound: Record<string, BracketMatch[]> = {}
  matches.forEach((match) => {
    const round = match.round || "Unknown"
    if (!matchesByRound[round]) {
      matchesByRound[round] = []
    }
    matchesByRound[round].push(match)
  })

  const activeRoundsForLayout = roundOrder.filter((round) => matchesByRound[round] && matchesByRound[round].length > 0)

  // Dynamic width calculation to fit viewport
  const baseWidth = activeRoundsForLayout.length * columnWidth
  const totalWidthForLayout = Math.min(baseWidth, availableWidth - 40) // Ensure it fits with some margin
  
  const allMatches = Object.values(matchesByRound).flat()
  const maxMatchesInRound = Math.max(...activeRoundsForLayout.map((round) => matchesByRound[round].length))
  const calculatedTotalHeightForLayout = Math.max(600, 60 + maxMatchesInRound * (matchHeight + matchSpacing) + 100)

  return (
    <div className="flex flex-col">
      <div
        ref={bracketRef}
        className="tournament-bracket overflow-x-auto overflow-y-auto bg-gray-50 p-2 lg:p-4"
        style={{ 
          height: 'calc(100vh - 280px)',
          minHeight: '400px',
          maxWidth: '100%',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <div
          className="relative py-4 lg:py-6"
          style={{ 
            width: totalWidthForLayout, 
            minHeight: calculatedTotalHeightForLayout,
            minWidth: 'fit-content'
          }}
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
            const isCompleted = match.status === "FINISHED"
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
                      <div className="font-medium text-slate-900 text-sm max-w-[180px] truncate">
                        {match.couple1_player1_name && match.couple1_player2_name
                          ? formatCoupleNames(match.couple1_player1_name, match.couple1_player2_name)
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
                      <div className="font-medium text-slate-900 text-sm max-w-[180px] truncate">
                        {match.couple2_player1_name && match.couple2_player2_name
                          ? formatCoupleNames(match.couple2_player1_name, match.couple2_player2_name)
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
                  <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 flex justify-between items-center min-h-[40px]">
                    <div className="flex items-center gap-2">
                      <MatchStatusBadge 
                        status={match.status} 
                        court={match.court}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      {!isBye && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 px-2 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 rounded flex-shrink-0"
                          onClick={() => handleOpenResultDialog(match)}
                        >
                          {isCompleted ? "Editar" : "Cargar"}
                        </Button>
                      )}
                      
                      {/* Botón del ojo para ver detalles */}
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 w-7 p-0 bg-white text-blue-600 border border-blue-300 hover:bg-blue-50 rounded flex-shrink-0"
                        onClick={() => handleOpenMatchDetails(match)}
                        title="Ver detalles del partido"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {allCurrentRoundMatchesCompleted() && !isAdvancing && !isTournamentFinished && (
        <div className="flex justify-center p-6 border-t border-gray-200 bg-white">
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
                {selectedMatchForDetails.status === "FINISHED" && (
                  <div className="text-center">
                    <Badge variant="default" className="bg-emerald-600 text-white text-lg px-4 py-2">
                      Resultado: {selectedMatchForDetails.result_couple1} - {selectedMatchForDetails.result_couple2}
                    </Badge>
                  </div>
                )}
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                  {/* Pareja 1 */}
                  <div className={`space-y-4 p-6 rounded-lg border-2 ${
                    selectedMatchForDetails.status === "FINISHED" && selectedMatchForDetails.winner_id === selectedMatchForDetails.couple1_id
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
                    selectedMatchForDetails.status === "FINISHED" && selectedMatchForDetails.winner_id === selectedMatchForDetails.couple2_id
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
                
                {/* Información adicional del partido */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Ronda</p>
                    <p className="font-semibold">{selectedMatchForDetails.round}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Estado</p>
                    <Badge variant={selectedMatchForDetails.status === "FINISHED" ? "default" : "secondary"}>
                      {selectedMatchForDetails.status === "FINISHED" ? "Completado" : "Pendiente"}
                    </Badge>
                  </div>
                  {selectedMatchForDetails.zone_name && (
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Zona</p>
                      <p className="font-semibold">{selectedMatchForDetails.zone_name}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
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