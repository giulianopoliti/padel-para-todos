"use client"

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, Clock, Edit, Trophy, GitFork } from "lucide-react";
import { fetchTournamentMatches } from "@/app/api/tournaments/actions";
import MatchResultDialog from "@/components/tournament/match-result-dialog";
import { useToast } from "@/components/ui/use-toast";

interface TournamentBracketTabProps {
  tournamentId: string;
}

// Define a more specific type for matches if possible, reusing from other parts or defining here
interface Match {
  id: string;
  round: string;
  status: string;
  couple1_id?: string | null;
  couple2_id?: string | null;
  couple1_player1_name?: string;
  couple1_player2_name?: string;
  couple2_player1_name?: string;
  couple2_player2_name?: string;
  result_couple1?: string | null;
  result_couple2?: string | null;
  zone_name?: string | null;
  type?: string; // To filter for 'ELIMINATION'
  // Add any other relevant match properties
}

export default function TournamentBracketTab({ tournamentId }: TournamentBracketTabProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const loadKnockoutMatches = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await fetchTournamentMatches(tournamentId);
      if (result.success && result.matches) {
        const knockoutMatches = result.matches.filter(
          (match: any) => match.type === 'ELIMINATION' || (match.round && match.round !== 'ZONE')
        );
        setMatches(knockoutMatches);
        console.log("[TournamentBracketTab] Fetched and filtered knockout matches (set to state):", JSON.parse(JSON.stringify(knockoutMatches)));
        if (knockoutMatches.length === 0) {
          // setError("No knockout matches found for this tournament yet."); // Or just show empty state
        }
      } else {
        setError(result.error || "Error al cargar los partidos de llaves");
        console.error("[TournamentBracketTab] Error fetching matches:", result.error);
      }
    } catch (err) {
      console.error("[TournamentBracketTab] Exception while loading matches:", err);
      setError("Ocurrió un error inesperado al cargar las llaves.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadKnockoutMatches();
  }, [tournamentId]);

  const handleOpenResultDialog = (match: Match) => {
    setSelectedMatch(match);
    setIsDialogOpen(true);
  };

  const handleResultSaved = () => {
    setIsDialogOpen(false);
    toast({
      title: "Resultado Guardado",
      description: "El resultado del partido ha sido actualizado.",
    });
    loadKnockoutMatches(); // Reload matches to show updated results
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12 p-6">
        <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
        <span className="ml-2 text-slate-400">Cargando llaves...</span>
      </div>
    );
  }

  if (error) {
    return <div className="bg-rose-50 text-rose-700 p-4 rounded-lg border border-rose-200 text-center m-6">{error}</div>;
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-8 p-6">
        <div className="bg-purple-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-100">
          <GitFork className="h-8 w-8 text-purple-600" />
        </div>
        <h3 className="text-xl font-medium text-purple-500 mb-2">No hay llaves generadas</h3>
        <p className="text-slate-400 max-w-md mx-auto text-sm">
          Aún no se han generado las llaves para la etapa de eliminación directa o no hay partidos de este tipo.
        </p>
      </div>
    );
  }

  // Group matches by round (e.g., "8VOS", "4VOS", "FINAL")
  const matchesByRound: Record<string, Match[]> = {};
  const roundOrder: string[] = [];

  matches.forEach((match) => {
    const roundKey = match.round || "Unknown Round";
    if (!matchesByRound[roundKey]) {
      matchesByRound[roundKey] = [];
      if (!roundOrder.includes(roundKey)) { // Maintain order of appearance for rounds
          roundOrder.push(roundKey);
      }
    }
    matchesByRound[roundKey].push(match);
  });
  
  console.log("[TournamentBracketTab] Calculated matchesByRound:", JSON.parse(JSON.stringify(matchesByRound)));

  // Define a preferred order for knockout rounds, others will be appended
  const preferredRoundOrder = ["32VOS", "16VOS", "8VOS", "4TOS", "SEMIFINAL", "FINAL"];
  roundOrder.sort((a, b) => {
      const indexA = preferredRoundOrder.indexOf(a);
      const indexB = preferredRoundOrder.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b); // both not in preferred, sort alphabetically
      if (indexA === -1) return 1; // a not in preferred, b is: b comes first
      if (indexB === -1) return -1; // b not in preferred, a is: a comes first
      return indexA - indexB; // both in preferred, sort by preferred order
  });

  console.log("[TournamentBracketTab] Calculated and sorted roundOrder:", roundOrder);

  const roundTranslation: Record<string, string> = {
    "32VOS": "Ronda de 64", // Or 32avos de Final
    "16VOS": "Ronda de 32", // Or 16avos de Final
    "8VOS": "Octavos de Final",
    "4TOS": "Cuartos de Final",
    "SEMIFINAL": "Semifinales",
    "FINAL": "Final",
    // Add other translations if necessary
  };

  return (
    <div className="space-y-6 p-6">
      {roundOrder.map((roundKey) => {
        console.log(`[TournamentBracketTab] Rendering Card for roundKey: ${roundKey}, number of matches: ${matchesByRound[roundKey]?.length || 0}`);
        return (
          <Card key={roundKey} className="overflow-hidden border border-slate-200 bg-white">
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 py-3 px-4">
              <h3 className="text-lg font-medium text-purple-600">
                {roundTranslation[roundKey] || roundKey}
              </h3>
            </div>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-b border-slate-200">
                    <TableHead className="font-medium text-slate-400">Pareja 1</TableHead>
                    <TableHead className="font-medium text-slate-400 text-center">Resultado</TableHead>
                    <TableHead className="font-medium text-slate-400">Pareja 2</TableHead>
                    <TableHead className="font-medium text-slate-400">Estado</TableHead>
                    <TableHead className="font-medium text-slate-400 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matchesByRound[roundKey].map((match) => {
                    console.log(`[TournamentBracketTab] Rendering TableRow for match:`, JSON.parse(JSON.stringify(match)));
                    return (
                      <TableRow key={match.id} className="hover:bg-slate-50 border-b border-slate-100">
                        <TableCell className="font-medium text-slate-400">
                          {match.couple1_player1_name && match.couple1_player2_name 
                            ? `${match.couple1_player1_name} / ${match.couple1_player2_name}`
                            : (match.couple1_id === 'BYE_MARKER' ? 'BYE' : 'Pareja 1 TBD')}
                        </TableCell>
                        <TableCell className="text-center">
                          {match.status === "COMPLETED" ? (
                            <div className="flex justify-center items-center gap-1">
                              <span className="font-medium text-purple-600">{match.result_couple1 || '-'}</span>
                              <span className="text-slate-300">-</span>
                              <span className="font-medium text-purple-600">{match.result_couple2 || '-'}</span>
                            </div>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium text-slate-400">
                          {match.couple2_player1_name && match.couple2_player2_name 
                            ? `${match.couple2_player1_name} / ${match.couple2_player2_name}`
                            : (match.couple2_id === null ? 'BYE' : (match.couple2_id === 'BYE_MARKER' ? 'BYE' : 'Pareja 2 TBD'))}
                        </TableCell>
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
                            className="bg-indigo-200 text-indigo-700 border-indigo-200 hover:bg-indigo-400 hover:text-white hover:border-indigo-400"
                            onClick={() => handleOpenResultDialog(match)}
                            disabled={match.couple1_id === 'BYE_MARKER' || match.couple2_id === 'BYE_MARKER' || match.couple2_id === null} // Disable if it's a bye
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            {match.status === "COMPLETED" ? "Editar" : "Cargar"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })}

      {selectedMatch && (
        <MatchResultDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          match={selectedMatch}
          onSave={handleResultSaved}
        />
      )}
    </div>
  );
} 