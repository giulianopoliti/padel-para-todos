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

export function generateZones(participants: Couple[]): Zone[] {
  const zones: Zone[] = [];
  // Work with a copy so the original participants array is not modified
  const mutableParticipants = [...participants];
  const n = mutableParticipants.length;
  let zoneCounter = 0;

  if (n === 0) {
    return []; // No participants, no zones
  }

  // Adhering to the original constraint of requiring at least 6 couples.
  if (n < 6) {
    throw new Error(`Tournament requires at least 6 couples to generate zones. Found ${n}.`);
  }

  let num_zones_of_4 = 0;
  let num_zones_of_3 = 0;

  if (n % 4 === 0) {
    num_zones_of_4 = n / 4;
  } else if (n % 4 === 1) {
    // Requires n >= 9. Example: n=9 -> 0x4, 3x3. n=13 -> 1x4, 3x3.
    // Covered by n < 6 check for smaller invalid values like 1, 5.
    if (n < 9) { // Should not happen if n >= 6, means n could be 1 or 5 which isn't allowed with this formula branch.
        throw new Error(`Cannot form zones for ${n} couples with a remainder of 1 (requires at least 9 couples for this case).`);
    }
    num_zones_of_4 = Math.floor(n / 4) - 2;
    num_zones_of_3 = 3;
  } else if (n % 4 === 2) {
    // Requires n >= 6. Example: n=6 -> 0x4, 2x3. n=10 -> 1x4, 2x3.
    num_zones_of_4 = Math.floor(n / 4) - 1;
    num_zones_of_3 = 2;
  } else { // n % 4 === 3
    // Requires n >= 3. Example: n=7 -> 1x4, 1x3. n=11 -> 2x4, 1x3.
    num_zones_of_4 = Math.floor(n / 4);
    num_zones_of_3 = 1;
  }

  const createAndAddZone = (numInZone: number) => {
    if (mutableParticipants.length < numInZone) {
      throw new Error(
        `Internal logic error: Not enough participants (${mutableParticipants.length}) to form planned zone of ${numInZone}. Initial n=${n}`,
      );
    }
    const zoneCouples: Couple[] = [];
    for (let i = 0; i < numInZone; i++) {
      // Takes couples from the beginning of the array.
      // If seeding (e.g. based on rank) is important, participants should be pre-sorted before calling generateZones.
      zoneCouples.push(mutableParticipants.shift()!);
    }

    zones.push({
      // id and created_at will be set by the database.
      // These are temporary for the object structure.
      id: `temp-zone-${zoneCounter}`,
      name: `Zone ${String.fromCharCode(65 + zoneCounter)}`, // Zone A, B, C...
      // description field removed as it caused issues earlier
      created_at: new Date().toISOString(),
      couples: zoneCouples,
    });
    zoneCounter++;
  };

  for (let i = 0; i < num_zones_of_4; i++) {
    createAndAddZone(4);
  }

  for (let i = 0; i < num_zones_of_3; i++) {
    createAndAddZone(3);
  }

  if (mutableParticipants.length > 0) {
    // This should ideally not be reached if the logic for num_zones_of_4 and num_zones_of_3 is correct.
    throw new Error(
      `Leftover participants (${mutableParticipants.length}) after zone generation. Initial n=${n}. This indicates a flaw in distribution logic.`,
    );
  }

  return zones;
}
