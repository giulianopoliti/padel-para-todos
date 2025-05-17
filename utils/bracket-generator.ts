/**
 * Utility functions for generating tournament brackets
 */

import type { CoupleInfo, MatchInfo } from "@/components/tournament/club/types"
import { Couple, Zone, Round } from "@/types"

// Helper interface for couples with calculated stats needed for ranking
export interface CoupleWithStats extends Couple {
  stats?: {
    points: number;
    // Add other stats if they become relevant for tie-breaking in the future
  };
}

// Helper interface for Zones containing couples with stats
export interface ZoneWithRankedCouples extends Omit<Zone, 'couples'> {
  couples: CoupleWithStats[];
}

// Simplified output structure for knockout pairings
export interface KnockoutPairing {
  temp_id: string; // For local reference, e.g., "match-1"
  round: Round;
  couple1: CoupleWithStats;
  // Couple2 can be a real couple or a placeholder for a bye
  couple2: CoupleWithStats | { id: "BYE_MARKER"; player_1: "BYE_PLAYER_ID"; player_2: "BYE_PLAYER_ID" };
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

// Updated to accept ZoneWithRankedCouples and return KnockoutPairing[]
export function generateKnockoutRounds(zones: ZoneWithRankedCouples[]): KnockoutPairing[] {
  const allCouples: CoupleWithStats[] = [];

  zones.forEach(zone => {
    allCouples.push(...zone.couples);
  });

  // Sort couples globally based on points from their stats
  allCouples.sort((a, b) => (b.stats?.points || 0) - (a.stats?.points || 0));

  const total = allCouples.length;
  if (total === 0) return []; // No couples, no knockout rounds
  
  const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(total)));
  // const byes = nextPowerOfTwo - total; // byes calculation not directly used for pairing logic below but good for info

  const pairings: KnockoutPairing[] = [];
  let matchIdCounter = 1;

  const roundName = getRoundName(nextPowerOfTwo);

  for (let i = 0; i < Math.floor(total / 2); i++) {
    pairings.push({
      temp_id: `match-${matchIdCounter++}`,
      round: roundName,
      couple1: allCouples[i],
      couple2: allCouples[total - 1 - i],
    });
  }

  if (total % 2 === 1) {
    pairings.push({
      temp_id: `match-${matchIdCounter++}`,
      round: roundName,
      couple1: allCouples[Math.floor(total / 2)],
      couple2: { id: "BYE_MARKER", player_1: "BYE_PLAYER_ID", player_2: "BYE_PLAYER_ID" } as { id: "BYE_MARKER"; player_1: string; player_2: string },
    });
  }

  return pairings;
}

// Updated to return Round type and map to specific enum values
function getRoundName(size: number): Round {
  switch (size) {
    case 2: return "FINAL";
    case 4: return "SEMIFINAL";
    case 8: return "4TOS";
    case 16: return "8VOS";
    case 32: return "16VOS";
    case 64: return "32VOS";
    default:
      // This case should ideally not be hit if total participants is reasonable
      // and leads to a standard power of 2.
      // Consider if your Round enum should have more generic stages or throw error.
      // For safety, let's throw if it's an unexpected size not in enum.
      throw new Error(`Unsupported knockout round size for enum mapping: ${size}. Valid powers of 2 expected for Round enum values.`);
  }
}