"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Trophy, Loader2, CheckCircle, Clock, Edit, ArrowRight } from "lucide-react"
import { fetchTournamentMatches, createKnockoutStageMatchesAction } from "@/app/api/tournaments/actions"
import MatchResultDialog from "@/components/tournament/match-result-dialog"
import { useToast } from "@/components/ui/use-toast"

interface TournamentMatchesTabProps {
  tournamentId: string
}

export default function TournamentMatchesTab({ tournamentId }: TournamentMatchesTabProps) {
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
          setMatches(result.matches)
          console.log("[TournamentMatchesTab] Fetched matches:", result.matches) // DEBUG
        } else {
          setError(result.error || "Error al cargar los partidos")
          console.error("[TournamentMatchesTab] Error fetching matches:", result.error)
        }
      } catch (err) {
        console.error("[TournamentMatchesTab] Exception while loading matches:", err)
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
    // Recargar los partidos para mostrar los resultados actualizados
    fetchTournamentMatches(tournamentId).then((result) => {
      if (result.success && result.matches) {
        setMatches(result.matches)
        console.log("[TournamentMatchesTab] Re-fetched matches after save:", result.matches) // DEBUG
      }
    })
  }

  // Verificar si todos los partidos están completados
  const allMatchesCompleted = matches.length > 0 && matches.every((match) => match.status === "COMPLETED")

  // Función para avanzar a la siguiente etapa
  const handleAdvanceToNextStage = async () => {
    setIsAdvancing(true)
    setError(null)
    try {
      console.log("Avanzando a la siguiente etapa del torneo:", tournamentId)
      const result = await createKnockoutStageMatchesAction(tournamentId)
      if (result.success) {
        toast({
          title: "Éxito",
          description: result.message || "Siguiente etapa generada correctamente.",
          variant: "default",
        })
        // Optionally, re-fetch matches or navigate, or indicate UI update needed
        // For now, we can reload matches to see new knockout matches if they are displayed here
        // Or perhaps the parent component/tab needs to re-evaluate what to show.
        // For simplicity, let's assume new matches might appear in this tab or another one.
        // We could also trigger a re-fetch of all tournament data if necessary.
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
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
        <span className="ml-2 text-slate-400">Cargando partidos...</span>
      </div>
    )
  }

  if (error) {
    return <div className="bg-rose-50 text-rose-700 p-4 rounded-lg border border-rose-200 text-center">{error}</div>
  }

  if (!matches || matches.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="bg-teal-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-teal-100">
          <Trophy className="h-8 w-8 text-teal-600" />
        </div>
        <h3 className="text-xl font-medium text-teal-500 mb-2">No hay partidos programados</h3>
        <p className="text-slate-400 max-w-md mx-auto text-sm">Aún no se han programado partidos para este torneo.</p>
      </div>
    )
  }

  // Agrupar partidos por ronda
  const matchesByRound: Record<string, any[]> = {}
  matches.forEach((match) => {
    if (!matchesByRound[match.round]) {
      matchesByRound[match.round] = []
    }
    matchesByRound[match.round].push(match)
  })
  console.log("[TournamentMatchesTab] Matches grouped by round:", matchesByRound) // DEBUG

  // Orden de las rondas
  const roundOrder = ["ZONE", "8vos", "4tos", "semi", "final"] // CORRECTED TO UPPERCASE

  // Traducción de las rondas
  const roundTranslation: Record<string, string> = {
    ZONE: "Fase de Grupos", // CORRECTED TO UPPERCASE KEY
    "8vos": "Octavos de Final",
    "4tos": "Cuartos de Final",
    semi: "Semifinales",
    final: "Final",
  }

  return (
    <div className="space-y-6">
      {roundOrder
        .filter((roundKey) => matchesByRound[roundKey]) // Use a different variable name to avoid confusion
        .map((roundKey) => {
          console.log("[TournamentMatchesTab] Processing round for display:", roundKey) // DEBUG
          console.log(
            "[TournamentMatchesTab] Data for this round (matchesByRound[roundKey]):",
            matchesByRound[roundKey],
          ) // DEBUG
          return (
            <Card key={roundKey} className="overflow-hidden border border-slate-200 bg-white">
              <div className="bg-gradient-to-r from-teal-50 to-blue-50 py-3 px-4">
                <h3 className="text-lg font-medium text-teal-600">{roundTranslation[roundKey]}</h3>
              </div>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow className="border-b border-slate-200">
                      <TableHead className="font-medium text-slate-400">Pareja 1</TableHead>
                      <TableHead className="font-medium text-slate-400 text-center">Resultado</TableHead>
                      <TableHead className="font-medium text-slate-400">Pareja 2</TableHead>
                      <TableHead className="font-medium text-slate-400">Zona</TableHead>
                      <TableHead className="font-medium text-slate-400">Estado</TableHead>
                      <TableHead className="font-medium text-slate-400 text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matchesByRound[roundKey].map((match) => (
                      <TableRow key={match.id} className="hover:bg-slate-50 border-b border-slate-100">
                        <TableCell className="font-medium text-slate-400">
                          {match.couple1_player1_name} / {match.couple1_player2_name}
                        </TableCell>
                        <TableCell className="text-center">
                          {match.status === "COMPLETED" ? (
                            <div className="flex justify-center items-center gap-1">
                              <span className="font-medium text-teal-600">{match.result_couple1}</span>
                              <span className="text-slate-300">-</span>
                              <span className="font-medium text-teal-600">{match.result_couple2}</span>
                            </div>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium text-slate-400">
                          {match.couple2_player1_name} / {match.couple2_player2_name}
                        </TableCell>
                        <TableCell className="text-slate-400">{match.zone_name || "-"}</TableCell>
                        <TableCell>
                          {match.status === "COMPLETED" ? (
                            <div className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-teal-600 mr-1" />
                              <span className="text-teal-600 text-sm">Completado</span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 text-blue-500 mr-1" />
                              <span className="text-blue-500 text-sm">Pendiente</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-emerald-200 text-emerald-700 border-emerald-200 hover:bg-emerald-400 hover:text-white hover:border-emerald-400"
                            onClick={() => handleOpenResultDialog(match)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            {match.status === "COMPLETED" ? "Editar" : "Cargar"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )
        })}

      {/* Botón para avanzar a la siguiente etapa cuando todos los partidos estén completados */}
      {allMatchesCompleted && (
        <div className="flex justify-center mt-8">
          <Button
            onClick={handleAdvanceToNextStage}
            disabled={isAdvancing || isLoading}
            className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white px-6 py-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-base"
          >
            {isAdvancing ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <ArrowRight className="mr-2 h-5 w-5" />
            )}
            Avanzar a la siguiente etapa
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
    </div>
  )
}
