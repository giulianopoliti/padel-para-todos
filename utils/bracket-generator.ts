/**
 * Utility functions for generating tournament brackets
 */

import type { CoupleInfo, MatchInfo } from "@/components/tournament/club/types"
import { Couple, Zone } from "@/types"

/**
 * Calculate the number of rounds needed for a tournament
 * @param participantCount Number of participants
 * @returns Number of rounds needed
 */
export function calculateRounds(participantCount: number): number {
  return Math.ceil(Math.log2(participantCount))
}

/**
 * Calculate the total number of positions in the bracket
 * @param rounds Number of rounds
 * @returns Total positions in the bracket
 */
export function calculateTotalPositions(rounds: number): number {
  return Math.pow(2, rounds)
}

/**
 * Generate seeded matchups for the first round
 * @param participants Array of participants (couples)
 * @returns Array of matchups for the first round
 */
export function generateSeedMatchups(participants: CoupleInfo[]): [CoupleInfo, CoupleInfo | null][] {
  // Sort participants by score (sum of player scores)
  const sortedParticipants = [...participants].sort((a, b) => {
    const scoreA = (a.player_1_info?.score || 0) + (a.player_2_info?.score || 0)
    const scoreB = (b.player_1_info?.score || 0) + (b.player_2_info?.score || 0)
    return scoreB - scoreA // Higher scores first
  })

  const rounds = calculateRounds(sortedParticipants.length)
  const totalPositions = calculateTotalPositions(rounds)
  const matchups: [CoupleInfo, CoupleInfo | null][] = []

  // Create array with participants and byes (nulls)
  const bracketPositions: (CoupleInfo | null)[] = Array(totalPositions).fill(null)

  // Place participants according to seeding
  for (let i = 0; i < sortedParticipants.length; i++) {
    let position = 0

    // Standard seeding pattern calculation
    if (i === 0)
      position = 0 // 1st seed
    else if (i === 1)
      position = totalPositions - 1 // 2nd seed
    else if (i === 2)
      position = totalPositions / 2 // 3rd seed
    else if (i === 3)
      position = totalPositions / 2 - 1 // 4th seed
    else {
      // For remaining seeds, use a more complex pattern
      // This is a simplified version of standard tournament seeding
      const powerOf2 = Math.pow(2, Math.floor(Math.log2(i + 1)))
      const offset = i + 1 - powerOf2
      position = offset * 2 * (totalPositions / (powerOf2 * 2))
    }

    bracketPositions[position] = sortedParticipants[i]
  }

  // Create matchups from positions
  for (let i = 0; i < totalPositions; i += 2) {
    matchups.push(
      [bracketPositions[i] || null, bracketPositions[i + 1] || null].filter(Boolean) as [CoupleInfo, CoupleInfo | null],
    )
  }

  return matchups.filter((matchup) => matchup[0]) // Filter out empty matchups
}

/**
 * Generate matches for a tournament
 * @param tournamentId Tournament ID
 * @param participants Array of participants (couples)
 * @returns Array of matches
 */
export function generateTournamentMatches(tournamentId: string, participants: CoupleInfo[]): MatchInfo[] {
  const rounds = calculateRounds(participants.length)
  const matches: MatchInfo[] = []

  // Generate first round matchups
  const firstRoundMatchups = generateSeedMatchups(participants)

  // Create match objects for first round
  firstRoundMatchups.forEach((matchup, index) => {
    if (!matchup[0]) return // Skip if no first participant

    const roundName = getRoundName(rounds, 1)

    matches.push({
      id: `${roundName.toLowerCase()}-${index + 1}-${tournamentId}`,
      tournament_id: tournamentId,
      couple1_id: matchup[0].id,
      couple2_id: matchup[1]?.id || "",
      couple1: matchup[0],
      couple2: matchup[1] || undefined,
      round: roundName,
      status: "PENDING",
    })
  })

  // Create placeholder matches for subsequent rounds
  for (let round = 2; round <= rounds; round++) {
    const matchCount = Math.pow(2, rounds - round)
    const roundName = getRoundName(rounds, round)

    for (let i = 0; i < matchCount; i++) {
      matches.push({
        id: `${roundName.toLowerCase()}-${i + 1}-${tournamentId}`,
        tournament_id: tournamentId,
        couple1_id: "",
        couple2_id: "",
        round: roundName,
        status: "PENDING",
      })
    }
  }

  return matches
}

/**
 * Get the name of a round based on the total rounds and current round
 * @param totalRounds Total number of rounds in the tournament
 * @param currentRound Current round number (1-based)
 * @returns Name of the round (e.g., "QUARTERFINAL", "SEMIFINAL", "FINAL")
 */
export function getRoundName(totalRounds: number, currentRound: number): string {
  const roundsFromEnd = totalRounds - currentRound

  if (roundsFromEnd === 0) return "FINAL"
  if (roundsFromEnd === 1) return "SEMIFINAL"
  if (roundsFromEnd === 2) return "QUARTERFINAL"
  if (roundsFromEnd === 3) return "ROUND_OF_16"
  if (roundsFromEnd === 4) return "ROUND_OF_32"

  return `ROUND_${currentRound}`
}

/**
 * Update bracket matches after a match is completed
 * @param matches All tournament matches
 * @param completedMatch The match that was just completed
 * @returns Updated matches array
 */
