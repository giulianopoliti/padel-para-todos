/**
 * Utility functions for generating tournament brackets
 */

import type { CoupleInfo, MatchInfo } from "@/components/tournament/club/types"
import { Couple, Zone, Round } from "@/types"

// Couples con stats necesarios para ranking
export interface CoupleWithStats extends Couple {
  stats?: {
    points: number;
  };
}

// Zona con parejas con stats
export interface ZoneWithRankedCouples extends Omit<Zone, 'couples'> {
  couples: CoupleWithStats[];
}

// Estructura simplificada para cuadro de eliminación directa
export interface KnockoutPairing {
  temp_id: string;
  round: Round;
  couple1: CoupleWithStats;
  couple2: CoupleWithStats | { id: "BYE_MARKER"; player_1: "BYE_PLAYER_ID"; player_2: "BYE_PLAYER_ID" };
}

export function generateZones(participants: Couple[]): Zone[] {
  const zones: Zone[] = [];
  const mutableParticipants = [...participants];
  const n = mutableParticipants.length;

  if (n === 0) return [];
  if (n < 6) throw new Error(`El torneo requiere al menos 6 parejas. Recibidas: ${n}.`);

  let numZonesOf4 = 0;
  let numZonesOf3 = 0;

  switch (n % 4) {
    case 0:
      numZonesOf4 = n / 4;
      break;
    case 1:
      if (n < 9) throw new Error(`No se pueden formar zonas con ${n} parejas (resto 1). Se requieren al menos 9.`);
      numZonesOf4 = Math.floor(n / 4) - 2;
      numZonesOf3 = 3;
      break;
    case 2:
      numZonesOf4 = Math.floor(n / 4) - 1;
      numZonesOf3 = 2;
      break;
    case 3:
      numZonesOf4 = Math.floor(n / 4);
      numZonesOf3 = 1;
      break;
  }

  let zoneCounter = 0;
  const createAndAddZone = (numInZone: number) => {
    if (mutableParticipants.length < numInZone) {
      throw new Error(`Error interno: participantes insuficientes (${mutableParticipants.length}) para zona de ${numInZone}.`);
    }

    const zoneCouples: Couple[] = mutableParticipants.splice(0, numInZone);

    zones.push({
      id: `temp-zone-${zoneCounter}`,
      name: `Zone ${String.fromCharCode(65 + zoneCounter)}`, // Zone A, B, C...
      created_at: new Date().toISOString(),
      couples: zoneCouples,
    });

    zoneCounter++;
  };

  for (let i = 0; i < numZonesOf4; i++) createAndAddZone(4);
  for (let i = 0; i < numZonesOf3; i++) createAndAddZone(3);

  if (mutableParticipants.length > 0) {
    throw new Error(`Quedaron ${mutableParticipants.length} parejas sin asignar a zonas. Revisa la lógica de distribución.`);
  }

  return zones;
}

export function generateKnockoutRounds(zones: ZoneWithRankedCouples[]): KnockoutPairing[] {
  const allCouplesRaw: CoupleWithStats[] = zones.flatMap(zone => zone.couples);

  if (allCouplesRaw.length === 0) return [];

  // Ensure all couples have a stats object, defaulting to 0 points if undefined or null
  const allCouples: CoupleWithStats[] = allCouplesRaw.map(c => ({
    ...c,
    stats: c.stats || { points: 0, played: 0, won: 0, lost: 0, scored: 0, conceded: 0 } // Provide default stats
  }));

  // Sort by points primarily, then by other stats if needed for tie-breaking
  allCouples.sort((a, b) => {
    const pointsA = a.stats?.points || 0;
    const pointsB = b.stats?.points || 0;
    // Add more tie-breaking conditions here if necessary (e.g., game difference, games won)
    return pointsB - pointsA;
  });

  const numCouples = allCouples.length;
  // This check is redundant due to the allCouplesRaw.length check earlier
  // if (numCouples === 0) return []; 

  const bracketSize = Math.max(2, Math.pow(2, Math.ceil(Math.log2(numCouples))));
  const numByes = bracketSize - numCouples;
  const roundName = getRoundName(bracketSize);

  const pairings: KnockoutPairing[] = [];
  let matchIdCounter = 1;

  // Assign BYEs to top-ranked couples
  for (let i = 0; i < numByes; i++) {
    pairings.push({
      temp_id: `match-${matchIdCounter++}`,
      round: roundName,
      couple1: allCouples[i],
      couple2: { id: "BYE_MARKER", player_1: "BYE_PLAYER_ID", player_2: "BYE_PLAYER_ID", stats: { points: 0 } }, // Added stats for type consistency
    });
  }

  // Pair the remaining couples
  const playingCouples: CoupleWithStats[] = allCouples.slice(numByes);
  const numPlayingCouples = playingCouples.length;

  for (let i = 0; i < Math.floor(numPlayingCouples / 2); i++) {
    pairings.push({
      temp_id: `match-${matchIdCounter++}`,
      round: roundName,
      couple1: playingCouples[i],
      couple2: playingCouples[numPlayingCouples - 1 - i],
    });
  }
  
  // If there's an odd number among playingCouples (after initial byes), the middle one gets a bye in this sub-bracket
  // This should ideally not happen if bracketSize logic is correct and numByes fills it to power of two.
  // However, keeping for safety or if numCouples itself is odd AFTER some have been given main BYEs.
  // This case is actually covered by the main numByes logic.
  // E.g. 3 players: bracketSize 4, numByes 1. Player1 gets BYE.
  // playingCouples = [P2, P3]. numPlayingCouples = 2. One match P2 vs P3. Total pairings = 2. Correct.
  // E.g. 5 players: bracketSize 8, numByes 3. P1,P2,P3 get BYE.
  // playingCouples = [P4, P5]. numPlayingCouples = 2. One match P4 vs P5. Total pairings = 4. Correct.

  return pairings;
}

function getRoundName(size: number): Round {
  switch (size) {
    case 2: return "FINAL";
    case 4: return "SEMIFINAL";
    case 8: return "4TOS";
    case 16: return "8VOS";
    case 32: return "16VOS";
    case 64: return "32VOS";
    default:
      throw new Error(`Tamaño de llave no soportado: ${size}. Debe ser potencia de 2 hasta 64.`);
  }
}
