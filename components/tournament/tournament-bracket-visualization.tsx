"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Trophy, GitFork, ArrowRight, CheckCircle, Clock } from "lucide-react"
import { fetchTournamentMatches, advanceToNextStageAction } from "@/app/api/tournaments/actions"
import { useToast } from "@/components/ui/use-toast"
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
}

export default function TournamentBracketVisualization({ tournamentId }: TournamentBracketVisualizationProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAdvancing, setIsAdvancing] = useState(false)
  const [matches, setMatches] = useState<Match[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [allMatchesCompleted, setAllMatchesCompleted] = useState(false)
  const { toast } = useToast()

  const loadKnockoutMatches = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await fetchTournamentMatches(tournamentId)
      if (result.success && result.matches) {
        const knockoutMatches = result.matches.filter(
          (match: any) => match.type === "ELIMINATION" || (match.round && match.round !== "ZONE"),
        )

        // Ordenar los partidos por ID o fecha de creación para mantener el orden consistente
        const sortedMatches = [...knockoutMatches].sort((a, b) => {
          // Primero ordenar por ronda
          const roundOrder = ["32VOS", "16VOS", "8VOS", "4TOS", "SEMIFINAL", "FINAL"]
          const roundA = roundOrder.indexOf(a.round)
          const roundB = roundOrder.indexOf(b.round)

          if (roundA !== roundB) return roundA - roundB

          // Luego por ID o fecha de creación para mantener orden consistente dentro de la misma ronda
          return a.id.localeCompare(b.id)
        })

        setMatches(sortedMatches)

        // Check if all matches in the current round are completed
        const currentRound = getCurrentRound(sortedMatches)
        const currentRoundMatches = sortedMatches.filter((match: Match) => match.round === currentRound)
        const allCompleted = currentRoundMatches.every((match: Match) => match.status === "COMPLETED")
        setAllMatchesCompleted(allCompleted && currentRoundMatches.length > 0)
      } else {
        setError(result.error || "Error al cargar los partidos de llaves")
      }
    } catch (err) {
      console.error("Error al cargar partidos:", err)
      setError("Ocurrió un error inesperado al cargar las llaves.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadKnockoutMatches()
  }, [tournamentId])

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
    loadKnockoutMatches() // Reload matches to show updated results
  }

  const handleAdvanceToNextStage = async () => {
    setIsAdvancing(true)
    try {
      const result = await advanceToNextStageAction(tournamentId)
      if (result.success) {
        toast({
          title: "Avance Exitoso",
          description: result.message || "Se ha avanzado a la siguiente etapa del torneo.",
        })
        loadKnockoutMatches() // Reload matches to show the new stage
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

  // Helper function to get the current round
  const getCurrentRound = (matchesData: Match[]) => {
    const rounds = ["32VOS", "16VOS", "8VOS", "4TOS", "SEMIFINAL", "FINAL"]
    for (const round of rounds) {
      const roundMatches = matchesData.filter((match) => match.round === round)
      if (roundMatches.length > 0 && roundMatches.some((match) => match.status !== "COMPLETED")) {
        return round
      }
    }
    // If all matches are completed, return the last round that has matches
    for (const round of [...rounds].reverse()) {
      if (matchesData.some((match) => match.round === round)) {
        return round
      }
    }
    return ""
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

  // Group matches by round
  const matchesByRound: Record<string, Match[]> = {}
  matches.forEach((match) => {
    const round = match.round || "Unknown"
    if (!matchesByRound[round]) {
      matchesByRound[round] = []
    }
    matchesByRound[round].push(match)
  })

  // Define round order and translations
  const roundOrder = ["32VOS", "16VOS", "8VOS", "4TOS", "SEMIFINAL", "FINAL"]
  const roundTranslation: Record<string, string> = {
    "32VOS": "32vos de Final",
    "16VOS": "16vos de Final",
    "8VOS": "8vos de Final",
    "4TOS": "4tos de Final",
    SEMIFINAL: "Semifinales",
    FINAL: "Final",
  }

  // Filtrar solo las rondas que tienen partidos
  const activeRounds = roundOrder.filter((round) => matchesByRound[round] && matchesByRound[round].length > 0)

  return (
    <div className="space-y-8">
      {/* Selector de vista */}
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

      {/* Visualización de llaves */}
      <div className="tournament-bracket px-4 overflow-x-auto">
        <div className="flex flex-nowrap min-w-full">
          {activeRounds.map((round, roundIndex) => (
            <div key={round} className="flex-1 min-w-[250px] px-2">
              <div className="text-center mb-4">
                <h3 className="text-lg font-medium text-emerald-600">{roundTranslation[round] || round}</h3>
              </div>

              <div className="relative">
                {matchesByRound[round].map((match, matchIndex) => {
                  const isCompleted = match.status === "COMPLETED"
                  const isBye =
                    match.couple1_id === "BYE_MARKER" || match.couple2_id === "BYE_MARKER" || match.couple2_id === null

                  // Determinar si este partido tiene un ganador que avanza a la siguiente ronda
                  const hasNextRound = roundIndex < activeRounds.length - 1
                  const isWinner = isCompleted && hasNextRound

                  // Calcular la altura del espacio entre partidos
                  const matchHeight = 120 // altura aproximada de cada partido
                  const gapHeight = matchIndex < matchesByRound[round].length - 1 ? 40 : 0

                  return (
                    <div key={match.id} className="relative mb-10">
                      {/* Tarjeta del partido */}
                      <div
                        className={`bg-emerald-50 rounded-md overflow-hidden border ${
                          isCompleted ? "border-emerald-200" : "border-slate-200"
                        }`}
                      >
                        {/* Pareja 1 */}
                        <div
                          className={`p-3 border-b ${
                            isCompleted && match.winner_id === match.couple1_id
                              ? "bg-emerald-100 border-emerald-200"
                              : "border-slate-100"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="font-medium text-slate-700 truncate max-w-[180px]">
                              {match.couple1_player1_name && match.couple1_player2_name
                                ? `${match.couple1_player1_name} / ${match.couple1_player2_name}`
                                : match.couple1_id === "BYE_MARKER"
                                  ? "BYE"
                                  : "Por determinar"}
                            </div>
                            {isCompleted && <div className="text-emerald-600 font-bold">{match.result_couple1}</div>}
                          </div>
                        </div>

                        {/* Pareja 2 */}
                        <div
                          className={`p-3 ${
                            isCompleted && match.winner_id === match.couple2_id
                              ? "bg-emerald-100 border-emerald-200"
                              : ""
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="font-medium text-slate-700 truncate max-w-[180px]">
                              {match.couple2_player1_name && match.couple2_player2_name
                                ? `${match.couple2_player1_name} / ${match.couple2_player2_name}`
                                : match.couple2_id === "BYE_MARKER" || match.couple2_id === null
                                  ? "BYE"
                                  : "Por determinar"}
                            </div>
                            {isCompleted && <div className="text-emerald-600 font-bold">{match.result_couple2}</div>}
                          </div>
                        </div>

                        {/* Estado y acciones */}
                        <div className="p-2 bg-white border-t border-slate-100 flex justify-between items-center">
                          <div className="flex items-center">
                            {isCompleted ? (
                              <CheckCircle className="h-4 w-4 text-emerald-500 mr-1" />
                            ) : (
                              <Clock className="h-4 w-4 text-amber-500 mr-1" />
                            )}
                            <span className={`text-xs ${isCompleted ? "text-emerald-500" : "text-amber-500"}`}>
                              {isCompleted ? "Completado" : "Pendiente"}
                            </span>
                          </div>

                          {!isBye && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 px-2 bg-white border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                              onClick={() => handleOpenResultDialog(match)}
                            >
                              Editar
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Línea conectora para el ganador */}
                      {isWinner && (
                        <div className="connector-line">
                          <div
                            className="absolute right-0 top-1/2 w-8 h-0.5 bg-emerald-500"
                            style={{ transform: "translateY(-50%)" }}
                          />
                        </div>
                      )}

                      {/* Línea vertical para conectar partidos */}
                      {isWinner && matchIndex % 2 === 0 && matchIndex + 1 < matchesByRound[round].length && (
                        <div
                          className="absolute right-0 w-0.5 bg-emerald-500"
                          style={{
                            top: "50%",
                            height: `${matchHeight + gapHeight}px`,
                            transform: "translateX(8px)",
                          }}
                        />
                      )}

                      {/* Línea horizontal para el partido siguiente */}
                      {isWinner && matchIndex % 2 === 1 && (
                        <div
                          className="absolute right-0 top-1/2 w-8 h-0.5 bg-emerald-500"
                          style={{ transform: "translateY(-50%) translateX(8px)" }}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Botón para avanzar a la siguiente etapa */}
      {allMatchesCompleted && !isAdvancing && (
        <div className="flex justify-center mt-8">
          <Button
            onClick={handleAdvanceToNextStage}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-6 rounded-full shadow-md hover:shadow-lg transition-all"
            disabled={isAdvancing}
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

      {/* Diálogo para cargar resultados */}
      {selectedMatch && (
        <MatchResultDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          match={selectedMatch}
          onSave={handleResultSaved}
        />
      )}

      <style jsx>{`
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