export function updateBracketAfterMatchCompletion(matches: MatchInfo[], completedMatch: MatchInfo): MatchInfo[] {
  if (!completedMatch.winner_id) return matches

  const updatedMatches = [...matches]
  const rounds = ["ROUND_OF_32", "ROUND_OF_16", "QUARTERFINAL", "SEMIFINAL", "FINAL"]
  const currentRoundIndex = rounds.indexOf(completedMatch.round)

  if (currentRoundIndex < 0 || currentRoundIndex >= rounds.length - 1) {
    return updatedMatches // No next round or invalid round
  }

  const nextRound = rounds[currentRoundIndex + 1]
  const nextRoundMatches = updatedMatches.filter((m) => m.round === nextRound)

  // Find the winner couple
  const winnerCouple =
    completedMatch.winner_id === completedMatch.couple1_id ? completedMatch.couple1 : completedMatch.couple2

  if (!winnerCouple) return updatedMatches

  // Find the next match where this winner should go
  // This is a simplified approach - in a real tournament, you'd need more complex logic
  // to determine which next-round match a winner goes to
  const matchIndex = Number.parseInt(completedMatch.id.split("-")[1]) - 1
  const nextMatchIndex = Math.floor(matchIndex / 2)

  if (nextMatchIndex < nextRoundMatches.length) {
    const nextMatch = nextRoundMatches[nextMatchIndex]
    const matchIndexInUpdatedMatches = updatedMatches.findIndex((m) => m.id === nextMatch.id)

    if (matchIndexInUpdatedMatches >= 0) {
      // If couple1 is empty, put winner there, otherwise in couple2
      if (!updatedMatches[matchIndexInUpdatedMatches].couple1_id) {
        updatedMatches[matchIndexInUpdatedMatches].couple1_id = winnerCouple.id
        updatedMatches[matchIndexInUpdatedMatches].couple1 = winnerCouple
      } else {
        updatedMatches[matchIndexInUpdatedMatches].couple2_id = winnerCouple.id
        updatedMatches[matchIndexInUpdatedMatches].couple2 = winnerCouple
      }
    }
  }

  return updatedMatches
}

function generateZonesForThreeCouples (participants: Couple[], zones: Zone[]): Zone[] {
  const participantsCopy = [...participants]
  const couples_length = participants.length
  if (couples_length < 3) {
    throw new Error("Not enough participants to generate zones")
  }
  for (let i = 0; i < couples_length / 3; i += 1) {
    const firstCouple = participantsCopy[0];
    const lastCouple = participantsCopy[participantsCopy.length - 1];
    const secondLastCouple = participantsCopy[participantsCopy.length - 2];
    const zone: Zone = {
      id: `zone-${i}`,
      name: `Zone ${i}`,
      description: `Zone ${i}`,
      created_at: new Date().toISOString(),
      couples: [firstCouple, lastCouple, secondLastCouple]
    }
    zones.push(zone)
    participantsCopy.splice(participantsCopy.indexOf(firstCouple), 1);
    participantsCopy.splice(participantsCopy.indexOf(lastCouple), 1);
    participantsCopy.splice(participantsCopy.indexOf(secondLastCouple), 1);
  }
  return zones
}

export function generateZones (participants: Couple[]): Zone[] {
  let zones: Zone[] = []
  const participantsCopy = [...participants]
  const couples_length = participants.length
  if (couples_length < 6) {
    throw new Error("Not enough participants to generate zones")
  }
  else {
    if (couples_length % 4 === 0) {
      for (let i = 0; i < couples_length / 4; i += 1) {
        const firstCouple = participantsCopy[0];
        const mediumCouple = participantsCopy[Math.floor(participantsCopy.length / 2)];
        const lastCouple = participantsCopy[participantsCopy.length - 1];
        const secondLastCouple = participantsCopy[participantsCopy.length - 2];

        const zone: Zone = {
          id: `zone-${i}`,
          name: `Zone ${i}`,
          description: `Zone ${i}`,
          created_at: new Date().toISOString(),
          couples: [firstCouple, mediumCouple, lastCouple, secondLastCouple]
        };
        zones.push(zone);

        // Eliminar las parejas utilizadas
        participantsCopy.splice(participantsCopy.indexOf(firstCouple), 1);
        participantsCopy.splice(participantsCopy.indexOf(mediumCouple), 1);
        participantsCopy.splice(participantsCopy.indexOf(lastCouple), 1);
        participantsCopy.splice(participantsCopy.indexOf(secondLastCouple), 1);
      }
    }
    else if (couples_length % 4 === 1) {
      for (let i = 0; i < couples_length / 3; i += 1) {
        // Seleccionar parejas para esta zona
        const firstCouple = participantsCopy[0];
        const lastCouple = participantsCopy[participantsCopy.length - 1];
        const secondLastCouple = participantsCopy[participantsCopy.length - 2];
        
        const zone: Zone = {
          id: `zone-${i}`,
          name: `Zone ${i}`,
          description: `Zone ${i}`,
          created_at: new Date().toISOString(),
          couples: [firstCouple, lastCouple, secondLastCouple]
        };
        zones.push(zone);
        
        // Eliminar las parejas utilizadas
        participantsCopy.splice(participantsCopy.indexOf(firstCouple), 1);
        participantsCopy.splice(participantsCopy.indexOf(lastCouple), 1);
        participantsCopy.splice(participantsCopy.indexOf(secondLastCouple), 1);
      }
      if (couples_length % 3 === 0) {
        zones = generateZonesForThreeCouples(participantsCopy, zones)
        return zones;
      }
    }
    else if (couples_length % 4 === 2) {
      for (let i = 0; i < 2; i += 1) {
        zones = generateZonesForThreeCouples(participantsCopy, zones)
      }
      for (let i = 0; i < couples_length / 4; i += 1) {
        const zone: Zone = {
          id: `zone-${i}`,
          name: `Zone ${i}`,
          description: `Zone ${i}`,
          created_at: new Date().toISOString(),
          couples: []  // Añadir el array vacío para cumplir con el tipo Zone
        };
        zones.push(zone);
      }
    }
  }
  return zones;
}
