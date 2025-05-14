"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Typography,
  CircularProgress,
} from "@mui/material"
import { useToast } from "@/components/ui/use-toast"
import type { MatchInfo, Standing, CoupleInfo } from "@/components/tournament/club/types"
import { generateTournamentMatches, updateBracketAfterMatchCompletion } from "@/utils/bracket-generator"

interface TournamentManagementProps {
  tournamentId: string
  coupleInscriptions: CoupleInfo[]
  tournamentStatus: string
}

const TournamentManagement: React.FC<TournamentManagementProps> = ({ tournamentId, coupleInscriptions, tournamentStatus }) => {
  const [allMatches, setAllMatches] = useState<MatchInfo[]>([])
  const [zoneAMatches, setZoneAMatches] = useState<MatchInfo[]>([])
  const [zoneBMatches, setZoneBMatches] = useState<MatchInfo[]>([])
  const [bracketMatches, setBracketMatches] = useState<MatchInfo[]>([])
  const [zoneAStandings, setZoneAStandings] = useState<Standing[]>([])
  const [zoneBStandings, setZoneBStandings] = useState<Standing[]>([])
  const [resultDialogOpen, setResultDialogOpen] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<MatchInfo | null>(null)
  const [score1, setScore1] = useState("")
  const [score2, setScore2] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isStartingTournament, setIsStartingTournament] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (tournamentId) {
      fetchTournamentData()
    }
  }, [tournamentId])

  const fetchTournamentData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/matches`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      const fetchedMatches: MatchInfo[] = data.matches

      setAllMatches(fetchedMatches)

      // Filter matches by round
      const zoneA = fetchedMatches.filter((match) => match.round === "ZONE" && match.zone === "A")
      const zoneB = fetchedMatches.filter((match) => match.round === "ZONE" && match.zone === "B")

      setZoneAMatches(zoneA)
      setZoneBMatches(zoneB)

      // Calculate standings for each zone
      const calculateStandings = (matches: MatchInfo[], zone: string): Standing[] => {
        const teamPoints: { [teamId: string]: number } = {}
        const teamWins: { [teamId: string]: number } = {}
        const teamLosses: { [teamId: string]: number } = {}
        const teamTies: { [teamId: string]: number } = {}
        const teamMatchesPlayed: { [teamId: string]: number } = {}
        const teamScoreDifference: { [teamId: string]: number } = {}

        matches.forEach((match) => {
          if (!match.couple1_id || !match.couple2_id || match.result_couple1 === null || match.result_couple2 === null) {
            return
          }

          const couple1Id = match.couple1_id
          const couple2Id = match.couple2_id
          const result_couple1 = match.result_couple1
          const result_couple2 = match.result_couple2

          teamMatchesPlayed[couple1Id] = (teamMatchesPlayed[couple1Id] || 0) + 1
          teamMatchesPlayed[couple2Id] = (teamMatchesPlayed[couple2Id] || 0) + 1

          if (result_couple1! > result_couple2!) {
            teamPoints[couple1Id] = (teamPoints[couple1Id] || 0) + 3
            teamPoints[couple2Id] = (teamPoints[couple2Id] || 0) + 0

            teamWins[couple1Id] = (teamWins[couple1Id] || 0) + 1
            teamLosses[couple2Id] = (teamLosses[couple2Id] || 0) + 1

            teamScoreDifference[couple1Id] = (teamScoreDifference[couple1Id] || 0) + (result_couple1! - result_couple2!)
            teamScoreDifference[couple2Id] = (teamScoreDifference[couple2Id] || 0) + (result_couple2! - result_couple1!)
          } else if (result_couple2! > result_couple1!) {
            teamPoints[couple2Id] = (teamPoints[couple2Id] || 0) + 3
            teamPoints[couple1Id] = (teamPoints[couple1Id] || 0) + 0

            teamWins[couple2Id] = (teamWins[couple2Id] || 0) + 1
            teamLosses[couple1Id] = (teamLosses[couple1Id] || 0) + 1

            teamScoreDifference[couple2Id] = (teamScoreDifference[couple2Id] || 0) + (result_couple2! - result_couple1!)
            teamScoreDifference[couple1Id] = (teamScoreDifference[couple1Id] || 0) + (result_couple1! - result_couple2!)
          } else {
            teamPoints[couple1Id] = (teamPoints[couple1Id] || 0) + 1
            teamPoints[couple2Id] = (teamPoints[couple2Id] || 0) + 1

            teamTies[couple1Id] = (teamTies[couple1Id] || 0) + 1
            teamTies[couple2Id] = (teamTies[couple2Id] || 0) + 1
          }
        })

        const standings: Standing[] = Object.keys(teamPoints).map((teamId) => ({
          team_id: teamId,
          zone: zone,
          points: teamPoints[teamId] || 0,
          wins: teamWins[teamId] || 0,
          losses: teamLosses[teamId] || 0,
          ties: teamTies[teamId] || 0,
          matches_played: teamMatchesPlayed[teamId] || 0,
          score_difference: teamScoreDifference[teamId] || 0,
        }))

        standings.sort((a, b) => {
          if (b.points !== a.points) {
            return b.points - a.points
          }
          return b.score_difference - a.score_difference
        })

        return standings
      }

      const calculatedZoneAStandings = calculateStandings(zoneA, "A")
      const calculatedZoneBStandings = calculateStandings(zoneB, "B")

      setZoneAStandings(calculatedZoneAStandings)
      setZoneBStandings(calculatedZoneBStandings)

      // Generate bracket matches dynamically
      let currentBracketMatches: MatchInfo[] = []

      // Filter out matches that are for the bracket (not zone matches)
      const bracketMatchesFromDB = fetchedMatches.filter((m) => m.round !== "ZONE" && m.round !== "GROUP")

      if (bracketMatchesFromDB.length > 0) {
        // If we have bracket matches from DB, use those
        currentBracketMatches = bracketMatchesFromDB
      } else if (calculatedZoneAStandings.length > 0 || calculatedZoneBStandings.length > 0) {
        // If we have zone standings but no bracket matches, generate them
        // Combine top performers from both zones
        const qualifiedCouplesStandingData = [
          ...calculatedZoneAStandings,
          ...calculatedZoneBStandings,
        ].filter(Boolean)

        if (qualifiedCouplesStandingData.length > 0) {
          const qualifiedCouplesInfo: CoupleInfo[] = qualifiedCouplesStandingData.map(standing => {
            const foundCouple = coupleInscriptions.find(couple => couple.id === standing.team_id);
            if (!foundCouple) {
              console.warn(`CoupleInfo not found for team_id: ${standing.team_id} from standings. This couple will be skipped for bracket generation.`);
              return null; 
            }
            return foundCouple;
          }).filter(Boolean) as CoupleInfo[]; // filter(Boolean) to remove nulls

          if (qualifiedCouplesInfo.length > 0) {
            currentBracketMatches = generateTournamentMatches(tournamentId, qualifiedCouplesInfo);
          } else {
            console.warn("No qualified couples found after mapping standings to CoupleInfo. Bracket matches will not be generated.");
          }
        }
      }

      setBracketMatches([...currentBracketMatches])
    } catch (error) {
      console.error("Failed to fetch tournament data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenResultDialog = (match: MatchInfo) => {
    setSelectedMatch(match)
    setScore1(match.result_couple1 !== null && match.result_couple1 !== undefined ? match.result_couple1.toString() : "")
    setScore2(match.result_couple2 !== null && match.result_couple2 !== undefined ? match.result_couple2.toString() : "")
    setResultDialogOpen(true)
  }

  const handleCloseResultDialog = () => {
    setResultDialogOpen(false)
    setSelectedMatch(null)
    setScore1("")
    setScore2("")
  }

  const handleSaveResult = async () => {
    if (!selectedMatch) return

    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/matches/${selectedMatch.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          result_couple1: Number.parseInt(score1),
          result_couple2: Number.parseInt(score2),
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Update the bracket if a match was completed
        if (selectedMatch && selectedMatch.round !== "ZONE" && selectedMatch.round !== "GROUP") {
          const updatedMatch = {
            ...selectedMatch,
            result_couple1: Number.parseInt(score1),
            result_couple2: Number.parseInt(score2),
            status: "COMPLETED" as "COMPLETED",
            winner_id:
              Number.parseInt(score1) > Number.parseInt(score2) ? selectedMatch.couple1_id : selectedMatch.couple2_id,
          }

          const updatedMatches = updateBracketAfterMatchCompletion(allMatches, updatedMatch)

          setAllMatches(updatedMatches)
          setBracketMatches(updatedMatches.filter((m) => m.round !== "ZONE" && m.round !== "GROUP"))
        }

        toast({ title: "Resultado guardado", description: "El resultado ha sido guardado exitosamente" })
        fetchTournamentData()
        setResultDialogOpen(false)
      }
    } catch (error) {
      console.error("Failed to save result:", error)
    }
  }

  const handleStartTournament = async () => {
    if (!confirm("¿Estás seguro de que deseas iniciar este torneo? Una vez iniciado, no se podrán agregar más inscripciones.")) {
      return;
    }

    setIsStartingTournament(true);
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Torneo iniciado",
          description: "El torneo ha sido iniciado exitosamente",
        });
        // Reload the page to reflect the new status
        window.location.reload();
      } else {
        toast({
          title: "Error",
          description: "No se pudo iniciar el torneo",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error al iniciar el torneo:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al iniciar el torneo",
        variant: "destructive",
      });
    } finally {
      setIsStartingTournament(false);
    }
  };

  const renderMatchesTable = (matches: MatchInfo[], title: string) => (
    <Box mt={4}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Pareja 1</TableCell>
              <TableCell align="right">Pareja 2</TableCell>
              <TableCell align="right">Resultado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {matches.map((match) => (
              <TableRow key={match.id} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                <TableCell component="th" scope="row">
                  {match.couple1_name}
                </TableCell>
                <TableCell align="right">{match.couple2_name}</TableCell>
                <TableCell align="right">
                  {match.result_couple1 !== null && match.result_couple1 !== undefined && match.result_couple2 !== null && match.result_couple2 !== undefined
                    ? `${match.result_couple1} - ${match.result_couple2}`
                    : "Pendiente"}
                </TableCell>
                <TableCell align="right">
                  <Button variant="contained" color="primary" onClick={() => handleOpenResultDialog(match)}>
                    Cargar Resultado
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )

  const renderStandingsTable = (standings: Standing[], title: string) => (
    <Box mt={4}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Equipo</TableCell>
              <TableCell align="right">Puntos</TableCell>
              <TableCell align="right">Wins</TableCell>
              <TableCell align="right">Losses</TableCell>
              <TableCell align="right">Ties</TableCell>
              <TableCell align="right">Score Difference</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {standings.map((standing) => (
              <TableRow key={standing.team_id} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                <TableCell component="th" scope="row">
                  {standing.team_id}
                </TableCell>
                <TableCell align="right">{standing.points}</TableCell>
                <TableCell align="right">{standing.wins}</TableCell>
                <TableCell align="right">{standing.losses}</TableCell>
                <TableCell align="right">{standing.ties}</TableCell>
                <TableCell align="right">{standing.score_difference}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" gutterBottom>
          Gestión del Torneo
        </Typography>
        
        {tournamentStatus === "NOT_STARTED" && (
          <Button
            variant="contained"
            color="success"
            onClick={handleStartTournament}
            disabled={isStartingTournament}
            startIcon={isStartingTournament ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isStartingTournament ? "Iniciando..." : "Iniciar Torneo"}
          </Button>
        )}
      </Box>

      {isLoading ? (
        <CircularProgress />
      ) : (
        <>
          {renderMatchesTable(zoneAMatches, "Partidos - Zona A")}
          {renderMatchesTable(zoneBMatches, "Partidos - Zona B")}
          {renderMatchesTable(bracketMatches, "Partidos - Bracket")}
          {renderStandingsTable(zoneAStandings, "Posiciones - Zona A")}
          {renderStandingsTable(zoneBStandings, "Posiciones - Zona B")}

          <Dialog open={resultDialogOpen} onClose={handleCloseResultDialog}>
            <DialogTitle>Cargar Resultado</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                id="score1"
                label={`Score ${selectedMatch?.couple1_name}`}
                type="number"
                fullWidth
                value={score1}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setScore1(e.target.value)}
              />
              <TextField
                margin="dense"
                id="score2"
                label={`Score ${selectedMatch?.couple2_name}`}
                type="number"
                fullWidth
                value={score2}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setScore2(e.target.value)}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseResultDialog} color="primary">
                Cancelar
              </Button>
              <Button onClick={handleSaveResult} color="primary">
                Guardar
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Box>
  )
}

export default TournamentManagement
