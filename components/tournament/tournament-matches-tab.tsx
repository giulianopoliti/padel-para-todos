"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Trophy, Loader2, CheckCircle, Clock, Edit } from "lucide-react"
import { fetchTournamentMatches } from "@/app/api/tournaments/actions"
import MatchResultDialog from "@/components/tournament/match-result-dialog"

interface TournamentMatchesTabProps {
  tournamentId: string
}

export default function TournamentMatchesTab({ tournamentId }: TournamentMatchesTabProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [matches, setMatches] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    const loadMatches = async () => {
      try {
        setIsLoading(true)
        const result = await fetchTournamentMatches(tournamentId)
        if (result.success && result.matches) {
          setMatches(result.matches)
          console.log("[TournamentMatchesTab] Fetched matches:", result.matches); // DEBUG
        } else {
          setError(result.error || "Error al cargar los partidos")
          console.error("[TournamentMatchesTab] Error fetching matches:", result.error);
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
        console.log("[TournamentMatchesTab] Re-fetched matches after save:", result.matches); // DEBUG
      }
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
        <span className="ml-2 text-slate-600">Cargando partidos...</span>
      </div>
    )
  }

  if (error) {
    return <div className="bg-rose-50 text-rose-700 p-4 rounded-lg border border-rose-200 text-center">{error}</div>
  }

  if (!matches || matches.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="bg-emerald-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
          <Trophy className="h-8 w-8 text-emerald-600" />
        </div>
        <h3 className="text-xl font-medium text-emerald-700 mb-2">No hay partidos programados</h3>
        <p className="text-slate-500 max-w-md mx-auto text-sm">Aún no se han programado partidos para este torneo.</p>
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
  console.log("[TournamentMatchesTab] Matches grouped by round:", matchesByRound); // DEBUG

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
          console.log("[TournamentMatchesTab] Processing round for display:", roundKey); // DEBUG
          console.log("[TournamentMatchesTab] Data for this round (matchesByRound[roundKey]):", matchesByRound[roundKey]); // DEBUG
          return (
          <Card key={roundKey} className="overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-emerald-50 to-violet-50 py-3 px-4">
              <h3 className="text-lg font-medium text-slate-800">{roundTranslation[roundKey]}</h3>
            </div>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-b border-slate-200">
                    <TableHead className="font-medium text-slate-500">Pareja 1</TableHead>
                    <TableHead className="font-medium text-slate-500 text-center">Resultado</TableHead>
                    <TableHead className="font-medium text-slate-500">Pareja 2</TableHead>
                    <TableHead className="font-medium text-slate-500">Zona</TableHead>
                    <TableHead className="font-medium text-slate-500">Estado</TableHead>
                    <TableHead className="font-medium text-slate-500 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matchesByRound[roundKey].map((match) => (
                    <TableRow key={match.id} className="hover:bg-slate-50 border-b border-slate-100">
                      <TableCell className="font-medium text-slate-700">
                        {match.couple1_player1_name} / {match.couple1_player2_name}
                      </TableCell>
                      <TableCell className="text-center">
                        {match.status === "COMPLETED" ? (
                          <div className="flex justify-center items-center gap-1">
                            <span className="font-medium text-emerald-700">{match.result_couple1}</span>
                            <span className="text-slate-400">-</span>
                            <span className="font-medium text-emerald-700">{match.result_couple2}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-slate-700">
                        {match.couple2_player1_name} / {match.couple2_player2_name}
                      </TableCell>
                      <TableCell className="text-slate-700">{match.zone_name || "-"}</TableCell>
                      <TableCell>
                        {match.status === "COMPLETED" ? (
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-emerald-600 mr-1" />
                            <span className="text-emerald-700 text-sm">Completado</span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 text-amber-600 mr-1" />
                            <span className="text-amber-700 text-sm">Pendiente</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
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
        )})}

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
