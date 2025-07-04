'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { getUser } from '@/app/api/users';
// import { getPlayerById } from '../players/actions'; // Not used directly in the refactored parts, can be kept if used elsewhere
// import { getUserByDni } from '../users'; // Not used directly in the refactored parts, can be kept if used elsewhere
import { Zone as GeneratedZone, Couple as GeneratedCouple, Tournament } from '@/types'; 
import { generateZones } from '@/utils/bracket-generator'; 
import { generateKnockoutRounds, KnockoutPairing } from "@/utils/bracket-generator";
import { ZoneWithRankedCouples, CoupleWithStats } from "@/utils/bracket-generator"; 

// Sistema unificado de puntos para TODO el torneo
const POINTS_FOR_WINNING_MATCH = 12;
const POINTS_FOR_LOSING_MATCH = -8; // RESTA 8 puntos

const SCORE_PERCENTAGE_TO_TRANSFER = 0.01; // 1% - DISABLED FOR NOW 

// --- INTERFACES ---
interface UpdateMatchResultParams {
  matchId: string;
  result_couple1: string;
  result_couple2: string;
  winner_id: string;
}

interface GenericMatchInsertData {
  tournament_id: string;
  couple1_id: string | null; // <-- Changed to allow null
  couple2_id: string | null;
  round: string;
  status: string;
  zone_id?: string | null;
  order?: number | null;
  winner_id?: string | null; 
}

interface ClientZone extends Omit<GeneratedZone, 'id' | 'created_at' | 'couples'> {
  couples: { id: string }[]; 
}

// Interface for the data coming from the creation form
interface CreateTournamentData {
  name: string;
  description: string | null;
  category_name: string;
  type: 'LONG' | 'AMERICAN';
  gender: 'MALE' | 'SHEMALE' | 'MIXED';
  start_date: string | null; // ISO string
  end_date: string | null; // ISO string
  max_participants: number | null;
}

// Interface for couple with extended stats used in sorting (extends the imported CoupleWithStats)
interface CoupleWithExtendedStats extends Omit<CoupleWithStats, 'stats'> {
  stats?: {
    points?: number;
    scored?: number;
    conceded?: number;
    played?: number;
    won?: number;
    lost?: number;
  };
  player1_name?: string;
  player2_name?: string;
  [key: string]: any; // Allow additional properties
}

// Interface for match data used in head-to-head calculation
interface MatchForHeadToHead {
  couple1_id: string;
  couple2_id: string;
  winner_id: string | null;
  status: string;
}

// --- HELPER FUNCTIONS (defined once, correctly placed) ---

/**
 * Determines the head-to-head result between two couples based on their direct match
 * @param couple1Id - ID of the first couple
 * @param couple2Id - ID of the second couple  
 * @param matches - Array of matches to search for direct confrontation
 * @returns -1 if couple1 won, 1 if couple2 won, 0 if no direct match or tie
 */
function getHeadToHeadResult(
  couple1Id: string, 
  couple2Id: string, 
  matches: MatchForHeadToHead[]
): number {
  const directMatch = matches.find(m => 
    m.status === 'COMPLETED' && (
      (m.couple1_id === couple1Id && m.couple2_id === couple2Id) ||
      (m.couple1_id === couple2Id && m.couple2_id === couple1Id)
    )
  );
  
  if (directMatch && directMatch.winner_id) {
    if (directMatch.winner_id === couple1Id) return -1; // couple1 won (should be sorted first)
    if (directMatch.winner_id === couple2Id) return 1;  // couple2 won (should be sorted first)
  }
  
  return 0; // No direct match found or no winner determined
}

/**
 * Unified sorting function for couples in a zone based on tournament criteria.
 * 
 * Sorting criteria (in order of priority):
 * 1. Points: Higher points = better position
 * 2. Set difference: Higher (scored - conceded) = better position  
 * 3. Sets scored: Higher sets scored = better position
 * 4. Head-to-head: Winner of direct match between tied couples
 * 5. Couple ID: Lexicographical order for stable, consistent sorting
 * 
 * @param couples - Array of couples with their statistics
 * @param matches - Array of zone matches for head-to-head calculation (optional)
 * @returns Sorted array of couples (best to worst)
 * 
 * @example
 * ```typescript
 * const sortedCouples = sortCouplesInZone(
 *   [coupleA, coupleB, coupleC],
 *   zoneMatches
 * );
 * // Returns couples ordered by tournament ranking criteria
 * ```
 */
function sortCouplesInZone(
  couples: CoupleWithExtendedStats[], 
  matches: MatchForHeadToHead[] = []
): CoupleWithExtendedStats[] {
  return [...couples].sort((a, b) => {
    // 1st: Points (higher = better)
    const pointsA = a.stats?.points || 0;
    const pointsB = b.stats?.points || 0;
    if (pointsB !== pointsA) return pointsB - pointsA;
    
    // 2nd: Set difference (higher = better) 
    const diffA = (a.stats?.scored || 0) - (a.stats?.conceded || 0);
    const diffB = (b.stats?.scored || 0) - (b.stats?.conceded || 0);
    if (diffB !== diffA) return diffB - diffA;
    
    // 3rd: Sets scored (higher = better)
    const scoredA = a.stats?.scored || 0;
    const scoredB = b.stats?.scored || 0;
    if (scoredB !== scoredA) return scoredB - scoredA;
    
    // 4th: Head-to-head result (if they played against each other)
    if (matches.length > 0) {
      const headToHead = getHeadToHeadResult(a.id, b.id, matches);
      if (headToHead !== 0) return headToHead;
    }
    
    // 5th: Couple ID for stable sort (lexicographically smaller = better for consistency)
    return a.id.localeCompare(b.id);
  });
}

/**
 * Validates that couples are properly sorted according to tournament criteria.
 * Useful for testing and debugging ranking issues.
 * 
 * @param couples - Array of sorted couples to validate
 * @param matches - Array of matches for head-to-head validation
 * @returns Object with validation results and any issues found
 */
function validateCouplesSorting(
  couples: CoupleWithExtendedStats[], 
  matches: MatchForHeadToHead[] = []
): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  for (let i = 0; i < couples.length - 1; i++) {
    const current = couples[i];
    const next = couples[i + 1];
    
    const currentPoints = current.stats?.points || 0;
    const nextPoints = next.stats?.points || 0;
    
    // Check if points are properly ordered
    if (currentPoints < nextPoints) {
      issues.push(`Couple ${current.id} (${currentPoints} pts) should not be ranked higher than ${next.id} (${nextPoints} pts)`);
      continue;
    }
    
    // If points are equal, check set difference
    if (currentPoints === nextPoints) {
      const currentDiff = (current.stats?.scored || 0) - (current.stats?.conceded || 0);
      const nextDiff = (next.stats?.scored || 0) - (next.stats?.conceded || 0);
      
      if (currentDiff < nextDiff) {
        issues.push(`Couple ${current.id} (diff: ${currentDiff}) should not be ranked higher than ${next.id} (diff: ${nextDiff}) with same points`);
        continue;
      }
      
      // If set difference is equal, check sets scored
      if (currentDiff === nextDiff) {
        const currentScored = current.stats?.scored || 0;
        const nextScored = next.stats?.scored || 0;
        
        if (currentScored < nextScored) {
          issues.push(`Couple ${current.id} (scored: ${currentScored}) should not be ranked higher than ${next.id} (scored: ${nextScored}) with same points and difference`);
        }
      }
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}

async function _createMatch(
  supabase: any,
  matchData: GenericMatchInsertData
): Promise<{ success: boolean; match?: any; error?: string }> {
  const { data, error } = await supabase
    .from('matches')
    .insert(matchData)
    .select()
    .single();
  if (error) {
    console.error('[_createMatch] Error inserting match:', error, 'MatchData:', matchData);
    return { success: false, error: `Failed to insert match: ${error.message}` };
  }
  return { success: true, match: data };
}

async function _updatePlayerScore(playerId: string, pointsToAdd: number, supabase: any) {
  if (!playerId) return;
  // Allow pointsToAdd to be 0 for the case where a losing player loses points but net change is 0.
  // Or if pointsToAdd is exactly 0 for some other reason.

  try {
    const { data: player, error: fetchError } = await supabase
      .from('players')
      .select('score')
      .eq('id', playerId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') { 
        console.warn(`[_updatePlayerScore] Player ${playerId} not found. Cannot update score.`);
      } else {
        console.error(`[_updatePlayerScore] Error fetching player ${playerId}:`, fetchError.message);
      }
      return; 
    }
    
    if (!player) {
        console.warn(`[_updatePlayerScore] Player ${playerId} data is null/undefined after fetch. Cannot update score.`);
        return;
    }

    const currentScore = player.score || 0;
    const newScore = currentScore + pointsToAdd;

    const { error: updateError } = await supabase
      .from('players')
      .update({ score: newScore })
      .eq('id', playerId);

    if (updateError) {
      console.error(`[_updatePlayerScore] Error updating score for player ${playerId} from ${currentScore} to ${newScore}:`, updateError.message);
    } else {
      console.log(`[_updatePlayerScore] Player ${playerId} score updated from ${currentScore} to ${newScore} (added ${pointsToAdd}).`);
    }
  } catch (e: any) {
    console.error(`[_updatePlayerScore] Unexpected error during score update for player ${playerId}:`, e.message);
  }
}

async function _fetchPlayerScore(playerId: string, supabase: any): Promise<number | null> {
  if (!playerId) return null;
  const { data: player, error } = await supabase
    .from('players')
    .select('score')
    .eq('id', playerId)
    .single();
  if (error) {
    if (error.code !== 'PGRST116') { // Don't warn for player not found, handle it by returning null
        console.warn(`[_fetchPlayerScore] Error fetching player ${playerId}:`, error?.message);
    }
    return null;
  }
  return player?.score || 0;
}

async function _calculateAndApplyScoreChanges(
  winningCoupleId: string,
  losingCoupleId: string | null,
  supabase: any,
  tournamentId?: string,
  matchRound?: string
) {
  // IMPORTANTE: Solo asignar puntos si el torneo está TERMINADO
  if (tournamentId) {
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('status')
      .eq('id', tournamentId)
      .single();
      
    if (tournamentError) {
      console.error(`[ScoreUpdate] Error checking tournament status for ${tournamentId}:`, tournamentError?.message);
      return;
    }
    
    if (tournament && tournament.status !== 'FINISHED') {
      console.log(`[ScoreUpdate] Tournament ${tournamentId} is not finished (status: ${tournament.status}). Points will NOT be awarded yet.`);
      return; // NO ASIGNAR PUNTOS SI EL TORNEO NO ESTÁ TERMINADO
    }
  }

  console.log(`[ScoreUpdate] Tournament is FINISHED or no tournament ID provided. Proceeding with score assignment.`);

  // Si no hay pareja perdedora (BYE), no asignar puntos
  if (!losingCoupleId) {
    console.log(`[ScoreUpdate] BYE scenario for winning couple ${winningCoupleId}. NO points awarded (automatic advance).`);
    return;
  }

  // Sistema unificado de puntos para todo el torneo
  const winnerPoints = POINTS_FOR_WINNING_MATCH;
  const loserPoints = POINTS_FOR_LOSING_MATCH;

  console.log(`[ScoreUpdate] Match round: ${matchRound}, Winner: +${winnerPoints} pts, Loser: ${loserPoints} pts`);

  // Obtener jugadores de la pareja ganadora
  const { data: winnerCouple, error: wcError } = await supabase
    .from('couples')
    .select('player1_id, player2_id')
    .eq('id', winningCoupleId)
    .single();

  if (wcError || !winnerCouple) {
    console.error(`[ScoreUpdate] Error fetching winning couple ${winningCoupleId}:`, wcError?.message);
    return;
  }

  const winnerP1Id = winnerCouple.player1_id;
  const winnerP2Id = winnerCouple.player2_id;
  const validWinnerPlayerIds = [winnerP1Id, winnerP2Id].filter(id => typeof id === 'string' && id.length > 0) as string[];

  // Asignar puntos a los ganadores
  for (const pId of validWinnerPlayerIds) {
    await _updatePlayerScore(pId, winnerPoints, supabase);
  }
  console.log(`[ScoreUpdate] Winners awarded ${winnerPoints} points each: ${validWinnerPlayerIds.join(', ')}`);

  // Obtener jugadores de la pareja perdedora
  const { data: loserCouple, error: lcError } = await supabase
    .from('couples')
    .select('player1_id, player2_id')
    .eq('id', losingCoupleId)
    .single();

  if (lcError || !loserCouple) {
    console.error(`[ScoreUpdate] Error fetching losing couple ${losingCoupleId}. Only winners awarded points.`);
    return;
  }

  const loserP1Id = loserCouple.player1_id;
  const loserP2Id = loserCouple.player2_id;
  const validLoserPlayerIds = [loserP1Id, loserP2Id].filter(id => typeof id === 'string' && id.length > 0) as string[];

  // Asignar puntos a los perdedores
  for (const pId of validLoserPlayerIds) {
    await _updatePlayerScore(pId, loserPoints, supabase);
  }
  console.log(`[ScoreUpdate] Losers awarded ${loserPoints} points each: ${validLoserPlayerIds.join(', ')}`);

  console.log(`[ScoreUpdate] Match completed. Winners: ${winningCoupleId} (+${winnerPoints} pts), Losers: ${losingCoupleId} (${loserPoints} pts)`);
}

// Función para calcular y asignar TODOS los puntos cuando el torneo termine
async function _calculateAllTournamentPoints(tournamentId: string, supabase: any) {
  console.log(`[_calculateAllTournamentPoints] Calculating ALL points for tournament ${tournamentId}`);
  
  // Obtener todos los matches completados del torneo
  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select('id, winner_id, couple1_id, couple2_id, tournament_id')
    .eq('tournament_id', tournamentId)
    .eq('status', 'COMPLETED')
    .not('winner_id', 'is', null);
    
  if (matchesError) {
    console.error(`[_calculateAllTournamentPoints] Error fetching matches:`, matchesError?.message);
    return;
  }
  
  if (!matches || matches.length === 0) {
    console.log(`[_calculateAllTournamentPoints] No completed matches found for tournament ${tournamentId}`);
    return;
  }
  
  console.log(`[_calculateAllTournamentPoints] Found ${matches.length} completed matches to process`);
  
  // Procesar cada match y asignar puntos (forzando la asignación)
  for (const match of matches) {
    const winningCoupleId = match.winner_id;
    const losingCoupleId = match.couple1_id === winningCoupleId ? match.couple2_id : match.couple1_id;
    
    console.log(`[_calculateAllTournamentPoints] Processing match ${match.id}: Winner ${winningCoupleId}, Loser ${losingCoupleId}`);
    
    // Llamar a la función de cálculo SIN pasar tournamentId para que no verifique el estado
    await _calculateAndApplyScoreChanges(winningCoupleId, losingCoupleId, supabase);
  }
  
  console.log(`[_calculateAllTournamentPoints] Finished processing all ${matches.length} matches for tournament ${tournamentId}`);
}

/**
 * Helper function to check and categorize a player if they haven't been categorized yet
 * This function assigns the minimum score for the category and marks the player as categorized
 */
async function checkAndCategorizePlayer(playerId: string, categoryName: string, supabase: any) {
  console.log(`[checkAndCategorizePlayer] Checking categorization for player ${playerId} in category ${categoryName}`);
  
  try {
    // Get current player info
    const { data: playerData, error: playerError } = await supabase
      .from('players')
      .select('id, is_categorized, score, category_name')
      .eq('id', playerId)
      .single();

    if (playerError) {
      console.error(`[checkAndCategorizePlayer] Error fetching player ${playerId}:`, playerError);
      return { success: false, message: "Error al obtener información del jugador" };
    }

    if (!playerData) {
      console.error(`[checkAndCategorizePlayer] Player ${playerId} not found`);
      return { success: false, message: "Jugador no encontrado" };
    }

    // If player is already categorized, no action needed
    if (playerData.is_categorized) {
      console.log(`[checkAndCategorizePlayer] Player ${playerId} is already categorized with score ${playerData.score}`);
      return { success: true, message: "Jugador ya categorizado", alreadyCategorized: true };
    }

    // Get category information
    const { data: categoryData, error: categoryError } = await supabase
      .from('categories')
      .select('name, lower_range')
      .eq('name', categoryName)
      .single();

    if (categoryError) {
      console.error(`[checkAndCategorizePlayer] Error fetching category ${categoryName}:`, categoryError);
      return { success: false, message: "Error al obtener información de la categoría" };
    }

    if (!categoryData) {
      console.error(`[checkAndCategorizePlayer] Category ${categoryName} not found`);
      return { success: false, message: "Categoría no encontrada" };
    }

    // Update player with minimum score for the category and mark as categorized
    const newScore = categoryData.lower_range || 0;
    const { error: updateError } = await supabase
      .from('players')
      .update({
        score: newScore,
        category_name: categoryName,
        is_categorized: true
      })
      .eq('id', playerId);

    if (updateError) {
      console.error(`[checkAndCategorizePlayer] Error updating player ${playerId}:`, updateError);
      return { success: false, message: "Error al actualizar el jugador" };
    }

    console.log(`[checkAndCategorizePlayer] Player ${playerId} successfully categorized with score ${newScore} in category ${categoryName}`);
    return { 
      success: true, 
      message: "Jugador categorizado exitosamente", 
      newScore, 
      categoryName,
      wasCategorized: true 
    };

  } catch (error) {
    console.error(`[checkAndCategorizePlayer] Unexpected error:`, error);
    return { success: false, message: "Error inesperado al categorizar jugador" };
  }
}

function generateMatchesForZoneLogic(zone: { id: string; couples: GeneratedCouple[] }, tournamentId: string): GenericMatchInsertData[] {
  const matchesToInsert: GenericMatchInsertData[] = [];
  const couplesInZone = zone.couples;
  const numCouples = couplesInZone.length;

  if (numCouples === 4) {
    const c = couplesInZone;
    matchesToInsert.push({ tournament_id: tournamentId, zone_id: zone.id, couple1_id: c[0].id, couple2_id: c[3].id, status: 'PENDING', round: 'ZONE' });
    matchesToInsert.push({ tournament_id: tournamentId, zone_id: zone.id, couple1_id: c[1].id, couple2_id: c[2].id, status: 'PENDING', round: 'ZONE' });
    matchesToInsert.push({ tournament_id: tournamentId, zone_id: zone.id, couple1_id: c[0].id, couple2_id: c[2].id, status: 'PENDING', round: 'ZONE' });
    matchesToInsert.push({ tournament_id: tournamentId, zone_id: zone.id, couple1_id: c[1].id, couple2_id: c[3].id, status: 'PENDING', round: 'ZONE' });
  } else if (numCouples === 3) {
    const c = couplesInZone;
    matchesToInsert.push({ tournament_id: tournamentId, zone_id: zone.id, couple1_id: c[0].id, couple2_id: c[1].id, status: 'PENDING', round: 'ZONE' });
    matchesToInsert.push({ tournament_id: tournamentId, zone_id: zone.id, couple1_id: c[0].id, couple2_id: c[2].id, status: 'PENDING', round: 'ZONE' });
    matchesToInsert.push({ tournament_id: tournamentId, zone_id: zone.id, couple1_id: c[1].id, couple2_id: c[2].id, status: 'PENDING', round: 'ZONE' });
  }
  return matchesToInsert;
}

// --- MAIN EXPORTED ACTIONS (existing functions adapted or kept as is if not directly affected by refactor) ---

export async function createTournamentAction(formData: CreateTournamentData) {
  const supabase = await createClient();

  try {
    // 1. Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('[createTournamentAction] User not authenticated:', userError?.message);
      return { success: false, error: 'User not authenticated' };
    }

    // 2. Get club_id for the user
    const { data: club, error: clubError } = await supabase
      .from('clubes')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (clubError || !club) {
      console.error('[createTournamentAction] Club not found for user:', clubError?.message);
      return { success: false, error: 'Club not found for the authenticated user.' };
    }

    // 3. Prepare data for insertion
    const tournamentToInsert = {
      ...formData,
      club_id: club.id,
      status: 'NOT_STARTED', // Default status
      // Ensure date fields are correctly formatted if they come as strings
      start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
      end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
      // max_participants is already number | null from formData type and client-side conversion
      // max_participants: formData.max_participants === '' ? null : Number(formData.max_participants)
    };

    // 4. Insert tournament
    const { data: newTournament, error: insertError } = await supabase
      .from('tournaments')
      .insert(tournamentToInsert)
      .select()
      .single();

    if (insertError) {
      console.error('[createTournamentAction] Error inserting tournament:', insertError);
      return { success: false, error: `Failed to create tournament: ${insertError.message}` };
    }

    if (!newTournament) {
        return { success: false, error: 'Tournament created but no data returned.'} 
    }

    // 5. Revalidate paths
    revalidatePath('/my-tournaments');
    revalidatePath(`/my-tournaments/${newTournament.id}`); // For potential direct navigation or future use
    revalidatePath('/tournaments'); // Public listing if exists
    revalidatePath(`/tournaments/${newTournament.id}`); // Public detail page

    console.log('[createTournamentAction] Tournament created successfully:', newTournament);
    // Convert dates to ISO strings to ensure plain object for server action boundaries
    const plainTournament = {
        ...newTournament,
        start_date: newTournament.start_date ? new Date(newTournament.start_date).toISOString() : null,
        end_date: newTournament.end_date ? new Date(newTournament.end_date).toISOString() : null,
        created_at: newTournament.created_at ? new Date(newTournament.created_at).toISOString() : null,
      };

    return { success: true, tournament: plainTournament };

  } catch (e: any) {
    console.error('[createTournamentAction] Unexpected error:', e);
    return { success: false, error: `An unexpected error occurred: ${e.message}` };
  }
}

export async function getTournamentsByUserId(userId: string) {
  const supabase = await createClient();
  const { data: club, error: clubError } = await supabase.from('clubes').select('id, name').eq('user_id', userId).single();
  if (clubError || !club) {
    console.error('[getTournamentsByUserId] Error fetching club:', clubError?.message);
    return [];
  }
  const { data: tournaments, error: tournamentsError } = await supabase.from('tournaments').select('*, clubes (id, name)').eq('club_id', club.id);
  if (tournamentsError) {
    console.error('[getTournamentsByUserId] Error fetching tournaments:', tournamentsError.message);
    return [];
  }
  return tournaments;
}

export async function startTournament(tournamentId: string) {
  const supabase = await createClient();
  console.log(`[startTournament] Iniciando torneo ${tournamentId} (fase de emparejamiento)`);
  const { data: rawTournament, error } = await supabase.from('tournaments').update({ status: 'PAIRING' }).eq('id', tournamentId).select().single();
  if (error) {
    console.error("[startTournament] Error al iniciar torneo:", error);
    throw new Error("No se pudo iniciar el torneo");
  }
  console.log("[startTournament] Torneo iniciado exitosamente (fase de emparejamiento):", rawTournament);

  const plainTournament = rawTournament ? {
    ...rawTournament,
    start_date: rawTournament.start_date ? new Date(rawTournament.start_date).toISOString() : null,
    end_date: rawTournament.end_date ? new Date(rawTournament.end_date).toISOString() : null,
    created_at: rawTournament.created_at ? new Date(rawTournament.created_at).toISOString() : null,
    // Add any other date fields from the tournament table that need conversion
  } : null;

  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath('/tournaments');
  revalidatePath(`/my-tournaments/${tournamentId}`); // Added for consistency
  return { success: true, tournament: plainTournament };
}

export async function startMatches(tournamentId: string) {
  const supabase = await createClient();
  console.log(`[startMatches] Iniciando partidos del torneo ${tournamentId}`);
  const { data, error } = await supabase.from('tournaments').update({ status: 'IN_PROGRESS' }).eq('id', tournamentId).select().single();
  if (error) {
    console.error("[startMatches] Error al iniciar partidos:", error);
    throw new Error("No se pudieron iniciar los partidos del torneo");
  }
  console.log("[startMatches] Partidos iniciados exitosamente:", data);
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath('/tournaments');
  return { success: true, tournament: data };
}

export async function completeTournament(tournamentId: string) {
  const supabase = await createClient();
  console.log(`[completeTournament] Finalizando torneo ${tournamentId}`);
  const { data, error } = await supabase.from('tournaments').update({ 
    status: 'FINISHED',
    end_date: new Date().toISOString()
  }).eq('id', tournamentId).select().single();
  if (error) {
    console.error("[completeTournament] Error al finalizar torneo:", error);
    throw new Error("No se pudo finalizar el torneo");
  }
  
  // Calcular y asignar todos los puntos ahora que el torneo está terminado
  console.log(`[completeTournament] Tournament ${tournamentId} marked as FINISHED, calculating all points...`);
  await _calculateAllTournamentPoints(tournamentId, supabase);
  console.log(`[completeTournament] Points calculation completed for tournament: ${tournamentId}`);
  
  // Generar historial de puntos y ranking para este torneo
  console.log(`[completeTournament] Generating player tournament history...`);
  await generatePlayerTournamentHistory(tournamentId, supabase);
  
  // Crear snapshot semanal del ranking después del torneo
  const currentDate = new Date();
  const weekStart = getWeekStartDate(currentDate);
  console.log(`[completeTournament] Creating weekly ranking snapshot for week: ${weekStart}`);
  await createWeeklyRankingSnapshot(weekStart, supabase);
  
  // Ensure the returned tournament data is plain
  const plainTournament = data ? {
    ...data,
    start_date: data.start_date ? new Date(data.start_date).toISOString() : null,
    end_date: data.end_date ? new Date(data.end_date).toISOString() : null,
    created_at: data.created_at ? new Date(data.created_at).toISOString() : null,
    // Add any other relevant date fields from the tournaments table
  } : null;

  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath('/tournaments');
  revalidatePath(`/my-tournaments/${tournamentId}`); // Added for consistency
  return { success: true, tournament: plainTournament };
}

export async function cancelTournament(tournamentId: string) {
  const supabase = await createClient();
  console.log(`[cancelTournament] Cancelando torneo ${tournamentId}`);
  const { data, error } = await supabase.from('tournaments').update({ status: 'CANCELED' }).eq('id', tournamentId).select().single();
  if (error) {
    console.error("[cancelTournament] Error al cancelar torneo:", error);
    throw new Error("No se pudo cancelar el torneo");
  }
  // Ensure the returned tournament data is plain
  const plainTournament = data ? {
    ...data,
    start_date: data.start_date ? new Date(data.start_date).toISOString() : null,
    end_date: data.end_date ? new Date(data.end_date).toISOString() : null,
    created_at: data.created_at ? new Date(data.created_at).toISOString() : null,
    // Add any other relevant date fields from the tournaments table
  } : null;

  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath('/tournaments');
  revalidatePath(`/my-tournaments/${tournamentId}`);
  return { success: true, tournament: plainTournament };
}

export async function getTournamentById(tournamentId: string) {
  if (!tournamentId) {
    console.warn("[getTournamentById] No tournamentId provided");
    return null;
  }
  const supabase = await createClient();
  const { data: rawTournament, error } = await supabase
    .from('tournaments')
    .select(`
      *, 
      clubes(id, name, address, cover_image_url, phone, email), 
      categories(name)
    `)
    .eq('id', tournamentId)
    .single();
    
  if (error) {
    console.error(`[getTournamentById] Error fetching tournament details for ID ${tournamentId}:`, error.message);
    return null;
  }
  if (!rawTournament) return null;

  // Convert dates to ISO strings to ensure plain object
  const plainTournament = {
    ...rawTournament,
    start_date: rawTournament.start_date ? new Date(rawTournament.start_date).toISOString() : null,
    end_date: rawTournament.end_date ? new Date(rawTournament.end_date).toISOString() : null,
    created_at: rawTournament.created_at ? new Date(rawTournament.created_at).toISOString() : null,
    // Ensure any other date fields are also converted (e.g., if your table has 'updated_at')
  };
  return plainTournament as any; // Cast as any to match original return type if necessary, but it's now plain
}

export async function getMatchesByTournamentId(tournamentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('matches').select('*').eq('tournament_id', tournamentId);
  if (error) throw error;
  return data;
}

export async function getInscriptionsByTournamentId(tournamentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('inscriptions').select('*').eq('tournament_id', tournamentId);
  if (error) throw error;
  return data;
}

export async function getPlayersByTournamentId(tournamentId: string) {
  if (!tournamentId) {
    console.warn("[getPlayersByTournamentId] No tournamentId provided");
    return [];
  }
  const supabase = await createClient();
  const { data: inscriptions, error: inscriptionsError } = await supabase
    .from('inscriptions')
    .select('player_id')
    .eq('tournament_id', tournamentId)
    .is('couple_id', null)
    .eq('is_pending', false); // Only fetch non-pending players

  if (inscriptionsError) {
    console.error(`[getPlayersByTournamentId] Error fetching inscriptions for tournament ${tournamentId}:`, inscriptionsError.message);
    throw inscriptionsError;
  }
  if (!inscriptions || inscriptions.length === 0) return []; 
  const playerIds = inscriptions.map(inscription => inscription.player_id).filter(id => id !== null) as string[];
  if (playerIds.length === 0) return [];
  const { data: players, error: playersError } = await supabase.from('players').select('id, first_name, last_name, score').in('id', playerIds);
  if (playersError) {
    console.error(`[getPlayersByTournamentId] Error fetching player details for tournament ${tournamentId}:`, playersError.message);
    throw playersError;
  }
  return players || [];
}

export async function registerNewPlayerForTournament(tournamentId: string, firstName: string, lastName: string, phone: string, dni: string) {
  const supabase = await createClient();
  // getUserByDni is not defined in this file, assuming it's imported or globally available
  // For this example, I'll mock its expected behavior if it were here.
  // const existingPlayerData = await getUserByDni(dni); 
  console.log(`[registerNewPlayerForTournament] Called with DNI: ${dni}`); 
  // This part needs a proper definition or import of getUserByDni
  // For now, assume a placeholder logic if getUserByDni is not available:
  const { data: existingPlayerByDni, error: playerDniError } = await supabase.from('players').select('id').eq('dni', dni).maybeSingle();
  if(playerDniError && playerDniError.code !== 'PGRST116') { // PGRST116 means 0 rows, which is fine
    console.error("[registerNewPlayerForTournament] Error checking player by DNI:", playerDniError);
    throw new Error ("Error al verificar DNI.");
  }

  let playerId: string | null = existingPlayerByDni?.id || null;

  if (!playerId) {
      // If you intend to create the player here if not found by DNI, that logic would go here.
      // For now, this matches the original behavior of requiring an existing player by DNI (implicitly).
      // Or, more accurately, the original code used getUserByDni which itself might throw or return specific structure.
      // This function as is will fail if player with DNI doesn't exist, which might be intended.
      console.error(`[registerNewPlayerForTournament] Player with DNI ${dni} not found. Original logic might require pre-existing player or getUserByDni handles creation.`);
      throw new Error(`Jugador con DNI ${dni} no encontrado. No se puede inscribir sin un ID de jugador preexistente o creación explícita.`);
  }

  const inscriptionData = { tournament_id: tournamentId, player_id: playerId };
  const { data, error } = await supabase.from('inscriptions').insert(inscriptionData).select().single();
  if (error) {
    console.error("[registerNewPlayerForTournament] Error al registrar jugador:", error.message);
    throw new Error(`No se pudo registrar el jugador: ${error.message}`);
  }
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath(`/my-tournaments/${tournamentId}`);
  return { success: true, inscription: data };
}

export async function registerCoupleForTournament(tournamentId: string, player1Id: string, player2Id: string): Promise<{ success: boolean; error?: string; inscription?: any }> {
  console.log(`[registerCoupleForTournament] Iniciando registro de pareja en torneo ${tournamentId}`, { player1Id, player2Id });
  const supabase = await createClient();
  
  // First, get tournament info to determine category
  const { data: tournamentData, error: tournamentError } = await supabase
    .from('tournaments')
    .select('category_name')
    .eq('id', tournamentId)
    .single();
    
  if (tournamentError) {
    console.error("[registerCoupleForTournament] Error fetching tournament:", tournamentError);
    return { success: false, error: "Error al obtener información del torneo" };
  }
  
  // Determine category name
  const categoryName = tournamentData.category_name || '';
  
  // Check and categorize both players if needed
  if (categoryName) {
    // Categorize player 1
    const categorization1 = await checkAndCategorizePlayer(player1Id, categoryName, supabase);
    if (!categorization1.success) {
      console.error("[registerCoupleForTournament] Error categorizing player 1:", categorization1.message);
      return { success: false, error: categorization1.message };
    }
    
    // Categorize player 2
    const categorization2 = await checkAndCategorizePlayer(player2Id, categoryName, supabase);
    if (!categorization2.success) {
      console.error("[registerCoupleForTournament] Error categorizing player 2:", categorization2.message);
      return { success: false, error: categorization2.message };
    }
    
    if (categorization1.wasCategorized) {
      console.log(`[registerCoupleForTournament] Player 1 ${player1Id} was categorized with score ${categorization1.newScore}`);
    }
    if (categorization2.wasCategorized) {
      console.log(`[registerCoupleForTournament] Player 2 ${player2Id} was categorized with score ${categorization2.newScore}`);
    }
  }

  // Check if either player is already registered in this tournament (individually or in a couple)
  const { data: existingPlayerInscriptions, error: playerCheckError } = await supabase
    .from('inscriptions')
    .select(`
      id, 
      player_id, 
      couple_id,
      couples (
        id,
        player1_id,
        player2_id
      )
    `)
    .eq('tournament_id', tournamentId)
    .eq('is_pending', false)
    .or(`player_id.eq.${player1Id},player_id.eq.${player2Id}`);

  if (playerCheckError) {
    console.error("[registerCoupleForTournament] Error checking existing player inscriptions:", playerCheckError);
    return { success: false, error: "Error al verificar inscripciones existentes." };
  }

  // Check if any player is already inscribed individually
  const individualInscription = existingPlayerInscriptions?.find(inscription => 
    inscription.player_id === player1Id || inscription.player_id === player2Id
  );

  if (individualInscription) {
    const playerName = individualInscription.player_id === player1Id ? "El primer jugador" : "El segundo jugador";
    return { success: false, error: `${playerName} ya está inscrito individualmente en este torneo.` };
  }

  // Check if either player is already in a couple for this tournament
  const { data: existingCoupleInscriptions, error: coupleCheckError } = await supabase
    .from('inscriptions')
    .select(`
      id,
      couples (
        id,
        player1_id,
        player2_id
      )
    `)
    .eq('tournament_id', tournamentId)
    .eq('is_pending', false)
    .not('couple_id', 'is', null);

  if (coupleCheckError) {
    console.error("[registerCoupleForTournament] Error checking existing couple inscriptions:", coupleCheckError);
    return { success: false, error: "Error al verificar parejas existentes." };
  }

  // Check if either player is already in any couple for this tournament
  const playerInCouple = existingCoupleInscriptions?.find(inscription => {
    const couple = inscription.couples;
    if (couple && couple.length > 0) {
      const coupleData = couple[0];
      return coupleData.player1_id === player1Id || 
             coupleData.player1_id === player2Id ||
             coupleData.player2_id === player1Id || 
             coupleData.player2_id === player2Id;
    }
    return false;
  });

  if (playerInCouple) {
    return { success: false, error: "Uno de los jugadores ya está inscrito en otra pareja para este torneo." };
  }

  // Create or find the couple
  const { data: existingCouple, error: findCoupleError } = await supabase
    .from('couples')
    .select('id')
    .or(`and(player1_id.eq.${player1Id},player2_id.eq.${player2Id}),and(player1_id.eq.${player2Id},player2_id.eq.${player1Id})`)
    .maybeSingle();

  if (findCoupleError) {
    console.error("[registerCoupleForTournament] Error checking existing couple:", findCoupleError);
    return { success: false, error: "Error al verificar pareja existente." };
  }

  let coupleIdToInsert: string;
  
  if (existingCouple) {
    coupleIdToInsert = existingCouple.id;
  } else {
    // Create new couple
    const { data: newCouple, error: coupleError } = await supabase
      .from('couples')
      .insert({ player1_id: player1Id, player2_id: player2Id })
      .select('id')
      .single();
    
    if (coupleError || !newCouple?.id) {
      console.error("[registerCoupleForTournament] Error creating couple:", coupleError);
      return { success: false, error: "No se pudo crear la pareja." };
    }
    coupleIdToInsert = newCouple.id;
  }

  // Check for existing inscription for this specific couple
  const { data: existingInscription, error: checkError } = await supabase
    .from('inscriptions')
    .select('id')
    .eq('tournament_id', tournamentId)
    .eq('couple_id', coupleIdToInsert)
    .eq('is_pending', false)
    .maybeSingle();

  if (checkError) {
    console.error("[registerCoupleForTournament] Error checking existing inscription:", checkError);
    return { success: false, error: "Error al verificar inscripción existente." };
  }
  
  if (existingInscription) {
    return { success: false, error: "Esta pareja ya está inscrita en el torneo." };
  }

  // Register the couple
  const { data, error: inscriptionError } = await supabase
    .from('inscriptions')
    .insert({ 
      tournament_id: tournamentId, 
      couple_id: coupleIdToInsert, 
      player_id: player1Id,
      is_pending: false
    })
    .select('id')
    .single(); 
    
  if (inscriptionError) {
    console.error("[registerCoupleForTournament] Error al registrar pareja:", inscriptionError);
    return { success: false, error: "No se pudo inscribir la pareja." };
  }
  
  revalidatePath(`/tournaments/${tournamentId}`);
  return { success: true, inscription: data };
}

export async function getCouplesByTournamentId(tournamentId: string): Promise<any[]> {
  const supabase = await createClient();
  const { data: inscriptionCouples, error: inscriptionsError } = await supabase
    .from('inscriptions')
    .select('couple_id')
    .eq('tournament_id', tournamentId)
    .not('couple_id', 'is', null)
    .eq('is_pending', false); // Only fetch non-pending couples

  if (inscriptionsError) throw inscriptionsError;
  if (!inscriptionCouples || inscriptionCouples.length === 0) return [];
  const coupleIds = inscriptionCouples.map(ins => ins.couple_id).filter(id => id !== null) as string[];
  if (coupleIds.length === 0) return [];
  const { data: couples, error: couplesError } = await supabase.from('couples').select('*').in('id', coupleIds);
  if (couplesError) throw couplesError;
  return couples || [];
}

export async function registerAuthenticatedPlayerForTournament(tournamentId: string, phone?: string): Promise<{ success: boolean; message: string; inscriptionId?: string }> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, message: authError?.message || "Debes iniciar sesión." };
  
  const { data: playerData, error: playerError } = await supabase.from('players').select('id').eq('user_id', user.id).single();
  if (playerError || !playerData?.id) return { success: false, message: playerError?.code === 'PGRST116' ? "Perfil de jugador no encontrado." : "Error buscando perfil." };
  const playerId = playerData.id;

  const { data: existingInscription, error: checkError } = await supabase
    .from('inscriptions')
    .select('id, couple_id, is_pending') // Select is_pending to check its status
    .eq('tournament_id', tournamentId)
    .eq('player_id', playerId)
    // .eq('is_pending', false) // We want to check for ANY inscription by this player, then decide
    .maybeSingle();

  if (checkError) return { success: false, message: `Error al verificar: ${checkError.message}` };
  
  if (existingInscription) {
    if (existingInscription.is_pending) {
        return { success: false, message: "Ya tienes una solicitud de inscripción pendiente para este torneo." };
    }
    return { success: false, message: existingInscription.couple_id ? "Ya inscrito como pareja." : "Ya inscrito." };
  }
  
  const { data: newInscription, error: insertError } = await supabase
    .from('inscriptions')
    .insert({ 
      player_id: playerId, 
      tournament_id: tournamentId, 
      couple_id: null, 
      phone: phone || null, // Guardar el teléfono de contacto
      created_at: new Date().toISOString(),
      is_pending: false // Direct registration is not pending
    })
    .select('id')
    .single();
  if (insertError || !newInscription?.id) return { success: false, message: insertError?.message || "Error al inscribir." };

  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath('/tournaments');
  return { success: true, message: "¡Inscripción exitosa!", inscriptionId: newInscription.id };
}

export async function getTournamentDetailsWithInscriptions(tournamentId: string) {
  const supabase = await createClient();
  const tournament = await getTournamentById(tournamentId);
  console.log("Tournament (from getTournamentDetailsWithInscriptions):", JSON.stringify(tournament, null, 2));
  if (!tournament) return { tournament: null, inscriptions: [] };
  try {
    const { data: rawInscriptions, error: inscriptionsError } = await supabase
      .from('inscriptions')
      .select('*') // Consider selecting specific fields if not all are needed
      .eq('tournament_id', tournamentId)
      .eq('is_pending', false); // Only fetch non-pending inscriptions

    if (inscriptionsError || !rawInscriptions) return { tournament, inscriptions: [] };

    const coupleIds = rawInscriptions.filter(insc => insc.couple_id).map(insc => insc.couple_id).filter(Boolean) as string[];
    let couplesData: any[] = [];
    if (coupleIds.length > 0) {
      const { data, error } = await supabase.from('couples').select('*').in('id', coupleIds);
      if (!error && data) {
        couplesData = data.map(c => ({ 
          ...c, 
          created_at: c.created_at ? new Date(c.created_at).toISOString() : null
          // Add other date conversions for couple fields if any
        }));
      }
    }

    const playerIdsFromInscriptions = rawInscriptions.filter(insc => insc.player_id).map(insc => insc.player_id);
    const playerIdsFromCouples = couplesData.flatMap(c => [c.player1_id, c.player2_id]);
    const uniquePlayerIds = [...new Set([...playerIdsFromInscriptions, ...playerIdsFromCouples].filter(Boolean))] as string[];
    
    let playersData: any[] = [];
    if (uniquePlayerIds.length > 0) {
      const {data, error} = await supabase.from('players').select('*').in('id', uniquePlayerIds);
      if(!error && data) {
        playersData = data.map(p => ({ 
          ...p, 
          created_at: p.created_at ? new Date(p.created_at).toISOString() : null 
          // Add other date conversions for player fields if any
        }));
      }
    }
    
    const playersMap = playersData.reduce((acc, p) => { acc[p.id] = p; return acc; }, {} as {[key: string]: any});
    const couplesWithPlayers = couplesData.map(c => ({ 
      ...c, 
      player1: playersMap[c.player1_id] ? [playersMap[c.player1_id]] : [], 
      player2: playersMap[c.player2_id] ? [playersMap[c.player2_id]] : [] 
    }));
    const couplesMap = couplesWithPlayers.reduce((acc, c) => { acc[c.id] = c; return acc; }, {} as {[key: string]: any});
    
    const processedInscriptions = rawInscriptions.map(i => ({ 
      ...i, 
      created_at: i.created_at ? new Date(i.created_at).toISOString() : null,
      player: i.player_id && playersMap[i.player_id] ? [playersMap[i.player_id]] : [], 
      couple: i.couple_id && couplesMap[i.couple_id] ? [couplesMap[i.couple_id]] : [] 
    }));
    // Explicitly serialize and parse to ensure plain objects for inscriptions
    const finalInscriptions = JSON.parse(JSON.stringify(processedInscriptions));
    console.log("Final Inscriptions (from getTournamentDetailsWithInscriptions):", JSON.stringify(finalInscriptions.slice(0,1), null, 2));
    // Further ensure the entire returned object is plain
    const result = { tournament, inscriptions: finalInscriptions };
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    console.error("[getTournamentDetailsWithInscriptions] Error:", error);
    // Ensure even error returns are consistent if needed, though usually simpler
    const errorResult = { tournament, inscriptions: [] }; 
    return JSON.parse(JSON.stringify(errorResult));
  }
}

export async function registerPlayerForTournament(tournamentId: string, playerId: string) {
  const supabase = await createClient();
  
  // First, get tournament info to determine category
  const { data: tournamentData, error: tournamentError } = await supabase
    .from('tournaments')
    .select('category_name')
    .eq('id', tournamentId)
    .single();
    
  if (tournamentError) {
    console.error("[registerPlayerForTournament] Error fetching tournament:", tournamentError);
    return { success: false, message: "Error al obtener información del torneo" };
  }
  
  // Determine category name
  const categoryName = tournamentData.category_name || '';
  
  // Check and categorize player if needed
  if (categoryName) {
    const categorizationResult = await checkAndCategorizePlayer(playerId, categoryName, supabase);
    
    if (!categorizationResult.success) {
      console.error("[registerPlayerForTournament] Error categorizing player:", categorizationResult.message);
      return { success: false, message: categorizationResult.message };
    }
    
    if (categorizationResult.wasCategorized) {
      console.log(`[registerPlayerForTournament] Player ${playerId} was categorized with score ${categorizationResult.newScore} for category ${categorizationResult.categoryName}`);
    }
  }
  
  const { data: existing, error: checkError } = await supabase
    .from('inscriptions')
    .select('id, is_pending') // Select is_pending
    .eq('tournament_id', tournamentId)
    .eq('player_id', playerId)
    // .eq('is_pending', false) // Check for any, then decide
    .maybeSingle();

  if (checkError) {
      console.error("Error verificando inscripción:", checkError);
      // Return a user-friendly message or rethrow depending on desired behavior
      return { success: false, message: "Error al verificar inscripción existente." }; 
  }
  if (existing) {
      if (existing.is_pending) {
        return { success: false, message: "Jugador ya tiene una solicitud pendiente para este torneo." };
      }
      return { success: false, message: "Jugador ya inscrito." };
  }
  
  const { data, error } = await supabase
    .from('inscriptions')
    .insert({ 
      tournament_id: tournamentId, 
      player_id: playerId, 
      is_pending: false // Direct registration is not pending
    })
    .select()
    .single();
  if (error) {
    console.error("[registerPlayerForTournament] Error:", error);
    // Throwing an error here might be too disruptive if called from UI directly expecting a structured response.
    // Consider returning a structured error like other functions.
    // For now, aligning with original potential to throw:
    // throw new Error("No se pudo registrar."); 
    return { success: false, message: `No se pudo registrar: ${error.message}`}
  }
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath(`/my-tournaments/${tournamentId}`);
  return { success: true, inscription: data };
}
    
export async function createTournamentZonesAction(tournamentId: string, zonesToCreate: ClientZone[]) {
  const supabase = await createClient();
  const createdZonesDbInfo = [];
  for (const zone of zonesToCreate) {
    const { data: newZone, error: zoneError } = await supabase.from('zones').insert({ tournament_id: tournamentId, name: zone.name }).select('id, name').single();
    if (zoneError) return { success: false, error: `Error creando zona ${zone.name}: ${zoneError.message}` };
    if (!newZone) return { success: false, error: `No se pudo crear la zona ${zone.name}.`};
    createdZonesDbInfo.push({ id: newZone.id, name: newZone.name });
    if (zone.couples?.length > 0) {
      const links = zone.couples.map(c => ({ zone_id: newZone.id, couple_id: c.id }));
      const { error: linkError } = await supabase.from('zone_couples').insert(links);
      if (linkError) return { success: false, error: `Error enlazando parejas a ${newZone.name}: ${linkError.message}` };
    }
  }
  return { success: true, createdZones: createdZonesDbInfo };
}

export async function startTournament2(tournamentId: string) {
  const supabase = await createClient();
  let participatingCouples: GeneratedCouple[] = [];
  try {
    const cData = await getCouplesByTournamentId(tournamentId);
    if (cData?.length > 0) participatingCouples = cData.map(c => ({ id: c.id, player_1: c.player1_id, player_2: c.player2_id }));
  } catch (e:any) { return { success: false, error: "Error obteniendo parejas: " + e.message }; }

  let algoZones: GeneratedZone[] = [];
  if (participatingCouples.length > 0) {
    try { algoZones = generateZones(participatingCouples); }
    catch (e:any) { return { success: false, error: "Error generando zonas: " + e.message }; }
  }

  let savedZonesForMatches: { id: string; name: string; couples: GeneratedCouple[] }[] = [];
  if (algoZones.length > 0) {
    const clientZones = algoZones.map(az => ({ name: az.name, couples: az.couples.map(c => ({ id: c.id })) }));
    const zoneCreateRes = await createTournamentZonesAction(tournamentId, clientZones);
    if (!zoneCreateRes.success || !zoneCreateRes.createdZones) return { success: false, error: "Error guardando zonas: " + (zoneCreateRes.error || "Resultado inesperado") };
    
    savedZonesForMatches = zoneCreateRes.createdZones.map(dbZone => {
        const origZone = algoZones.find(az => az.name === dbZone.name);
        return origZone ? { id: dbZone.id, name: dbZone.name, couples: origZone.couples } : null;
    }).filter(Boolean) as any; // any cast to simplify if types are slightly off from dbZone vs algoZone structures
  }

  if (savedZonesForMatches.length > 0) {
    const matchCreateRes = await createTournamentZoneMatchesAction(tournamentId, savedZonesForMatches);
    if (!matchCreateRes.success) return { success: false, error: "Error creando partidos de zona: " + (matchCreateRes.error || "Resultado inesperado") };
  }
  
  const { data: rawUpdatedTourn, error: statError } = await supabase.from('tournaments').update({ status: 'IN_PROGRESS' }).eq('id', tournamentId).select().single();
  if (statError) return { success: false, error: "Error actualizando estado: " + statError.message };

  const plainUpdatedTourn = rawUpdatedTourn ? {
    ...rawUpdatedTourn,
    start_date: rawUpdatedTourn.start_date ? new Date(rawUpdatedTourn.start_date).toISOString() : null,
    end_date: rawUpdatedTourn.end_date ? new Date(rawUpdatedTourn.end_date).toISOString() : null,
    created_at: rawUpdatedTourn.created_at ? new Date(rawUpdatedTourn.created_at).toISOString() : null,
    // Add any other date fields from the tournament table that need conversion
  } : null;

  revalidatePath(`/my-tournaments/${tournamentId}`);
  revalidatePath(`/tournaments/${tournamentId}`);
  return { success: true, tournament: plainUpdatedTourn };
}

export async function fetchTournamentZones(tournamentId: string) {
  const supabase = await createClient();
  try {
    const { data: zones, error: zonesError } = await supabase.from("zones").select("*").eq("tournament_id", tournamentId).order("name");
    if (zonesError || !zones) return { success: false, error: zonesError?.message || "Error obteniendo zonas" };

    const zonesWithCouples = await Promise.all(
      zones.map(async (zone) => {
        const { data: links, error: linkError } = await supabase.from("zone_couples").select("couple_id").eq("zone_id", zone.id);
        if (linkError || !links) return { ...zone, couples: [] };
        const coupleIds = links.map(l => l.couple_id);
        if (coupleIds.length === 0) return { ...zone, couples: [] };

        const { data: couples, error: cError } = await supabase.from("couples").select(`*,player1:players!couples_player1_id_fkey(id,first_name,last_name,score),player2:players!couples_player2_id_fkey(id,first_name,last_name,score)`).in("id", coupleIds);
        if (cError || !couples) return { ...zone, couples: [] };

        // Fetch all matches for this zone to use in head-to-head calculation
        const { data: zoneMatches, error: zoneMatchesError } = await supabase
          .from("matches")
          .select("couple1_id, couple2_id, winner_id, status")
          .eq("zone_id", zone.id)
          .eq("status", "COMPLETED");

        const couplesWithStats = await Promise.all(
          couples.map(async (couple) => {
            const { data: matches, error: mError } = await supabase.from("matches").select("*").eq("zone_id", zone.id).or(`couple1_id.eq.${couple.id},couple2_id.eq.${couple.id}`).eq("status", "COMPLETED");
            let p=0,w=0,l=0,s=0,c=0,pts=0;
            if (!mError && matches) {
              matches.forEach(m => {
                p++;
                const result1 = parseInt(m.result_couple1) || 0;
                const result2 = parseInt(m.result_couple2) || 0;
                if (m.couple1_id === couple.id) { 
                  s += result1; 
                  c += result2; 
                  if (m.winner_id === couple.id) w++; else l++; 
                }
                else { 
                  s += result2; 
                  c += result1; 
                  if (m.winner_id === couple.id) w++; else l++; 
                }
              });
              pts = w * POINTS_FOR_WINNING_MATCH + l * Math.abs(POINTS_FOR_LOSING_MATCH); // Usar valor absoluto para el cálculo de zonas
            }
            return { 
              ...couple, 
              player1_name: `${couple.player1?.first_name||""} ${couple.player1?.last_name||""}`.trim(), 
              player2_name: `${couple.player2?.first_name||""} ${couple.player2?.last_name||""}`.trim(), 
              stats: { played:p, won:w, lost:l, scored:s, conceded:c, points:pts } 
            } as CoupleWithExtendedStats;
          })
        );
        
        // Use unified sorting function with head-to-head support
        const sortedCouples = sortCouplesInZone(
          couplesWithStats, 
          zoneMatchesError ? [] : (zoneMatches || [])
        );
        return { ...zone, couples: sortedCouples };
      })
    );
    return { success: true, zones: zonesWithCouples };
  } catch (e:any) { return { success: false, error: e.message || "Error inesperado obteniendo zonas" }; }
}

export async function fetchTournamentMatches(tournamentId: string) {
  const supabase = await createClient();
  try {
    const { data: matches, error } = await supabase.from("matches").select(`*,zone_info:zone_id(name),couple1:couples!matches_couple1_id_fkey(id,player1_id,player2_id,player1_details:players!couples_player1_id_fkey(id,first_name,last_name),player2_details:players!couples_player2_id_fkey(id,first_name,last_name)),couple2:couples!matches_couple2_id_fkey(id,player1_id,player2_id,player1_details:players!couples_player1_id_fkey(id,first_name,last_name),player2_details:players!couples_player2_id_fkey(id,first_name,last_name))`).eq("tournament_id", tournamentId).order("created_at");
    if (error || !matches) return { success: false, error: error?.message || "Error obteniendo partidos" };
    const pMatches = matches.map(m => ({ ...m, zone_name: m.zone_info?.name, couple1_player1_name: `${m.couple1?.player1_details?.first_name||""} ${m.couple1?.player1_details?.last_name||""}`.trim(), couple1_player2_name: `${m.couple1?.player2_details?.first_name||""} ${m.couple1?.player2_details?.last_name||""}`.trim(), couple2_player1_name: `${m.couple2?.player1_details?.first_name||""} ${m.couple2?.player1_details?.last_name||""}`.trim(), couple2_player2_name: `${m.couple2?.player2_details?.first_name||""} ${m.couple2?.player2_details?.last_name||""}`.trim() }));
    return { success: true, matches: pMatches };
  } catch (e:any) { return { success: false, error: e.message || "Error inesperado obteniendo partidos" }; }
}

// --- ACTION: updateMatchResult (Refactored) ---
export async function updateMatchResult({ matchId, result_couple1, result_couple2, winner_id }: UpdateMatchResultParams) {
  const supabase = await createClient();
  try {
    const { error: updateError } = await supabase.from("matches").update({ result_couple1, result_couple2, winner_id, status: "COMPLETED" }).eq("id", matchId);
    if (updateError) return { success: false, error: `Error actualizando resultado: ${updateError.message}` };

    let tournamentIdForReval: string | null = null;
    const { data: updatedMatch, error: fetchMatchError } = await supabase.from("matches").select("tournament_id, couple1_id, couple2_id, winner_id, round, status").eq("id", matchId).single(); // Added 'status' to select

    if (!fetchMatchError && updatedMatch) {
      tournamentIdForReval = updatedMatch.tournament_id;
      const { couple1_id, couple2_id, winner_id: actualWinnerCoupleId } = updatedMatch;
      let winningCoupleId_param: string | null = null;
      let losingCoupleId_param: string | null = null;

      if (actualWinnerCoupleId) {
        if (couple1_id === actualWinnerCoupleId) { winningCoupleId_param = couple1_id; losingCoupleId_param = couple2_id; }
        else if (couple2_id === actualWinnerCoupleId) { winningCoupleId_param = couple2_id; losingCoupleId_param = couple1_id; }
        
        if (winningCoupleId_param) {
          await _calculateAndApplyScoreChanges(winningCoupleId_param, losingCoupleId_param, supabase, tournamentIdForReval || undefined, updatedMatch.round);
        }
      } else { 
          console.warn(`[updateMatchResult] Match ${matchId} completed without a winner_id in DB. Applying fixed points for participation.`);
          const couplesInvolved = [couple1_id, couple2_id].filter(Boolean) as string[];
          for (const cId of couplesInvolved) {
              const {data: cDetails} = await supabase.from('couples').select('player1_id, player2_id').eq('id', cId).single();
              if(cDetails?.player1_id) await _updatePlayerScore(cDetails.player1_id, POINTS_FOR_LOSING_MATCH, supabase);
              if(cDetails?.player2_id) await _updatePlayerScore(cDetails.player2_id, POINTS_FOR_LOSING_MATCH, supabase);
          }
      }
    } else if (fetchMatchError) {
        console.error("[updateMatchResult] Error fetching updated match details for score update:", fetchMatchError.message);
    }
    
    if (!tournamentIdForReval && updatedMatch) { // If somehow tournamentIdForReval is still null but we have updatedMatch
        tournamentIdForReval = updatedMatch.tournament_id;
    }

    if (tournamentIdForReval) {
      revalidatePath(`/my-tournaments/${tournamentIdForReval}`);
      revalidatePath(`/tournaments/${tournamentIdForReval}`);
    }

    // Paso 3: Si el partido es la final y se completó, actualizar el estado del torneo
    // Usar updatedMatch aquí es mejor porque refleja el estado DESPUÉS de la actualización del partido (status: COMPLETED)
    if (updatedMatch && updatedMatch.round === 'FINAL' && updatedMatch.status === 'COMPLETED') { // Asegurarse de que el partido realmente se completó
      console.log('[updateMatchResult] Match is FINAL and COMPLETED. Tournament ID:', updatedMatch.tournament_id, 'Winner couple_id:', winner_id);
      
      const { data: tournamentBeforeUpdate, error: fetchTournamentError } = await supabase
        .from('tournaments')
        .select('status, winner_id') // Select winner_id as well for complete check
        .eq('id', updatedMatch.tournament_id)
        .single();

      if (fetchTournamentError) {
        console.error('[updateMatchResult] Error fetching tournament status before update:', fetchTournamentError);
        // No detenemos el proceso, pero registramos el error. La actualización del partido fue exitosa.
      } else if (tournamentBeforeUpdate && tournamentBeforeUpdate.status === 'FINISHED' && tournamentBeforeUpdate.winner_id === winner_id) {
        console.log('[updateMatchResult] Tournament already marked as FINISHED with the correct winner. No update needed.');
      } else {
        const { error: tournamentUpdateError } = await supabase
          .from('tournaments')
          .update({ 
            status: 'FINISHED', // Confirmado desde la estructura de la tabla
            winner_id: winner_id,   // Asignar el couple_id del ganador de la final
            end_date: new Date().toISOString()  // Establecer fecha de finalización
          })
          .eq('id', updatedMatch.tournament_id);

        if (tournamentUpdateError) {
          console.error('[updateMatchResult] Error updating tournament status to FINISHED:', tournamentUpdateError);
        } else {
          console.log('[updateMatchResult] Tournament status updated to FINISHED and winner_id set for tournament_id:', updatedMatch.tournament_id);
          
          // Calcular y asignar todos los puntos ahora que el torneo está terminado
          console.log('[updateMatchResult] Tournament finished, calculating all points...');
          await _calculateAllTournamentPoints(updatedMatch.tournament_id, supabase);
          console.log('[updateMatchResult] Points calculation completed for tournament:', updatedMatch.tournament_id);
        }
      }
    }

    return { success: true };
  } catch (error:any) { return { success: false, error: error.message || "Error inesperado actualizando resultado" }; }
}

// --- ACTION: createTournamentZoneMatchesAction (Refactored) ---
export async function createTournamentZoneMatchesAction(
  tournamentId: string,
  zones: { id: string; name: string; couples: GeneratedCouple[] }[]
) {
  const supabase = await createClient();
  const createdMatchResults: any[] = [];
  let allGeneratedMatchData: GenericMatchInsertData[] = [];

  for (const zone of zones) {
    const matchesForThisZone = generateMatchesForZoneLogic(zone, tournamentId);
    allGeneratedMatchData.push(...matchesForThisZone);
  }

  if (allGeneratedMatchData.length > 0) {
    for (const matchData of allGeneratedMatchData) {
      const result = await _createMatch(supabase, matchData);
      if (result.success && result.match) {
        createdMatchResults.push(result.match);
      } else {
        console.error(`[createTournamentZoneMatchesAction] Failed to create match: ${result.error}`, matchData);
        return { success: false, error: `Failed to create one or more zone matches. Last error: ${result.error}`, createdMatches: createdMatchResults };
      }
    }
    console.log(`[createTournamentZoneMatchesAction] Successfully created ${createdMatchResults.length} zone matches.`);
    return { success: true, matches: createdMatchResults };
  } else {
    console.log('[createTournamentZoneMachesAction] No zone matches were generated to insert.');
    return { success: true, matches: [] };
  }
}

// --- ACTION: createKnockoutStageMatchesAction (Refactored) ---
export async function createKnockoutStageMatchesAction(tournamentId: string) {
  const supabase = await createClient();
  console.log(`[createKnockoutStageMatchesAction] Starting for tournament: ${tournamentId}`);

  try {
    const { data: tData, error: tError } = await supabase
      .from('tournaments')
      .select('id, status, max_participants') // Assuming max_participants helps determine bracket size
      .eq('id', tournamentId)
      .single();

    if (tError || !tData) {
      console.error("[createKnockoutStageMatchesAction] Error fetching tournament data:", tError);
      return { success: false, error: (tError?.message || "Error obteniendo datos del torneo.") };
    }

    // Ensure tournament is in a state where knockout can begin
    // (e.g., after zones are completed or if it's a direct knockout tournament)
    // This status check might need to be more robust based on your tournament flow
    if (tData.status !== 'IN_PROGRESS' && tData.status !== 'ZONE_COMPLETED') {
         // Allow 'NOT_STARTED' if you want to create initial bracket for direct knockout from this action
        if (tData.status !== 'NOT_STARTED') {
             console.warn(`[createKnockoutStageMatchesAction] Tournament status is ${tData.status}, expected IN_PROGRESS or ZONE_COMPLETED (or NOT_STARTED for initial setup).`);
            return { success: false, error: `El torneo no está en un estado válido para generar llaves (actual: ${tData.status}).` };
        }
    }

    // 1. Populate/Ensure seeds are up-to-date
    const seedingResult = await populateTournamentSeedCouples(tournamentId);
    if (!seedingResult.success || !seedingResult.seededCouples) {
      console.error("[createKnockoutStageMatchesAction] Seeding failed:", seedingResult.error);
      return { success: false, error: seedingResult.error || "Falló la generación de cabezas de serie." };
    }

    if (seedingResult.seededCouples.length === 0) {
      console.log("[createKnockoutStageMatchesAction] No seeded couples found after population.");
      return { success: true, message: "No hay parejas clasificadas para generar llaves.", matches: [] };
    }

    // Fetch the successfully seeded couples, ordered by seed
    const { data: rankedCouples, error: fetchSeedsError } = await supabase
      .from('tournament_couple_seeds')
      .select('*, couple:couples(*, player1_details:players!couples_player1_id_fkey(first_name, last_name), player2_details:players!couples_player2_id_fkey(first_name, last_name))')
      .eq('tournament_id', tournamentId)
      .order('seed', { ascending: true });

    if (fetchSeedsError || !rankedCouples) {
      console.error("[createKnockoutStageMatchesAction] Error fetching seeded couples:", fetchSeedsError);
      return { success: false, error: "Error obteniendo cabezas de serie de la base de datos." };
    }

    if (rankedCouples.length === 0) {
        console.log("[createKnockoutStageMatchesAction] No ranked couples retrieved from DB even after seeding.");
        return { success: true, message: "No hay parejas sembradas para generar llaves (post-fetch).", matches: [] };
    }

    console.log(`[createKnockoutStageMatchesAction] Fetched ${rankedCouples.length} seeded couples for bracket generation.`);

    // 2. Determine bracket size and initial round name
    let numCouples = rankedCouples.length;
    let bracketSize = 2;
    while (bracketSize < numCouples) {
      bracketSize *= 2;
    }
    // If numCouples is, for example, 5, bracketSize becomes 8.
    // If numCouples is 8, bracketSize remains 8.

    const roundsMap: { [key: number]: string } = {
      2: "FINAL",
      4: "SEMIFINAL",
      8: "4TOS",      // Cuartos de Final
      16: "8VOS",     // Octavos de Final
      32: "16VOS",    // 16avos de Final
      64: "32VOS",    // 32avos de Final
    };
    const initialRoundName = roundsMap[bracketSize] || `RONDA_DE_${bracketSize}`;
    console.log(`[createKnockoutStageMatchesAction] Bracket size: ${bracketSize}, Initial round: ${initialRoundName}`);


    // 3. Assign BYEs if necessary and prepare for pairing
    const byesToAssign = bracketSize - numCouples;
    // const participants: ({ type: 'couple'; data: any } | { type: 'bye'; seed: number; couple_id_for_bye?: string })[] = []; // Old participants array

    // rankedCouples ya está ordenado por seed (del 1 al N, donde N es numCouples)
    // rankedCouples[0] es el sembrado 1, rankedCouples[numCouples-1] es el sembrado N.

    const actualParticipantsForPairing: ({ type: 'couple'; data: any; seed: number } | { type: 'bye'; seed: number; couple_id_for_bye?: string })[] = [];
    
    for (let i = 0; i < bracketSize; i++) {
        const currentSeedInBracketSlot = i + 1; // El "puesto" en el cuadro que estamos llenando (1 a bracketSize)

        if (currentSeedInBracketSlot <= byesToAssign) {
            // Estos son los BYEs explícitos para los N mejores sembrados que reciben BYE directamente.
            // Asumimos que rankedCouples[currentSeedInBracketSlot - 1] es la pareja que recibe este BYE.
            const coupleGettingBye = rankedCouples[currentSeedInBracketSlot - 1];
            actualParticipantsForPairing.push({ 
                type: 'bye', 
                seed: coupleGettingBye.seed, // Usamos el seed real de la pareja
                couple_id_for_bye: coupleGettingBye.couple_id 
            });
            console.log(`[createKnockoutStageMatchesAction] Slot ${currentSeedInBracketSlot} (BYE): Seed ${coupleGettingBye.seed} (Couple ID: ${coupleGettingBye.couple_id})`);
        } else if (currentSeedInBracketSlot <= numCouples) {
            // Estos son los puestos para las parejas que SÍ juegan en esta ronda inicial.
            // Son las parejas restantes después de asignar los BYEs.
            // Ejemplo: Si hay 9 parejas y 7 BYEs, las parejas que juegan son la 8va y 9na.
            // rankedCouples[currentSeedInBracketSlot - 1] corresponde a estas parejas.
            const couplePlaying = rankedCouples[currentSeedInBracketSlot - 1];
            actualParticipantsForPairing.push({ 
                type: 'couple', 
                data: couplePlaying, 
                seed: couplePlaying.seed // Usamos el seed real de la pareja
            });
            console.log(`[createKnockoutStageMatchesAction] Slot ${currentSeedInBracketSlot} (COUPLE): Seed ${couplePlaying.seed} (Couple ID: ${couplePlaying.couple_id})`);
        } else {
            // Estos son los puestos "vacíos" del cuadro contra los que los BYEs de arriba jugarían si el cuadro estuviera lleno.
            // Los tratamos como BYEs también para el propósito del emparejamiento.
            actualParticipantsForPairing.push({ 
                type: 'bye', 
                seed: currentSeedInBracketSlot, // Este es un "seed teórico" del puesto vacío en el cuadro
                couple_id_for_bye: undefined // No hay una pareja real aquí
            });
            console.log(`[createKnockoutStageMatchesAction] Slot ${currentSeedInBracketSlot} (EMPTY SLOT / Theoretical BYE): Seed ${currentSeedInBracketSlot}`);
        }
    }
    
    // DEBUG: Verificar el contenido de actualParticipantsForPairing
    console.log("[createKnockoutStageMatchesAction] actualParticipantsForPairing constructed:", JSON.stringify(actualParticipantsForPairing.map(p => ({type: p.type, seed: p.seed, id: p.type === 'couple' ? p.data.couple_id : p.couple_id_for_bye})), null, 2));


    // ELIMINAR la lógica anterior de 'actualParticipantsForPairing' que causaba errores.
    // const actualParticipantsForPairing: ({ type: 'couple'; data: any } | { type: 'bye'; seed: number; couple_id_for_bye?: string })[] = [];
    // let byeCouplesProcessed = 0;
    // let matchCouplesProcessed = 0;
    // for(let i = 0; i < bracketSize; i++) { ... } // ESTO SE VA

    const matchesToInsertData: GenericMatchInsertData[] = [];
    let matchOrderInRound = 0;

    // Custom pairing using the specified distribution pattern
    // This creates the desired bracket layout with second best seed at bottom
    const customPairingIndices = getCustomPairingIndices(bracketSize);
    
    for (let i = 0; i < bracketSize / 2; i++) {
      const participant1Index = customPairingIndices[i * 2];
      const participant2Index = customPairingIndices[i * 2 + 1];
      
      const participant1Data = actualParticipantsForPairing[participant1Index];
      const participant2Data = actualParticipantsForPairing[participant2Index];

      // Asegurarse de que participant1Data y participant2Data no sean undefined
      if (!participant1Data || !participant2Data) {
          console.error(`[createKnockoutStageMatchesAction] Error crítico: participante no encontrado para emparejamiento. Index i: ${i}`);
          continue; // Saltar este par
      }
      
      console.log(`[createKnockoutStageMatchesAction] Attempting to pair: Index ${participant1Index} (Seed ${participant1Data.seed}) vs Index ${participant2Index} (Seed ${participant2Data.seed}) for Match ${i}`);

      let couple1_id: string | null = null;
      let couple2_id: string | null = null;
      let status = 'NOT_STARTED';
      let winner_id: string | null = null;

      if (participant1Data.type === 'couple') couple1_id = participant1Data.data.couple_id;
      else if (participant1Data.type === 'bye' && participant1Data.couple_id_for_bye) couple1_id = participant1Data.couple_id_for_bye; // Un BYE con pareja asignada

      if (participant2Data.type === 'couple') couple2_id = participant2Data.data.couple_id;
      else if (participant2Data.type === 'bye' && participant2Data.couple_id_for_bye) couple2_id = participant2Data.couple_id_for_bye; // Un BYE con pareja asignada
      
      // Caso 1: Pareja vs Pareja
      if (participant1Data.type === 'couple' && participant2Data.type === 'couple') {
        status = 'NOT_STARTED';
        winner_id = null;
        console.log(`[createKnockoutStageMatchesAction] Match ${matchOrderInRound + 1} (Order ${matchOrderInRound}): Couple Seed ${participant1Data.seed} (ID: ${couple1_id}) vs Couple Seed ${participant2Data.seed} (ID: ${couple2_id})`);
      } 
      // Caso 2: Pareja (P1) vs BYE implícito (P2 es un 'bye' sin couple_id_for_bye)
      else if (participant1Data.type === 'couple' && participant2Data.type === 'bye' && !participant2Data.couple_id_for_bye) {
        status = 'COMPLETED'; // P1 avanza por BYE
        winner_id = couple1_id;
        couple2_id = null; // No hay oponente real
        console.log(`[createKnockoutStageMatchesAction] Match ${matchOrderInRound + 1} (Order ${matchOrderInRound}): Couple Seed ${participant1Data.seed} (ID: ${couple1_id}) gets BYE (vs empty slot ${participant2Data.seed})`);
      }
      // Caso 3: BYE implícito (P1 es 'bye' sin couple_id_for_bye) vs Pareja (P2)
      else if (participant1Data.type === 'bye' && !participant1Data.couple_id_for_bye && participant2Data.type === 'couple') {
        status = 'COMPLETED'; // P2 avanza por BYE
        winner_id = couple2_id;
        couple1_id = null; // No hay oponente real
        console.log(`[createKnockoutStageMatchesAction] Match ${matchOrderInRound + 1} (Order ${matchOrderInRound}): Couple Seed ${participant2Data.seed} (ID: ${couple2_id}) gets BYE (vs empty slot ${participant1Data.seed})`);
      }
      // Caso 4: Pareja que recibió BYE (P1) vs BYE implícito (P2) -> P1 avanza
      else if (participant1Data.type === 'bye' && participant1Data.couple_id_for_bye && participant2Data.type === 'bye' && !participant2Data.couple_id_for_bye) {
        status = 'COMPLETED';
        winner_id = participant1Data.couple_id_for_bye; // La pareja que tenía el BYE avanza
        couple1_id = participant1Data.couple_id_for_bye;
        couple2_id = null;
        console.log(`[createKnockoutStageMatchesAction] Match ${matchOrderInRound + 1} (Order ${matchOrderInRound}): Seeded BYE ${participant1Data.seed} (ID: ${winner_id}) advances (vs empty slot ${participant2Data.seed})`);
      }
      // Caso 5: BYE implícito (P1) vs Pareja que recibió BYE (P2) -> P2 avanza
      else if (participant1Data.type === 'bye' && !participant1Data.couple_id_for_bye && participant2Data.type === 'bye' && participant2Data.couple_id_for_bye) {
        status = 'COMPLETED';
        winner_id = participant2Data.couple_id_for_bye; // La pareja que tenía el BYE avanza
        couple1_id = null;
        couple2_id = participant2Data.couple_id_for_bye;
        console.log(`[createKnockoutStageMatchesAction] Match ${matchOrderInRound + 1} (Order ${matchOrderInRound}): Seeded BYE ${participant2Data.seed} (ID: ${winner_id}) advances (vs empty slot ${participant1Data.seed})`);
      }
      // Caso 6: BYE vs BYE (ambos son 'bye' y tienen couple_id_for_bye - esto no debería pasar si los BYEs son solo para los mejores N)
      // O BYE implícito vs BYE implícito - esto se salta
      else if (participant1Data.type === 'bye' && participant2Data.type === 'bye') {
         if (!participant1Data.couple_id_for_bye && !participant2Data.couple_id_for_bye) {
            console.log(`[createKnockoutStageMatchesAction] Skipping EMPTY SLOT vs EMPTY SLOT for theoretical seeds ${participant1Data.seed} and ${participant2Data.seed}`);
            continue; // No crear partido para dos slots vacíos
         } else {
            // Si uno tiene couple_id_for_bye y el otro no, ya está cubierto arriba.
            // Si AMBOS tienen couple_id_for_bye, es un error de lógica de asignación de BYEs.
            console.warn(`[createKnockoutStageMatchesAction] Potentially problematic BYE vs BYE scenario: P1 Seed ${participant1Data.seed}, P2 Seed ${participant2Data.seed}. Skipping match creation.`);
            continue;
         }
      }
      else {
          console.warn(`[createKnockoutStageMatchesAction] Unhandled pairing scenario for Slot ${i+1} (Seed ${participant1Data.seed}, Type ${participant1Data.type}) vs Slot ${bracketSize-i} (Seed ${participant2Data.seed},  Type ${participant2Data.type}). Skipping.`);
          continue; // Saltar si no es un caso manejado
      }

      matchesToInsertData.push({
        tournament_id: tournamentId,
        couple1_id: couple1_id,
        couple2_id: couple2_id,
        round: initialRoundName,
        status: status,
        order: matchOrderInRound,
        winner_id: winner_id,
      });
      matchOrderInRound++;
    }

    if (matchesToInsertData.length === 0 && rankedCouples.length > 0) {
      // This might happen if only one couple qualifies, they are the winner.
      if (rankedCouples.length === 1) {
         console.log(`[createKnockoutStageMatchesAction] Only one seeded couple (${rankedCouples[0].couple_id}), they are the tournament winner.`);
         // Update tournament status to FINISHED and set winner_id
         await supabase.from('tournaments').update({ 
           status: 'FINISHED', 
           winner_id: rankedCouples[0].couple_id,
           end_date: new Date().toISOString()
         }).eq('id', tournamentId);
         
         // Calcular y asignar todos los puntos ahora que el torneo está terminado
         console.log(`[createKnockoutStageMatchesAction] Tournament ${tournamentId} finished with single winner, calculating all points...`);
         await _calculateAllTournamentPoints(tournamentId, supabase);
         console.log(`[createKnockoutStageMatchesAction] Points calculation completed for tournament: ${tournamentId}`);
         
         return { success: true, message: `El torneo ha finalizado. Ganador: ${rankedCouples[0].couple?.player1_details?.first_name}/${rankedCouples[0].couple?.player2_details?.first_name}.`, matches: [] };
      }
      console.log("[createKnockoutStageMatchesAction] No matches generated, though there were ranked couples. Check pairing logic for byes.");
      return { success: true, message: "No se generaron partidos de llave (posiblemente solo BYEs o un ganador directo).", matches: [] };
    }

    // 4. Clear existing ELIMINATION matches for this tournament before inserting new ones
    const { error: deleteOldMatchesError } = await supabase
      .from('matches')
      .delete()
      .eq('tournament_id', tournamentId)
      .neq('round', 'ZONE'); // <-- MODIFIED: Delete if round is NOT 'ZONE'

    if (deleteOldMatchesError) {
      console.error("[createKnockoutStageMatchesAction] Error deleting old elimination matches:", deleteOldMatchesError);
      return { success: false, error: `Error limpiando partidos de llave antiguos: ${deleteOldMatchesError.message}` };
    }
    console.log("[createKnockoutStageMatchesAction] Deleted old elimination matches.");

    // 5. Insert new matches
    const createdMatches: any[] = [];
    for (const matchData of matchesToInsertData) {
      const result = await _createMatch(supabase, matchData); // Assuming _createMatch handles insert and returns {success, match, error}
      if (result.success && result.match) {
        createdMatches.push(result.match);
        if (matchData.status === 'COMPLETED' && matchData.winner_id) { 
          // BYE matches do NOT award points - players advance automatically without playing
          // await _calculateAndApplyScoreChanges(matchData.winner_id, null, supabase); // BYE matches don't award points
          console.log(`[createKnockoutStageMatchesAction] BYE match created for ${matchData.winner_id}, no points awarded.`);
        }
      } else {
        console.error("[createKnockoutStageMatchesAction] Error inserting knockout match:", result.error, "MatchData:", matchData);
        return { success: false, error: `Error insertando partidos de llave: ${result.error}` };
      }
    }

    // Update tournament status if it was NOT_STARTED and now has a bracket
    if (tData.status === 'NOT_STARTED' && createdMatches.length > 0) {
        await supabase.from('tournaments').update({ status: 'IN_PROGRESS' }).eq('id', tournamentId);
        console.log("[createKnockoutStageMatchesAction] Tournament status updated to IN_PROGRESS.");
    } else if (tData.status === 'ZONE_COMPLETED' && createdMatches.length > 0) {
        // Potentially update to a new status like 'KNOCKOUT_STARTED' or keep 'IN_PROGRESS'
        // For now, we assume IN_PROGRESS covers this.
    }

    revalidatePath(`/my-tournaments/${tournamentId}`);
    revalidatePath(`/tournaments/${tournamentId}`);
    console.log(`[createKnockoutStageMatchesAction] Creados ${createdMatches.length} partidos de eliminatoria para la ronda ${initialRoundName}.`);
    return { success: true, message: "Partidos de eliminatoria generados.", matches: createdMatches };

  } catch (e: any) {
    console.error("[createKnockoutStageMatchesAction] Unexpected error:", e);
    return { success: false, error: `Error inesperado generando llaves: ${e.message}` };
  }
}

// --- ACTION: advanceToNextStageAction (Refactored) ---
export async function advanceToNextStageAction(tournamentId: string) {
  const supabase = await createClient();
  try {
    const { data: matchesFromDB, error: mError } = await supabase.from("matches").select("*").eq("tournament_id", tournamentId).order("created_at"); // Renamed to avoid conflict
    if (mError || !matchesFromDB) return { success: false, error: mError?.message || "Error obteniendo partidos." };

    const roundOrder = ["32VOS", "16VOS", "8VOS", "4TOS", "SEMIFINAL", "FINAL"];
    let currentRound = "";
    for (const r of roundOrder) { if (matchesFromDB.some(m => m.round === r)) currentRound = r; }
    if (!currentRound) return { success: false, error: "No se pudo determinar ronda actual." };
    
    const currentRoundIdx = roundOrder.indexOf(currentRound);
    if (currentRound === "FINAL") return { success: true, message: "Torneo finalizado.", isFinal: true };
    
    const nextRound = roundOrder[currentRoundIdx + 1];
    const currentRMatches = matchesFromDB.filter(m => m.round === currentRound && m.round !== 'ZONE');

    console.log(`[advanceToNextStageAction] Current Round: ${currentRound}, Next Round: ${nextRound}`);
    console.log(`[advanceToNextStageAction] currentRMatches count: ${currentRMatches.length}`);
    console.log(`[advanceToNextStageAction] currentRMatches (first 3):`, JSON.stringify(currentRMatches.slice(0,3), null, 2));

    if (!currentRMatches.every(m => m.status === "COMPLETED")) {
        console.error("[advanceToNextStageAction] Not all current round matches are completed. Uncompleted matches:", 
            JSON.stringify(currentRMatches.filter(m => m.status !== "COMPLETED"), null, 2)
        );
        return { success: false, error: "No todos los partidos de la ronda actual están completados." };
    }

    const winners = currentRMatches
        .filter(m => m.winner_id)
        .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity))
        .map(m => ({ 
            winnerId: m.winner_id as string, 
            originalMatchOrder: m.order, 
            coupleData: m.winner_id === m.couple1_id ? m.couple1 : m.couple2 // For logging names
        })); 

    console.log(`[advanceToNextStageAction] Number of winners identified: ${winners.length}`);
    console.log(`[advanceToNextStageAction] Winners (IDs and originalMatchOrder):`, JSON.stringify(winners, null, 2));

    if (winners.length === 0 && currentRMatches.length > 0) {
        return { success: false, error: "No hay ganadores en la ronda actual para avanzar." };
    }
    
    // If only one winner remains and it's not the final match being processed, they are the tournament winner.
    if (winners.length === 1 && currentRound !== "SEMIFINAL") { // Assuming SEMIFINAL leads to FINAL match
        const tournamentWinner = winners[0];
        await supabase.from('tournaments').update({ 
          status: 'FINISHED', 
          winner_id: tournamentWinner.winnerId,
          end_date: new Date().toISOString()
        }).eq('id', tournamentId);
        console.log(`[advanceToNextStageAction] Tournament ${tournamentId} concluded. Winner: ${tournamentWinner.winnerId}`);
        revalidatePath(`/my-tournaments/${tournamentId}`);
        revalidatePath(`/tournaments/${tournamentId}`);
        return { success: true, message: `Torneo finalizado. Ganador determinado: Pareja ID ${tournamentWinner.winnerId}.`, isFinal: true };
    }
    
    const nextRMatchesData: GenericMatchInsertData[] = [];
    let newMatchOrder = 0;
    for (let i = 0; i < winners.length; i += 2) {
      const winner1 = winners[i];
      const c1_id = winner1.winnerId;
      let c2_id: string | null = null;
      let match_status = "NOT_STARTED";
      let match_winner_id: string | null = null;
      let winner2 = null;

      if (i + 1 >= winners.length) { // Odd number of winners, last one gets a BYE
        match_status = "COMPLETED"; 
        match_winner_id = c1_id;
        console.log(`[advanceToNextStageAction] Winner ${c1_id} (from match order ${winner1.originalMatchOrder}) gets a BYE to ${nextRound}`);
      } else {
        winner2 = winners[i+1];
        c2_id = winner2.winnerId;
        console.log(`[advanceToNextStageAction] Pairing for ${nextRound} (Order: ${newMatchOrder}): Winner ${c1_id} (Match ${winner1.originalMatchOrder}) vs Winner ${c2_id} (Match ${winner2.originalMatchOrder})`);
      }
      // Log before push
      console.log(`[advanceToNextStageAction] Preparing to push to nextRMatchesData - P1: ${c1_id}, P2: ${c2_id}, Round: ${nextRound}, Order: ${newMatchOrder}, Status: ${match_status}, Winner: ${match_winner_id}`);
      nextRMatchesData.push({ 
          tournament_id: tournamentId, 
          couple1_id: c1_id, 
          couple2_id: c2_id, 
          round: nextRound, 
          status: match_status, 
          order: newMatchOrder, 
          winner_id: match_winner_id
      });
      newMatchOrder++;
    }

    const createdNextRMatches: any[] = [];
    if (nextRMatchesData.length > 0) {
        for (const matchData of nextRMatchesData) {
          const result = await _createMatch(supabase, matchData);
          if (result.success && result.match) {
            createdNextRMatches.push(result.match);
            if (matchData.status === 'COMPLETED' && matchData.winner_id) { // BYE match, NO points awarded
              // await _calculateAndApplyScoreChanges(matchData.winner_id, null, supabase, tournamentId); // BYE matches don't award points
              console.log(`[advanceToNextStageAction] BYE match created for ${matchData.winner_id}, no points awarded.`);
            }
          } else { 
            return { success: false, error: `Error creando partidos para ${nextRound}: ${result.error}` }; 
          }
        }
    } else if (winners.length === 1 && nextRound !== "FINAL") { // Special case: single winner advances, but it's not the final yet (e.g. final might be decided by this)
        console.log(`[advanceToNextStageAction] Single winner ${winners[0].winnerId} advances. No match created for ${nextRound} unless it's the final.`);
        // If this single winner means the tournament is over, additional logic might be needed here or rely on the FINAL check.
    } else if (winners.length === 0 && currentRMatches.length > 0) {
        console.log(`[advanceToNextStageAction] No winners to advance from ${currentRound}. No matches created for ${nextRound}.`);
    }

    if (nextRound === "FINAL" && createdNextRMatches.length > 0) { // Only update to FINAL_STAGE if Final matches were actually created
        await supabase.from("tournaments").update({ status: "FINAL_STAGE" }).eq("id", tournamentId);
    } else if (nextRound === "FINAL" && winners.length === 1 && createdNextRMatches.length === 0) {
        // If it's the final round, and there was one winner from semis (a bye to final effectively)
        // The tournament might be considered completed with this winner.
        // Or, if a final match is always expected, this state needs review.
        // For now, if no final match is *created*, we don't set to FINAL_STAGE unless handled differently.
        console.log(`[advanceToNextStageAction] Advanced to FINAL, but no new matches created (e.g. single winner from semis). Tournament winner might be ${winners[0]?.winnerId}`);
        // Potentially set to COMPLETED directly if this is the logic.
    }
    
    revalidatePath(`/my-tournaments/${tournamentId}`);
    console.log(`Avance a ${nextRound} procesado. Creados ${createdNextRMatches.length} partidos.`);
    return { success: true, message: `Avance a ${nextRound} procesado.`, matches: createdNextRMatches };
  } catch (e: any) { return { success: false, error: e.message || "Error inesperado avanzando etapa." }; }
}

export async function requestSoloInscription(
  tournamentId: string,
  playerId: string,
  phoneNumber: string
): Promise<{ success: boolean; message: string; error?: any }> {
  const supabase = await createClient();
  try {
    const { error } = await supabase.from("inscriptions").insert([
      {
        player_id: playerId,
        tournament_id: tournamentId,
        phone: phoneNumber,
        is_pending: true,
      },
    ]);

    if (error) {
      console.error("[requestSoloInscription] Error inserting solo inscription:", error);
      return { success: false, message: "Error al enviar la solicitud.", error };
    }

    // Revalidation might not be immediately necessary for guest view until approved,
    // but can be added if an admin view needs to update.
    // revalidatePath(`/tournaments/${tournamentId}`);
    // revalidatePath(`/admin/tournaments/${tournamentId}/requests`); // Example path

    return { success: true, message: "Solicitud de inscripción individual enviada." };
  } catch (e: any) {
    console.error("[requestSoloInscription] Unexpected error:", e);
    return { success: false, message: "Error inesperado al enviar la solicitud.", error: e.message };
  }
}

export async function requestCoupleInscription(
  tournamentId: string,
  player1Id: string,
  player2Id: string,
  phoneNumber: string
): Promise<{ success: boolean; message: string; error?: any }> {
  const supabase = await createClient();
  try {
    // 1. Find or Create the couple
    // Check if couple exists (player1Id, player2Id)
    const existingCouple1Result = await supabase
      .from("couples")
      .select("id")
      .eq("player1_id", player1Id)
      .eq("player2_id", player2Id)
      .maybeSingle();

    const existingCouple1 = existingCouple1Result.data;
    const existingCouple1Error = existingCouple1Result.error;

    if (existingCouple1Error && existingCouple1Error.code !== 'PGRST116') { // PGRST116 means no rows, which is fine
      console.error("[requestCoupleInscription] Error checking for couple (P1, P2):", existingCouple1Error);
      throw existingCouple1Error;
    }
    
    let coupleId = existingCouple1?.id;

    if (!coupleId) {
      // Check if couple exists (player2Id, player1Id)
      const existingCouple2Result = await supabase
        .from("couples")
        .select("id")
        .eq("player1_id", player2Id)
        .eq("player2_id", player1Id)
        .maybeSingle();
      
      const existingCouple2 = existingCouple2Result.data;
      const existingCouple2Error = existingCouple2Result.error;

      if (existingCouple2Error && existingCouple2Error.code !== 'PGRST116') {
         console.error("[requestCoupleInscription] Error checking for couple (P2, P1):", existingCouple2Error);
         throw existingCouple2Error;
      }
      coupleId = existingCouple2?.id;
    }
    
    if (!coupleId) {
      // Create the couple if it doesn't exist
      const { data: newCouple, error: coupleError } = await supabase
        .from("couples")
        .insert([{ player1_id: player1Id, player2_id: player2Id }])
        .select("id")
        .single();

      if (coupleError || !newCouple) {
        console.error("[requestCoupleInscription] Error creating couple:", coupleError);
        throw coupleError || new Error("Failed to create couple");
      }
      coupleId = newCouple.id;
    }

    // 2. Create the inscription for the couple
    const { error: inscriptionError } = await supabase.from("inscriptions").insert([
      {
        couple_id: coupleId,
        tournament_id: tournamentId,
        // player_id can be null for couple inscriptions, or you can choose one of the players
        // For consistency with how it might have been before, let's ensure player_id is not set if couple_id is.
        // However, the DB schema for inscriptions has player_id as NOT NULL. This is an issue.
        // For now, let's assume the previous client-side logic was right and one player_id is needed,
        // or the DB schema needs adjustment for couple-only inscriptions.
        // Let's try to insert player_id as null and see if DB allows, or if we must provide one.
        // Re-checking schema: player_id is NOT NULL.
        // So, one of the players must be associated, or the schema changes.
        // For now, let's use player1Id as the primary contact for the inscription, even if it's a couple.
        // OR, the schema needs a "contact_player_id" or similar if player_id isn't appropriate.
        // Let's stick to the existing `player_id` and make it player1_id for the couple inscription.
        // This might need review based on how RLS and other logic use `inscriptions.player_id`.
        // A safer approach for couple inscriptions might be *not* to fill player_id here
        // if the DB allowed it, or to have a separate way to track the "requester" if needed.
        // Given the schema `player_id non-nullable`, we must provide it.
        // This implies that an "inscription" is always by *a* player, even if for a couple.
        // This needs clarification if the intent is different.
        // For now, let's set player1_id as the primary player for the couple's inscription request.
        // This is a tricky part if the DB schema is rigid.
        // The existing `registerCoupleForTournament` uses `player_id: player1Id` for inscriptions. Let's follow that.
        player_id: player1Id, 
        phone: phoneNumber,
        is_pending: true,
      },
    ]);

    if (inscriptionError) {
      console.error("[requestCoupleInscription] Error inserting couple inscription:", inscriptionError);
      return { success: false, message: "Error al enviar la solicitud de pareja.", error: inscriptionError };
    }
    
    // revalidatePath(`/tournaments/${tournamentId}`);
    // revalidatePath(`/admin/tournaments/${tournamentId}/requests`); // Example

    return { success: true, message: "Solicitud de inscripción de pareja enviada." };
  } catch (e: any) {
    console.error("[requestCoupleInscription] Unexpected error:", e);
    return { success: false, message: "Error inesperado al enviar la solicitud de pareja.", error: e.message };
  }
}

export async function getPendingInscriptionsByTournamentId(tournamentId: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
  const supabase = await createClient();
  console.log(`[getPendingInscriptions V3 - Simplified] Fetching for tournament ID: ${tournamentId}`);

  const toISOStringOrNull = (dateInput: string | Date | null | undefined): string | null => {
    if (!dateInput) return null;
    try {
      return new Date(dateInput).toISOString();
    } catch (e) {
      console.warn(`[getPendingInscriptions V3 - Simplified] Invalid date for conversion: ${dateInput}`, e);
      return null;
    }
  };

  try {
    const { data: rawDbInscriptions, error: fetchError } = await supabase
      .from('inscriptions')
      .select(
        `id,
        created_at,
        phone, // Keeping phone as it's on the inscription itself
        tournament_id,
        player_id, // Keep FKs to see if they cause issues
        couple_id  // Keep FKs
        // Removing all joins to players and couples
        // player:players!inscriptions_player_id_fkey(id, first_name, last_name, score, phone, created_at, dni),
        // couple:couples!inscriptions_couple_id_fkey(
        //   id,
        //   created_at,
        //   player1_id, 
        //   player2_id,
        //   player1:players!couples_player1_id_fkey(id, first_name, last_name, score, created_at, dni),
        //   player2:players!couples_player2_id_fkey(id, first_name, last_name, score, created_at, dni)
        // )` 
      )
      .eq('tournament_id', tournamentId)
      .eq('is_pending', true)
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error("[getPendingInscriptions V3 - Simplified] Supabase fetch error:", fetchError);
      return { success: false, error: fetchError.message };
    }

    if (!rawDbInscriptions) {
      console.log("[getPendingInscriptions V3 - Simplified] No raw inscriptions data returned from Supabase.");
      return { success: true, data: [] };
    }
    
    if (rawDbInscriptions.length > 0) {
        console.log("[getPendingInscriptions V3 - Simplified] Raw DB inscriptions (first item):", 
                    JSON.stringify(rawDbInscriptions[0], null, 2));
    } else {
        console.log("[getPendingInscriptions V3 - Simplified] Raw DB inscriptions array is empty.");
    }

    // Simplified processing: just convert dates and ensure structure is plain
    const processedData = rawDbInscriptions.map((rawInscription: any) => {
      return {
        id: rawInscription.id,
        created_at: toISOStringOrNull(rawInscription.created_at),
        phone: rawInscription.phone || null,
        tournament_id: rawInscription.tournament_id,
        player_id: rawInscription.player_id || null,
        couple_id: rawInscription.couple_id || null,
        // No nested player or couple objects anymore for this test
        player: null, 
        couple: null,
      };
    });

    if (processedData.length > 0 && processedData[0]) {
         console.log(`[getPendingInscriptions V3 - Simplified] First final processed item:`, 
                     JSON.stringify(processedData[0], null, 2));
    }

    console.log("[getPendingInscriptions V3 - Simplified] Successfully processed all inscriptions.");
    const finalData = JSON.parse(JSON.stringify(processedData));
    return { success: true, data: finalData };

  } catch (e: any) {
    console.error("[getPendingInscriptions V3 - Simplified] Unexpected error in processing:", e);
    return { success: false, error: e.message || "Unexpected error processing pending inscriptions." };
  }
}

export async function acceptInscriptionRequest(inscriptionId: string, tournamentId: string): Promise<{ success: boolean; message: string; error?: string }> {
  const supabase = await createClient();
  try {
    const { data: inscription, error: fetchError } = await supabase
        .from('inscriptions')
        .select('player_id, couple_id')
        .eq('id', inscriptionId)
        .single();

    if (fetchError || !inscription) {
        console.error("[acceptInscriptionRequest] Error fetching inscription or inscription not found:", fetchError);
        return { success: false, message: "Error al encontrar la inscripción." , error: fetchError?.message };
    }

    // Check if the player or couple is already fully registered (not pending)
    if (inscription.player_id && !inscription.couple_id) { // Solo player
        const { data: existing, error: checkError } = await supabase
            .from('inscriptions')
            .select('id')
            .eq('tournament_id', tournamentId)
            .eq('player_id', inscription.player_id)
            .eq('is_pending', false)
            .neq('id', inscriptionId) // Exclude the current pending one
            .maybeSingle();
        if (checkError) {
            console.error("[acceptInscriptionRequest] Error checking existing player inscription:", checkError);
            return { success: false, message: "Error al verificar jugador.", error: checkError.message };
        }
        if (existing) {
            return { success: false, message: "Este jugador ya está inscrito y aceptado en el torneo." };
        }
    } else if (inscription.couple_id) { // Couple
        const { data: existing, error: checkError } = await supabase
            .from('inscriptions')
            .select('id')
            .eq('tournament_id', tournamentId)
            .eq('couple_id', inscription.couple_id)
            .eq('is_pending', false)
            .neq('id', inscriptionId) // Exclude the current pending one
            .maybeSingle();
        if (checkError) {
            console.error("[acceptInscriptionRequest] Error checking existing couple inscription:", checkError);
            return { success: false, message: "Error al verificar pareja.", error: checkError.message };
        }
        if (existing) {
            return { success: false, message: "Esta pareja ya está inscrita y aceptada en el torneo." };
        }
    }

    const { error } = await supabase
      .from('inscriptions')
      .update({ is_pending: false })
      .eq('id', inscriptionId);

    if (error) {
      console.error("[acceptInscriptionRequest] Error updating inscription:", error);
      return { success: false, message: "Error al aceptar la solicitud.", error: error.message };
    }

    revalidatePath(`/my-tournaments/${tournamentId}`);
    // Potentially revalidate the public page as well if it shows participant counts or lists
    revalidatePath(`/tournaments/${tournamentId}`);

    return { success: true, message: "Solicitud de inscripción aceptada." };
  } catch (e: any) {
    console.error("[acceptInscriptionRequest] Unexpected error:", e);
    return { success: false, message: "Error inesperado al aceptar la solicitud.", error: e.message };
  }
} 

// --- ACTION: populateTournamentSeedCouples (New) ---
export async function populateTournamentSeedCouples(tournamentId: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  seededCouples?: any[];
}> {
  const supabase = await createClient();
  console.log(`[populateTournamentSeedCouples] Starting for tournament: ${tournamentId}`);

  try {
    // 1. Fetch zones and their ranked couples
    const zonesResult = await fetchTournamentZones(tournamentId);
    if (!zonesResult.success || !zonesResult.zones) {
      console.error("[populateTournamentSeedCouples] Error fetching zones:", zonesResult.error);
      return { success: false, error: zonesResult.error || "No se pudieron obtener las zonas del torneo." };
    }

    if (zonesResult.zones.length === 0) {
      console.log("[populateTournamentSeedCouples] No zones found for this tournament.");
      return { success: true, message: "No hay zonas en el torneo para generar cabezas de serie.", seededCouples: [] };
    }

    let allRankedCouples: {
      couple_id: string;
      tournament_id: string;
      zone_id: string;
      zone_name?: string;
      rank_in_zone: number;
      stats: any; // Assuming stats object is available
      player1_name?: string;
      player2_name?: string;
    }[] = [];

    // 2. Determine ranking within each zone and collect all qualifying couples
    // Use unified sorting function for consistent ranking across all zones
    for (const zone of zonesResult.zones) {
      if (!zone.couples || zone.couples.length === 0) {
        console.log(`[populateTournamentSeedCouples] Zone ${zone.name} has no couples.`);
        continue;
      }

      // Fetch zone matches for head-to-head calculation
      const { data: zoneMatches, error: zoneMatchesError } = await supabase
        .from("matches")
        .select("couple1_id, couple2_id, winner_id, status")
        .eq("zone_id", zone.id)
        .eq("status", "COMPLETED");

      // Convert zone couples to CoupleWithExtendedStats format  
      const couplesWithExtendedStats: CoupleWithExtendedStats[] = zone.couples.map((couple: any): CoupleWithExtendedStats => ({
        ...couple,
        stats: couple.stats || { played: 0, won: 0, lost: 0, scored: 0, conceded: 0, points: 0 }
      }));

      // Use unified sorting function with head-to-head support
      const sortedCouplesInZone = sortCouplesInZone(
        couplesWithExtendedStats,
        zoneMatchesError ? [] : (zoneMatches || [])
      );

      sortedCouplesInZone.forEach((couple, index) => {
        allRankedCouples.push({
          couple_id: couple.id,
          tournament_id: tournamentId,
          zone_id: zone.id,
          zone_name: zone.name,
          rank_in_zone: index + 1, // 1-based rank within the zone
          stats: couple.stats,
          player1_name: couple.player1_name,
          player2_name: couple.player2_name,
        });
      });
    }

    if (allRankedCouples.length === 0) {
      console.log("[populateTournamentSeedCouples] No couples found across all zones after ranking.");
      return { success: true, message: "No hay parejas clasificadas de las zonas.", seededCouples: [] };
    }
    
    // 3. Global seeding based on zone rank and then points/stats (inter-zone tie-breaking)
    // Example: All #1s from zones are seeded first, then all #2s, etc.
    // Within the same rank (e.g. all #1s), further sort by points or other stats.
    const globallySeededCouples = allRankedCouples.sort((a, b) => {
      if (a.rank_in_zone !== b.rank_in_zone) {
        return a.rank_in_zone - b.rank_in_zone; // Lower rank_in_zone is better (1st, 2nd)
      }
      // Tie-breaking for couples with the same rank_in_zone (e.g. two zone winners)
      const pointsA = a.stats?.points || 0;
      const pointsB = b.stats?.points || 0;
      if (pointsB !== pointsA) return pointsB - pointsA;

      const gamesWonA = a.stats?.scored || 0;
      const gamesWonB = b.stats?.scored || 0;
      if (gamesWonB !== gamesWonA) return gamesWonB - gamesWonA;
      
      const gamesConcededA = a.stats?.conceded || 0;
      const gamesConcededB = b.stats?.conceded || 0;
      return gamesConcededA - gamesConcededB;
    });

    const seedInserts = globallySeededCouples.map((couple, index) => ({
      tournament_id: tournamentId,
      couple_id: couple.couple_id,
      seed: index + 1, // Overall seed (1-based)
      zone_id: couple.zone_id,
      // You might want to store some stats here too, e.g., JSON.stringify(couple.stats)
    }));

    // 4. Clear old seeds for this tournament and insert new ones
    const { error: deleteError } = await supabase
      .from("tournament_couple_seeds")
      .delete()
      .eq("tournament_id", tournamentId);

    if (deleteError) {
      console.error("[populateTournamentSeedCouples] Error deleting old seeds:", deleteError);
      return { success: false, error: `Error limpiando cabezas de serie antiguas: ${deleteError.message}` };
    }

    const { data: insertedSeeds, error: insertError } = await supabase
      .from("tournament_couple_seeds")
      .insert(seedInserts)
      .select();

    if (insertError) {
      console.error("[populateTournamentSeedCouples] Error inserting new seeds:", insertError);
      // Consider what to do if insert fails after delete. Maybe wrap in transaction if Supabase JS client supports it easily.
      return { success: false, error: `Error guardando cabezas de serie: ${insertError.message}` };
    }
    
    console.log(`[populateTournamentSeedCouples] Successfully seeded ${insertedSeeds?.length} couples for tournament ${tournamentId}.`);
    return { success: true, message: "Cabezas de serie generadas y guardadas.", seededCouples: insertedSeeds || [] };

  } catch (e: any) {
    console.error("[populateTournamentSeedCouples] Unexpected error:", e);
    return { success: false, error: `Error inesperado al generar cabezas de serie: ${e.message}` };
  }
} 

export async function removePlayerFromTournament(tournamentId: string, playerId?: string): Promise<{ success: boolean; message: string }> {
  const supabase = await createClient();
  
  // Si no se proporciona playerId, obtener el del usuario autenticado
  let targetPlayerId = playerId;
  
  if (!targetPlayerId) {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, message: "Debes iniciar sesión para eliminar tu inscripción." };
    }
    
    const { data: playerData, error: playerError } = await supabase
      .from('players')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (playerError || !playerData?.id) {
      return { success: false, message: "No se pudo encontrar tu perfil de jugador." };
    }
    
    targetPlayerId = playerData.id;
  }

  try {
    // Buscar todas las inscripciones del jugador en este torneo
    const { data: inscriptions, error: fetchError } = await supabase
      .from('inscriptions')
      .select('id, couple_id')
      .eq('tournament_id', tournamentId)
      .eq('player_id', targetPlayerId);

    if (fetchError) {
      console.error("[removePlayerFromTournament] Error fetching inscriptions:", fetchError);
      return { success: false, message: "Error al buscar las inscripciones." };
    }

    if (!inscriptions || inscriptions.length === 0) {
      return { success: false, message: "No se encontró ninguna inscripción para eliminar." };
    }

    // Eliminar todas las inscripciones del jugador
    const { error: deleteError } = await supabase
      .from('inscriptions')
      .delete()
      .eq('tournament_id', tournamentId)
      .eq('player_id', targetPlayerId);

    if (deleteError) {
      console.error("[removePlayerFromTournament] Error deleting inscriptions:", deleteError);
      return { success: false, message: "Error al eliminar la inscripción." };
    }

    // Si había una pareja asociada, verificar si queda sin inscripciones y eliminarla si es necesario
    const coupleInscriptions = inscriptions.filter(ins => ins.couple_id);
    for (const inscription of coupleInscriptions) {
      if (inscription.couple_id) {
        // Verificar si quedan otras inscripciones para esta pareja
        const { data: remainingInscriptions, error: checkError } = await supabase
          .from('inscriptions')
          .select('id')
          .eq('couple_id', inscription.couple_id);

        if (!checkError && remainingInscriptions && remainingInscriptions.length === 0) {
          // No quedan inscripciones para esta pareja, se puede eliminar
          const { error: deleteCoupleError } = await supabase
            .from('couples')
            .delete()
            .eq('id', inscription.couple_id);

          if (deleteCoupleError) {
            console.error("[removePlayerFromTournament] Error deleting orphaned couple:", deleteCoupleError);
            // No fallar por esto, la inscripción ya se eliminó correctamente
          }
        }
      }
    }

    // Revalidar las rutas para actualizar la UI
    revalidatePath(`/tournaments/${tournamentId}`);
    revalidatePath('/tournaments');
    revalidatePath(`/my-tournaments/${tournamentId}`);

    return { success: true, message: "Inscripción eliminada exitosamente." };
  } catch (error) {
    console.error("[removePlayerFromTournament] Unexpected error:", error);
    return { success: false, message: "Error inesperado al eliminar la inscripción." };
  }
}

export async function checkPlayerInscriptionStatus(tournamentId: string, playerId: string): Promise<{ success: boolean; isRegistered: boolean; registrationType?: 'individual' | 'couple'; error?: string }> {
  const supabase = await createClient();
  
  try {
    // Check if player is registered individually
    const { data: individualInscription, error: individualError } = await supabase
      .from('inscriptions')
      .select('id')
      .eq('tournament_id', tournamentId)
      .eq('player_id', playerId)
      .eq('is_pending', false)
      .is('couple_id', null)
      .maybeSingle();

    if (individualError) {
      console.error("[checkPlayerInscriptionStatus] Error checking individual inscription:", individualError);
      return { success: false, isRegistered: false, error: "Error al verificar inscripción individual." };
    }

    if (individualInscription) {
      return { success: true, isRegistered: true, registrationType: 'individual' };
    }

    // Check if player is registered in a couple
    const { data: coupleInscriptions, error: coupleError } = await supabase
      .from('inscriptions')
      .select(`
        id,
        couples (
          id,
          player1_id,
          player2_id
        )
      `)
      .eq('tournament_id', tournamentId)
      .eq('is_pending', false)
      .not('couple_id', 'is', null);

    if (coupleError) {
      console.error("[checkPlayerInscriptionStatus] Error checking couple inscriptions:", coupleError);
      return { success: false, isRegistered: false, error: "Error al verificar inscripciones de parejas." };
    }

    const playerInCouple = coupleInscriptions?.find(inscription => {
      const couple = inscription.couples;
      if (couple && couple.length > 0) {
        const coupleData = couple[0];
        return coupleData.player1_id === playerId || coupleData.player2_id === playerId;
      }
      return false;
    });

    if (playerInCouple) {
      return { success: true, isRegistered: true, registrationType: 'couple' };
    }

    return { success: true, isRegistered: false };
  } catch (error) {
    console.error("[checkPlayerInscriptionStatus] Unexpected error:", error);
    return { success: false, isRegistered: false, error: "Error inesperado al verificar inscripción." };
  }
}

export async function pairIndividualPlayers(tournamentId: string, player1Id: string, player2Id: string): Promise<{ success: boolean; error?: string; message?: string }> {
  const supabase = await createClient();
  
  try {
    // Verificar que ambos jugadores estén inscritos individualmente en el torneo
    const { data: player1Inscription, error: p1Error } = await supabase
      .from('inscriptions')
      .select('id, player_id')
      .eq('tournament_id', tournamentId)
      .eq('player_id', player1Id)
      .eq('is_pending', false)
      .is('couple_id', null)
      .maybeSingle();

    if (p1Error) {
      console.error("[pairIndividualPlayers] Error checking player 1 inscription:", p1Error);
      return { success: false, error: "Error al verificar la inscripción del primer jugador." };
    }

    if (!player1Inscription) {
      return { success: false, error: "El primer jugador no está inscrito individualmente en este torneo." };
    }

    const { data: player2Inscription, error: p2Error } = await supabase
      .from('inscriptions')
      .select('id, player_id')
      .eq('tournament_id', tournamentId)
      .eq('player_id', player2Id)
      .eq('is_pending', false)
      .is('couple_id', null)
      .maybeSingle();

    if (p2Error) {
      console.error("[pairIndividualPlayers] Error checking player 2 inscription:", p2Error);
      return { success: false, error: "Error al verificar la inscripción del segundo jugador." };
    }

    if (!player2Inscription) {
      return { success: false, error: "El segundo jugador no está inscrito individualmente en este torneo." };
    }

    // Verificar que no sean el mismo jugador
    if (player1Id === player2Id) {
      return { success: false, error: "No se puede emparejar un jugador consigo mismo." };
    }

    // Crear o encontrar la pareja
    const { data: existingCouple, error: findCoupleError } = await supabase
      .from('couples')
      .select('id')
      .or(`and(player1_id.eq.${player1Id},player2_id.eq.${player2Id}),and(player1_id.eq.${player2Id},player2_id.eq.${player1Id})`)
      .maybeSingle();

    if (findCoupleError) {
      console.error("[pairIndividualPlayers] Error checking existing couple:", findCoupleError);
      return { success: false, error: "Error al verificar pareja existente." };
    }

    let coupleId: string;
    
    if (existingCouple) {
      coupleId = existingCouple.id;
    } else {
      // Crear nueva pareja
      const { data: newCouple, error: coupleError } = await supabase
        .from('couples')
        .insert({ player1_id: player1Id, player2_id: player2Id })
        .select('id')
        .single();
      
      if (coupleError || !newCouple?.id) {
        console.error("[pairIndividualPlayers] Error creating couple:", coupleError);
        return { success: false, error: "No se pudo crear la pareja." };
      }
      coupleId = newCouple.id;
    }

    // Verificar que la pareja no esté ya inscrita en el torneo
    const { data: existingCoupleInscription, error: checkCoupleError } = await supabase
      .from('inscriptions')
      .select('id')
      .eq('tournament_id', tournamentId)
      .eq('couple_id', coupleId)
      .eq('is_pending', false)
      .maybeSingle();

    if (checkCoupleError) {
      console.error("[pairIndividualPlayers] Error checking existing couple inscription:", checkCoupleError);
      return { success: false, error: "Error al verificar inscripción de pareja existente." };
    }
    
    if (existingCoupleInscription) {
      return { success: false, error: "Esta pareja ya está inscrita en el torneo." };
    }

    // Crear inscripción de la pareja
    const { data: newInscription, error: inscriptionError } = await supabase
      .from('inscriptions')
      .insert({ 
        tournament_id: tournamentId, 
        couple_id: coupleId, 
        player_id: player1Id, // Usar player1 como contacto principal
        is_pending: false
      })
      .select('id')
      .single(); 
      
    if (inscriptionError) {
      console.error("[pairIndividualPlayers] Error creating couple inscription:", inscriptionError);
      return { success: false, error: "No se pudo inscribir la pareja." };
    }

    // Eliminar las inscripciones individuales de ambos jugadores
    const { error: deleteError } = await supabase
      .from('inscriptions')
      .delete()
      .in('id', [player1Inscription.id, player2Inscription.id]);

    if (deleteError) {
      console.error("[pairIndividualPlayers] Error deleting individual inscriptions:", deleteError);
      // Intentar rollback de la inscripción de pareja
      await supabase.from('inscriptions').delete().eq('id', newInscription.id);
      return { success: false, error: "Error al eliminar las inscripciones individuales." };
    }
    
    revalidatePath(`/tournaments/${tournamentId}`);
    revalidatePath(`/my-tournaments/${tournamentId}`);
    
    return { success: true, message: "Jugadores emparejados exitosamente." };
  } catch (error: any) {
    console.error("[pairIndividualPlayers] Unexpected error:", error);
    return { success: false, error: "Error inesperado al emparejar jugadores." };
  }
}

export async function removeCoupleFromTournament(tournamentId: string, coupleId: string): Promise<{ success: boolean; message: string }> {
  const supabase = await createClient();
  
  try {
    // Verificar que la pareja esté inscrita en el torneo
    const { data: inscription, error: fetchError } = await supabase
      .from('inscriptions')
      .select('id')
      .eq('tournament_id', tournamentId)
      .eq('couple_id', coupleId)
      .eq('is_pending', false)
      .maybeSingle();

    if (fetchError) {
      console.error("[removeCoupleFromTournament] Error fetching couple inscription:", fetchError);
      return { success: false, message: "Error al verificar la inscripción de la pareja." };
    }

    if (!inscription) {
      return { success: false, message: "La pareja no está inscrita en este torneo." };
    }

    // Eliminar SOLO la inscripción de la pareja, NO la pareja en sí
    // Esto permite que la pareja se pueda reutilizar en otros torneos
    const { error: deleteError } = await supabase
      .from('inscriptions')
      .delete()
      .eq('id', inscription.id);

    if (deleteError) {
      console.error("[removeCoupleFromTournament] Error deleting couple inscription:", deleteError);
      return { success: false, message: "Error al eliminar la inscripción de la pareja." };
    }

    // Revalidar las rutas para actualizar la UI
    revalidatePath(`/tournaments/${tournamentId}`);
    revalidatePath('/tournaments');
    revalidatePath(`/my-tournaments/${tournamentId}`);

    return { success: true, message: "Pareja eliminada del torneo exitosamente." };
  } catch (error) {
    console.error("[removeCoupleFromTournament] Unexpected error:", error);
    return { success: false, message: "Error inesperado al eliminar la pareja." };
  }
}

/**
 * Upload winner image for a tournament
 */
export async function uploadTournamentWinnerImage(tournamentId: string, file: File) {
  const supabase = await createClient();
  
  try {
    // Verify user has permission to upload (tournament owner)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('User not authenticated:', userError?.message);
      return { success: false, error: 'Usuario no autenticado' };
    }

    // Verify the tournament belongs to the user's club
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select(`
        id,
        clubes!inner(
          id,
          user_id
        )
      `)
      .eq('id', tournamentId)
      .single();

    if (tournamentError || !tournament) {
      console.error('Tournament not found:', tournamentError?.message);
      return { success: false, error: 'Torneo no encontrado' };
    }

    // Type assertion to access the nested club data
    const tournamentWithClub = tournament as any;
    if (tournamentWithClub.clubes.user_id !== user.id) {
      return { success: false, error: 'No tienes permisos para subir imágenes a este torneo' };
    }

    // Generate file path: tournaments/{tournamentId}/winner.{extension}
    const fileExtension = file.name.split('.').pop();
    const fileName = `${tournamentId}/winner.${fileExtension}`;
    
    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('tournaments')
      .upload(fileName, file, {
        upsert: true // Replace if exists
      });

    if (uploadError) {
      console.error('Error uploading winner image:', uploadError);
      return { success: false, error: uploadError.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('tournaments')
      .getPublicUrl(fileName);

    // Update tournament record with winner image URL
    const { error: updateError } = await supabase
      .from('tournaments')
      .update({ winner_image_url: publicUrl })
      .eq('id', tournamentId);

    if (updateError) {
      console.error('Error updating tournament winner image URL:', updateError);
      return { success: false, error: updateError.message };
    }

    // Revalidate relevant paths
    revalidatePath(`/my-tournaments/${tournamentId}`);
    revalidatePath(`/tournaments/${tournamentId}`);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Unexpected error uploading winner image:', error);
    return { success: false, error: 'Error inesperado al subir la imagen' };
  }
}

/**
 * Get weekly winners - tournaments finished in the last 7 days with winner details
 */
export async function getWeeklyWinners() {
  const supabase = await createClient();
  
  try {
    // Calculate date 7 days ago
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    // Get tournaments finished in the last 7 days with winner information
    const { data: tournaments, error } = await supabase
      .from('tournaments')
      .select('id, name, winner_image_url, end_date, winner_id')
      .eq('status', 'FINISHED')
      .not('winner_id', 'is', null)
      .not('winner_image_url', 'is', null)
      .gte('end_date', weekAgo.toISOString())
      .order('end_date', { ascending: false })
      .limit(6);

    if (error || !tournaments) {
      console.error('Error fetching weekly winners:', error);
      return [];
    }

    // Get winner details for each tournament
    const winnersWithDetails = [];
    for (const tournament of tournaments) {
      const { data: couple, error: coupleError } = await supabase
        .from('couples')
        .select(`
          id,
          player1:players!couples_player1_id_fkey(first_name, last_name),
          player2:players!couples_player2_id_fkey(first_name, last_name)
        `)
        .eq('id', tournament.winner_id)
        .single();

      if (!coupleError && couple) {
        const player1 = Array.isArray(couple.player1) ? couple.player1[0] : couple.player1;
        const player2 = Array.isArray(couple.player2) ? couple.player2[0] : couple.player2;

        winnersWithDetails.push({
          id: tournament.id,
          tournamentName: tournament.name,
          winnerImageUrl: tournament.winner_image_url,
          endDate: tournament.end_date,
          winner: {
            id: couple.id,
            player1Name: `${player1?.first_name || ''} ${player1?.last_name || ''}`.trim(),
            player2Name: `${player2?.first_name || ''} ${player2?.last_name || ''}`.trim(),
          }
        });
      }
    }

    return winnersWithDetails;

  } catch (error) {
    console.error('Unexpected error fetching weekly winners:', error);
    return [];
  }
}

/**
 * Upload pre-tournament image for a tournament
 */
export async function uploadTournamentPreImage(tournamentId: string, file: File) {
  const supabase = await createClient();
  
  try {
    // Verify user has permission to upload (tournament owner)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('User not authenticated:', userError?.message);
      return { success: false, error: 'Usuario no autenticado' };
    }

    // Verify the tournament belongs to the user's club
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select(`
        id,
        clubes!inner(
          id,
          user_id
        )
      `)
      .eq('id', tournamentId)
      .single();

    if (tournamentError || !tournament) {
      console.error('Tournament not found:', tournamentError?.message);
      return { success: false, error: 'Torneo no encontrado' };
    }

    // Type assertion to access the nested club data
    const tournamentWithClub = tournament as any;
    if (tournamentWithClub.clubes.user_id !== user.id) {
      return { success: false, error: 'No tienes permisos para subir imágenes a este torneo' };
    }

    // Generate file path: tournaments/{tournamentId}/pre-tournament.{extension}
    const fileExtension = file.name.split('.').pop();
    const fileName = `${tournamentId}/pre-tournament.${fileExtension}`;
    
    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('tournaments')
      .upload(fileName, file, {
        upsert: true // Replace if exists
      });

    if (uploadError) {
      console.error('Error uploading pre-tournament image:', uploadError);
      return { success: false, error: uploadError.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('tournaments')
      .getPublicUrl(fileName);

    // Update tournament record with pre-tournament image URL
    const { error: updateError } = await supabase
      .from('tournaments')
      .update({ pre_tournament_image_url: publicUrl })
      .eq('id', tournamentId);

    if (updateError) {
      console.error('Error updating tournament pre-tournament image URL:', updateError);
      return { success: false, error: updateError.message };
    }

    // Revalidate relevant paths
    revalidatePath(`/my-tournaments/${tournamentId}`);
    revalidatePath(`/tournaments/${tournamentId}`);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Unexpected error uploading pre-tournament image:', error);
    return { success: false, error: 'Error inesperado al subir la imagen' };
  }
}

/**
 * Set club cover image as pre-tournament image fallback
 */
export async function setClubCoverAsPreTournamentImage(tournamentId: string) {
  const supabase = await createClient();
  
  try {
    // Verify user has permission
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('User not authenticated:', userError?.message);
      return { success: false, error: 'Usuario no autenticado' };
    }

    // Get tournament and club data
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select(`
        id,
        clubes!inner(
          id,
          user_id,
          cover_image_url
        )
      `)
      .eq('id', tournamentId)
      .single();

    if (tournamentError || !tournament) {
      console.error('Tournament not found:', tournamentError?.message);
      return { success: false, error: 'Torneo no encontrado' };
    }

    // Type assertion to access the nested club data
    const tournamentWithClub = tournament as any;
    if (tournamentWithClub.clubes.user_id !== user.id) {
      return { success: false, error: 'No tienes permisos para modificar este torneo' };
    }

    const clubCoverUrl = tournamentWithClub.clubes.cover_image_url;
    if (!clubCoverUrl) {
      return { success: false, error: 'El club no tiene imagen de portada configurada' };
    }

    // Update tournament record with club cover image as pre-tournament image
    const { error: updateError } = await supabase
      .from('tournaments')
      .update({ pre_tournament_image_url: clubCoverUrl })
      .eq('id', tournamentId);

    if (updateError) {
      console.error('Error setting club cover as pre-tournament image:', updateError);
      return { success: false, error: updateError.message };
    }

    // Revalidate relevant paths
    revalidatePath(`/my-tournaments/${tournamentId}`);
    revalidatePath(`/tournaments/${tournamentId}`);

    return { success: true, url: clubCoverUrl };
  } catch (error) {
    console.error('Unexpected error setting club cover as pre-tournament image:', error);
    return { success: false, error: 'Error inesperado al configurar la imagen' };
  }
}



export type GetClubTournamentsResult = {
  success: boolean;
  message?: string;
  tournaments?: Tournament[];
};

export async function getClubTournaments(): Promise<GetClubTournamentsResult> {
  // Get the authenticated user
  const user = await getUser();
  
  if (!user) {
    return {
      success: false,
      message: "No estás autenticado. Por favor, inicia sesión nuevamente."
    };
  }
  
  // Create Supabase client
  const supabase = await createClient();
  
  // Find the club ID associated with the user
  const { data: clubData, error: clubError } = await supabase
    .from('clubes')
    .select('id, name, address')
    .eq('user_id', user.id)
    .single();
  
  if (clubError || !clubData) {
    console.error("Error fetching club data:", clubError);
    return {
      success: false,
      message: "No se encontró información de club para tu usuario."
    };
  }
  
  try {
    // Fetch tournaments for this club
    const { data: tournamentsData, error: tournamentsError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('club_id', clubData.id)
      .order('start_date', { ascending: false });
    
    if (tournamentsError) {
      console.error("Error fetching tournaments:", tournamentsError);
      return {
        success: false,
        message: `Error al cargar torneos: ${tournamentsError.message}`
      };
    }
    
    // Map database fields to Tournament type
    const tournaments = tournamentsData.map(tournament => ({
      id: tournament.id,
      name: tournament.name,
      startDate: tournament.start_date,
      endDate: tournament.end_date,
      type: tournament.type as "AMERICAN" | "LONG",
      status: tournament.status as "NOT_STARTED" | "IN_PROGRESS" | "FINISHED" | "PAIRING",
      category: tournament.category,
      gender: tournament.gender || "MIXED",
      createdAt: tournament.created_at,
      club: {
        id: clubData.id,
        name: clubData.name,
        address: clubData.address
      }
    } as Tournament));
    
    return {
      success: true,
      tournaments
    };
    
  } catch (error: any) {
    console.error("Unexpected error fetching tournaments:", error);
    return {
      success: false,
      message: `Error inesperado: ${error.message}`
    };
  }
} 

// --- RANKING AND HISTORY TRACKING FUNCTIONS ---

/**
 * Obtiene el lunes de la semana de una fecha dada
 */
function getWeekStartDate(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajustar para que lunes sea el primer día
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0]; // Solo la fecha YYYY-MM-DD
}

/**
 * Calcula el ranking actual de todos los jugadores
 */
async function calculateCurrentRanking(supabase: any): Promise<{player_id: string, score: number, rank_position: number}[]> {
  const { data: players, error } = await supabase
    .from('players')
    .select('id, score')
    .eq('status', 'active')
    .order('score', { ascending: false });
    
  if (error || !players) {
    console.error('[calculateCurrentRanking] Error fetching players:', error);
    return [];
  }
  
  return players.map((player: any, index: number) => ({
    player_id: player.id,
    score: player.score || 0,
    rank_position: index + 1
  }));
}

/**
 * Crea un snapshot semanal del ranking
 */
async function createWeeklyRankingSnapshot(weekStartDate: string, supabase: any): Promise<boolean> {
  try {
    const ranking = await calculateCurrentRanking(supabase);
    
    if (ranking.length === 0) {
      console.log('[createWeeklyRankingSnapshot] No players found for ranking');
      return true;
    }
    
    // Preparar datos para insertar
    const snapshotData = ranking.map(rank => ({
      player_id: rank.player_id,
      rank_position: rank.rank_position,
      score: rank.score,
      week_start_date: weekStartDate,
      snapshot_type: 'weekly'
    }));
    
    // Insertar snapshot (usando upsert por si ya existe)
    const { error } = await supabase
      .from('ranking_snapshots')
      .upsert(snapshotData, { 
        onConflict: 'player_id,week_start_date,snapshot_type',
        ignoreDuplicates: false 
      });
      
    if (error) {
      console.error('[createWeeklyRankingSnapshot] Error inserting snapshot:', error);
      return false;
    }
    
    console.log(`[createWeeklyRankingSnapshot] Created weekly snapshot for ${weekStartDate} with ${ranking.length} players`);
    return true;
  } catch (e: any) {
    console.error('[createWeeklyRankingSnapshot] Unexpected error:', e);
    return false;
  }
}

/**
 * Genera el historial de tournament para todos los jugadores de un torneo
 */
async function generatePlayerTournamentHistory(tournamentId: string, supabase: any): Promise<boolean> {
  try {
    console.log(`[generatePlayerTournamentHistory] Processing tournament ${tournamentId}`);
    
    // Obtener información del torneo
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('end_date, start_date')
      .eq('id', tournamentId)
      .single();
      
    if (tournamentError || !tournament) {
      console.error('[generatePlayerTournamentHistory] Tournament not found:', tournamentError);
      return false;
    }
    
    // Obtener TODOS los jugadores que participaron en el torneo
    // Esto incluye jugadores individuales Y ambos miembros de las parejas
    const allPlayerIds = new Set<string>();
    
    // 1. Obtener jugadores individuales
    const { data: individualInscriptions, error: individualError } = await supabase
      .from('inscriptions')
      .select('player_id')
      .eq('tournament_id', tournamentId)
      .eq('is_pending', false)
      .is('couple_id', null)
      .not('player_id', 'is', null);
      
    if (individualError) {
      console.error('[generatePlayerTournamentHistory] Error fetching individual participants:', individualError);
      return false;
    }
    
    // Agregar jugadores individuales
    individualInscriptions?.forEach((inscription: any) => {
      if (inscription.player_id) {
        allPlayerIds.add(inscription.player_id);
      }
    });
    
    // 2. Obtener jugadores de parejas
    const { data: coupleInscriptions, error: coupleError } = await supabase
      .from('inscriptions')
      .select(`
        couple_id,
        couples!inner(
          player1_id,
          player2_id
        )
      `)
      .eq('tournament_id', tournamentId)
      .eq('is_pending', false)
      .not('couple_id', 'is', null);
      
    if (coupleError) {
      console.error('[generatePlayerTournamentHistory] Error fetching couple participants:', coupleError);
      return false;
    }
    
    // Agregar ambos jugadores de cada pareja
    coupleInscriptions?.forEach((inscription: any) => {
      const couple = inscription.couples;
      if (couple && couple.player1_id) {
        allPlayerIds.add(couple.player1_id);
      }
      if (couple && couple.player2_id) {
        allPlayerIds.add(couple.player2_id);
      }
    });
    
    console.log(`[generatePlayerTournamentHistory] Found ${allPlayerIds.size} total players (individuals + couples)`);
    
    if (allPlayerIds.size === 0) {
      console.log('[generatePlayerTournamentHistory] No participants found');
      return true;
    }
    
    // Obtener información actual de todos los jugadores
    const { data: allPlayers, error: playersError } = await supabase
      .from('players')
      .select('id, score')
      .in('id', Array.from(allPlayerIds));
      
    if (playersError) {
      console.error('[generatePlayerTournamentHistory] Error fetching player data:', playersError);
      return false;
    }
    
    if (!allPlayers || allPlayers.length === 0) {
      console.log('[generatePlayerTournamentHistory] No player data found');
      return true;
    }
    
    // Fecha de la semana del torneo para buscar snapshot previo
    const tournamentDate = new Date(tournament.end_date || tournament.start_date || new Date());
    const weekStart = getWeekStartDate(tournamentDate);
    
    // Buscar snapshot de la semana anterior para obtener puntos/ranking previos
    const previousWeekDate = new Date(weekStart);
    previousWeekDate.setDate(previousWeekDate.getDate() - 7);
    const previousWeekStart = previousWeekDate.toISOString().split('T')[0];
    
    // Obtener snapshots previos
    const { data: previousSnapshots } = await supabase
      .from('ranking_snapshots')
      .select('player_id, rank_position, score')
      .eq('week_start_date', previousWeekStart)
      .eq('snapshot_type', 'weekly');
    
    // Crear mapa de datos previos
    const previousData = new Map();
    if (previousSnapshots) {
      previousSnapshots.forEach((snap: any) => {
        previousData.set(snap.player_id, {
          rank_before: snap.rank_position,
          points_before: snap.score
        });
      });
    }
    
    // Calcular ranking actual
    const currentRanking = await calculateCurrentRanking(supabase);
    const currentRankMap = new Map();
    currentRanking.forEach(rank => {
      currentRankMap.set(rank.player_id, {
        rank_after: rank.rank_position,
        points_after: rank.score
      });
    });
    
    // Preparar datos del historial
    const historyData = [];
    
    for (const player of allPlayers) {
      const playerId = player.id;
      const currentScore = player.score || 0;
      
      const prevData = previousData.get(playerId) || { rank_before: null, points_before: 0 };
      const currentData = currentRankMap.get(playerId) || { rank_after: null, points_after: currentScore };
      
      const pointsEarned = currentData.points_after - prevData.points_before;
      const rankChange = prevData.rank_before && currentData.rank_after 
        ? prevData.rank_before - currentData.rank_after // Positivo = subió posiciones
        : null;
      
      historyData.push({
        player_id: playerId,
        tournament_id: tournamentId,
        points_before: prevData.points_before,
        points_after: currentData.points_after,
        points_earned: pointsEarned,
        rank_before: prevData.rank_before,
        rank_after: currentData.rank_after,
        rank_change: rankChange
      });
    }
    
    // Insertar historial (usando upsert por si ya existe)
    const { error: historyError } = await supabase
      .from('player_tournament_history')
      .upsert(historyData, { 
        onConflict: 'player_id,tournament_id',
        ignoreDuplicates: false 
      });
      
    if (historyError) {
      console.error('[generatePlayerTournamentHistory] Error inserting history:', historyError);
      return false;
    }
    
    console.log(`[generatePlayerTournamentHistory] Created history for ${historyData.length} players`);
    return true;
  } catch (e: any) {
    console.error('[generatePlayerTournamentHistory] Unexpected error:', e);
    return false;
  }
}

/**
 * Función para procesar retroactivamente todos los torneos finalizados
 */
export async function processHistoricalTournaments(): Promise<{ success: boolean; message: string; processed?: number }> {
  const supabase = await createClient();
  
  try {
    console.log('[processHistoricalTournaments] Starting historical processing...');
    
    // Obtener todos los torneos finalizados ordenados por fecha
    const { data: tournaments, error } = await supabase
      .from('tournaments')
      .select('id, name, end_date, start_date')
      .eq('status', 'FINISHED')
      .order('end_date', { ascending: true });
      
    if (error) {
      console.error('[processHistoricalTournaments] Error fetching tournaments:', error);
      return { success: false, message: `Error al obtener torneos: ${error.message}` };
    }
    
    if (!tournaments || tournaments.length === 0) {
      return { success: true, message: 'No hay torneos finalizados para procesar', processed: 0 };
    }
    
    let processed = 0;
    const weekSnapshots = new Set<string>();
    
    for (const tournament of tournaments) {
      console.log(`[processHistoricalTournaments] Processing tournament: ${tournament.name}`);
      
      // Crear snapshot semanal si no existe
      const tournamentDate = new Date(tournament.end_date || tournament.start_date || new Date());
      const weekStart = getWeekStartDate(tournamentDate);
      
      if (!weekSnapshots.has(weekStart)) {
        await createWeeklyRankingSnapshot(weekStart, supabase);
        weekSnapshots.add(weekStart);
      }
      
      // Generar historial del torneo
      const success = await generatePlayerTournamentHistory(tournament.id, supabase);
      if (success) {
        processed++;
      }
      
      // Crear snapshot post-torneo
      await createWeeklyRankingSnapshot(weekStart, supabase);
    }
    
    console.log(`[processHistoricalTournaments] Completed. Processed ${processed} tournaments`);
    return { 
      success: true, 
      message: `Procesamiento completado. ${processed} torneos procesados exitosamente.`,
      processed 
    };
    
  } catch (e: any) {
    console.error('[processHistoricalTournaments] Unexpected error:', e);
    return { success: false, message: `Error inesperado: ${e.message}` };
  }
} 

/**
 * Obtiene las estadísticas de la semana: jugadores que más puntos sumaron
 */
export async function getWeeklyTopPerformers(weekStartDate?: string): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
  weekStart?: string;
}> {
  const supabase = await createClient();
  
  try {
    // Si no se proporciona fecha, usar la semana actual
    const targetWeekStart = weekStartDate || getWeekStartDate(new Date());
    
    // Obtener historial de torneos de esa semana
    const { data: weekHistory, error } = await supabase
      .from('player_tournament_history')
      .select(`
        player_id,
        points_earned,
        rank_change,
        points_before,
        points_after,
        tournament_id,
        tournaments!inner(name, end_date),
        players!inner(first_name, last_name)
      `)
      .gte('created_at', `${targetWeekStart}T00:00:00Z`)
      .lt('created_at', `${new Date(new Date(targetWeekStart).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}T00:00:00Z`)
      .order('points_earned', { ascending: false });
    
    if (error) {
      console.error('[getWeeklyTopPerformers] Error fetching weekly data:', error);
      return { success: false, error: error.message };
    }
    
    if (!weekHistory || weekHistory.length === 0) {
      return { 
        success: true, 
        data: [], 
        weekStart: targetWeekStart,
        error: 'No hay datos para esta semana' 
      };
    }
    
    // Procesar datos para mostrar top performers
    const processedData = weekHistory
      .filter((record: any) => record.points_earned > 0) // Solo los que sumaron puntos
      .slice(0, 10) // Top 10
      .map((record: any) => ({
        playerId: record.player_id,
        playerName: `${record.players.first_name} ${record.players.last_name}`.trim(),
        pointsEarned: record.points_earned,
        rankChange: record.rank_change,
        pointsBefore: record.points_before,
        pointsAfter: record.points_after,
        tournamentName: record.tournaments.name,
        tournamentDate: record.tournaments.end_date
      }));
    
    return {
      success: true,
      data: processedData,
      weekStart: targetWeekStart
    };
    
  } catch (e: any) {
    console.error('[getWeeklyTopPerformers] Unexpected error:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Obtiene comparación de ranking entre dos semanas
 */
export async function getWeeklyRankingComparison(currentWeek?: string, previousWeek?: string): Promise<{
  success: boolean;
  data?: {
    biggestGainers: any[];
    biggestLosers: any[];
    weeklyStats: {
      currentWeek: string;
      previousWeek: string;
      totalPlayers: number;
      playersWithChanges: number;
    };
  };
  error?: string;
}> {
  const supabase = await createClient();
  
  try {
    const currentWeekStart = currentWeek || getWeekStartDate(new Date());
    const previousWeekDate = new Date(currentWeekStart);
    previousWeekDate.setDate(previousWeekDate.getDate() - 7);
    const previousWeekStart = previousWeek || previousWeekDate.toISOString().split('T')[0];
    
    // Obtener snapshots de ambas semanas
    const [currentSnapshots, previousSnapshots] = await Promise.all([
      supabase
        .from('ranking_snapshots')
        .select(`
          player_id,
          rank_position,
          score,
          players!inner(first_name, last_name)
        `)
        .eq('week_start_date', currentWeekStart)
        .eq('snapshot_type', 'weekly'),
      
      supabase
        .from('ranking_snapshots')
        .select(`
          player_id,
          rank_position,
          score,
          players!inner(first_name, last_name)
        `)
        .eq('week_start_date', previousWeekStart)
        .eq('snapshot_type', 'weekly')
    ]);
    
    if (currentSnapshots.error || previousSnapshots.error) {
      console.error('[getWeeklyRankingComparison] Error fetching snapshots:', 
        currentSnapshots.error || previousSnapshots.error);
      return { 
        success: false, 
        error: currentSnapshots.error?.message || previousSnapshots.error?.message 
      };
    }
    
    if (!currentSnapshots.data || !previousSnapshots.data) {
      return { 
        success: false, 
        error: 'No se encontraron datos de ranking para las semanas solicitadas' 
      };
    }
    
    // Crear mapas para fácil comparación
    const currentMap = new Map();
    const previousMap = new Map();
    
    currentSnapshots.data.forEach((snap: any) => {
      currentMap.set(snap.player_id, snap);
    });
    
    previousSnapshots.data.forEach((snap: any) => {
      previousMap.set(snap.player_id, snap);
    });
    
    // Calcular cambios
    const changes: any[] = [];
    
    currentMap.forEach((current: any, playerId: string) => {
      const previous = previousMap.get(playerId);
      if (previous) {
        const rankChange = previous.rank_position - current.rank_position; // Positivo = subió
        const pointsChange = current.score - previous.score;
        
        if (rankChange !== 0) {
          changes.push({
            playerId,
            playerName: `${current.players.first_name} ${current.players.last_name}`.trim(),
            currentRank: current.rank_position,
            previousRank: previous.rank_position,
            rankChange,
            currentScore: current.score,
            previousScore: previous.score,
            pointsChange
          });
        }
      }
    });
    
    // Ordenar y obtener top gainers/losers
    const biggestGainers = changes
      .filter(change => change.rankChange > 0)
      .sort((a, b) => b.rankChange - a.rankChange)
      .slice(0, 5);
      
    const biggestLosers = changes
      .filter(change => change.rankChange < 0)
      .sort((a, b) => a.rankChange - b.rankChange)
      .slice(0, 5);
    
    return {
      success: true,
      data: {
        biggestGainers,
        biggestLosers,
        weeklyStats: {
          currentWeek: currentWeekStart,
          previousWeek: previousWeekStart,
          totalPlayers: currentSnapshots.data.length,
          playersWithChanges: changes.length
        }
      }
    };
    
  } catch (e: any) {
    console.error('[getWeeklyRankingComparison] Unexpected error:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Obtiene el resumen de actividad de las últimas semanas
 */
export async function getRecentWeeksActivity(weeksCount: number = 4): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  const supabase = await createClient();
  
  try {
    const currentDate = new Date();
    const weeks = [];
    
    // Generar las fechas de las últimas N semanas
    for (let i = 0; i < weeksCount; i++) {
      const weekDate = new Date(currentDate);
      weekDate.setDate(weekDate.getDate() - (i * 7));
      const weekStart = getWeekStartDate(weekDate);
      weeks.push(weekStart);
    }
    
    const weeklyData = [];
    
    for (const weekStart of weeks) {
      // Obtener torneos de esa semana
      const weekEndDate = new Date(weekStart);
      weekEndDate.setDate(weekEndDate.getDate() + 7);
      
      const { data: tournaments, error: tournamentsError } = await supabase
        .from('tournaments')
        .select('id, name, end_date')
        .eq('status', 'FINISHED')
        .gte('end_date', `${weekStart}T00:00:00Z`)
        .lt('end_date', `${weekEndDate.toISOString().split('T')[0]}T00:00:00Z`);
      
      // Obtener estadísticas de puntos de esa semana
      const { data: weekStats, error: statsError } = await supabase
        .rpc('get_week_summary', { week_start: weekStart });
      
      if (!tournamentsError && tournaments) {
        weeklyData.push({
          weekStart,
          tournamentsCount: tournaments.length,
          tournaments: tournaments.map((t: any) => ({ id: t.id, name: t.name, endDate: t.end_date })),
          // stats: weekStats || { totalPointsAwarded: 0, playersParticipated: 0 }
        });
      }
    }
    
    return {
      success: true,
      data: weeklyData.reverse() // Orden cronológico
    };
    
  } catch (e: any) {
    console.error('[getRecentWeeksActivity] Unexpected error:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Obtiene los puntos ganados por un jugador en la última semana
 */
export async function getPlayerWeeklyPoints(playerId: string): Promise<{
  success: boolean;
  pointsThisWeek: number;
  error?: string;
}> {
  const supabase = await createClient();
  
  try {
    // Calcular el inicio de la semana actual
    const currentWeekStart = getWeekStartDate(new Date());
    const weekEndDate = new Date(currentWeekStart);
    weekEndDate.setDate(weekEndDate.getDate() + 7);
    
    // Obtener el historial de torneos de esta semana para el jugador
    const { data: weekHistory, error } = await supabase
      .from('player_tournament_history')
      .select('points_earned')
      .eq('player_id', playerId)
      .gte('created_at', `${currentWeekStart}T00:00:00Z`)
      .lt('created_at', `${weekEndDate.toISOString().split('T')[0]}T00:00:00Z`);
    
    if (error) {
      console.error('[getPlayerWeeklyPoints] Error fetching weekly points:', error);
      return { success: false, pointsThisWeek: 0, error: error.message };
    }
    
    // Sumar todos los puntos ganados en la semana
    const totalPoints = weekHistory?.reduce((sum, record) => sum + (record.points_earned || 0), 0) || 0;
    
    return {
      success: true,
      pointsThisWeek: totalPoints
    };
    
  } catch (e: any) {
    console.error('[getPlayerWeeklyPoints] Unexpected error:', e);
    return { success: false, pointsThisWeek: 0, error: e.message };
  }
}

/**
 * Obtiene los puntos ganados en la última semana para múltiples jugadores
 */
export async function getMultiplePlayersWeeklyPoints(playerIds: string[]): Promise<{
  success: boolean;
  weeklyPoints: { [playerId: string]: number };
  error?: string;
}> {
  const supabase = await createClient();
  
  try {
    if (playerIds.length === 0) {
      return { success: true, weeklyPoints: {} };
    }
    
    // Calcular el inicio de la semana actual
    const currentWeekStart = getWeekStartDate(new Date());
    const weekEndDate = new Date(currentWeekStart);
    weekEndDate.setDate(weekEndDate.getDate() + 7);
    
    // Obtener el historial de torneos de esta semana para todos los jugadores
    const { data: weekHistory, error } = await supabase
      .from('player_tournament_history')
      .select('player_id, points_earned')
      .in('player_id', playerIds)
      .gte('created_at', `${currentWeekStart}T00:00:00Z`)
      .lt('created_at', `${weekEndDate.toISOString().split('T')[0]}T00:00:00Z`);
    
    if (error) {
      console.error('[getMultiplePlayersWeeklyPoints] Error fetching weekly points:', error);
      return { success: false, weeklyPoints: {}, error: error.message };
    }
    
    // Agrupar y sumar puntos por jugador
    const weeklyPoints: { [playerId: string]: number } = {};
    
    // Inicializar todos los jugadores con 0 puntos
    playerIds.forEach(playerId => {
      weeklyPoints[playerId] = 0;
    });
    
    // Sumar los puntos ganados
    weekHistory?.forEach(record => {
      if (weeklyPoints.hasOwnProperty(record.player_id)) {
        weeklyPoints[record.player_id] += record.points_earned || 0;
      }
    });
    
    return {
      success: true,
      weeklyPoints
    };
    
  } catch (e: any) {
    console.error('[getMultiplePlayersWeeklyPoints] Unexpected error:', e);
    return { success: false, weeklyPoints: {}, error: e.message };
  }
}

/**
 * Converts an individual player registration to a couple registration
 * Automatically removes the individual registration and creates a couple registration
 */
export async function registerCoupleForTournamentAndRemoveIndividual(
  tournamentId: string, 
  player1Id: string, 
  player2Id: string
): Promise<{ 
  success: boolean; 
  error?: string; 
  inscription?: any; 
  convertedFrom?: 'player1' | 'player2' | null;
  message?: string;
}> {
  console.log("🔥🔥🔥 [registerCoupleForTournamentAndRemoveIndividual] FUNCIÓN NUEVA LLAMADA 🔥🔥🔥");
  console.log(`[registerCoupleForTournamentAndRemoveIndividual] Iniciando conversión de inscripción individual a pareja en torneo ${tournamentId}`, { 
    player1Id, 
    player2Id,
    types: { player1Id: typeof player1Id, player2Id: typeof player2Id }
  });
  const supabase = await createClient();
  
  try {
    // First, get tournament info to determine category
    const { data: tournamentData, error: tournamentError } = await supabase
      .from('tournaments')
      .select('category_name')
      .eq('id', tournamentId)
      .single();
      
    if (tournamentError) {
      console.error("[registerCoupleForTournamentAndRemoveIndividual] Error fetching tournament:", tournamentError);
      return { success: false, error: "Error al obtener información del torneo" };
    }
    
    // Determine category name
    const categoryName = tournamentData.category_name || '';
    
    // Check and categorize both players if needed
    if (categoryName) {
      // Categorize player 1
      const categorization1 = await checkAndCategorizePlayer(player1Id, categoryName, supabase);
      if (!categorization1.success) {
        console.error("[registerCoupleForTournamentAndRemoveIndividual] Error categorizing player 1:", categorization1.message);
        return { success: false, error: categorization1.message };
      }
      
      // Categorize player 2
      const categorization2 = await checkAndCategorizePlayer(player2Id, categoryName, supabase);
      if (!categorization2.success) {
        console.error("[registerCoupleForTournamentAndRemoveIndividual] Error categorizing player 2:", categorization2.message);
        return { success: false, error: categorization2.message };
      }
      
      if (categorization1.wasCategorized) {
        console.log(`[registerCoupleForTournamentAndRemoveIndividual] Player 1 ${player1Id} was categorized with score ${categorization1.newScore}`);
      }
      if (categorization2.wasCategorized) {
        console.log(`[registerCoupleForTournamentAndRemoveIndividual] Player 2 ${player2Id} was categorized with score ${categorization2.newScore}`);
      }
    }

    // Check existing inscriptions for both players
    const { data: existingInscriptions, error: checkError } = await supabase
      .from('inscriptions')
      .select(`
        id, 
        player_id, 
        couple_id,
        couples (
          id,
          player1_id,
          player2_id
        )
      `)
      .eq('tournament_id', tournamentId)
      .eq('is_pending', false)
      .or(`player_id.eq.${player1Id},player_id.eq.${player2Id}`);

    if (checkError) {
      console.error("[registerCoupleForTournamentAndRemoveIndividual] Error checking existing inscriptions:", checkError);
      return { success: false, error: "Error al verificar inscripciones existentes." };
    }

    console.log(`[registerCoupleForTournamentAndRemoveIndividual] Found ${existingInscriptions?.length || 0} existing inscriptions:`, existingInscriptions);

    // Analyze existing inscriptions
    let individualInscriptionToRemove: any = null;
    let convertedFrom: 'player1' | 'player2' | null = null;
    let otherPlayerInCouple = false;

    if (existingInscriptions && existingInscriptions.length > 0) {
      for (const inscription of existingInscriptions) {
        // Check for individual inscriptions
        if (inscription.player_id && !inscription.couple_id) {
          if (inscription.player_id === player1Id) {
            individualInscriptionToRemove = inscription;
            convertedFrom = 'player1';
          } else if (inscription.player_id === player2Id) {
            individualInscriptionToRemove = inscription;
            convertedFrom = 'player2';
          }
        }
        // Check if either player is already in a couple
        else if (inscription.couple_id && inscription.couples) {
          const couple = Array.isArray(inscription.couples) ? inscription.couples[0] : inscription.couples;
          if (couple && (
            couple.player1_id === player1Id || 
            couple.player1_id === player2Id ||
            couple.player2_id === player1Id || 
            couple.player2_id === player2Id
          )) {
            otherPlayerInCouple = true;
          }
        }
      }
    }

    console.log(`[registerCoupleForTournamentAndRemoveIndividual] Analysis results:`, {
      individualInscriptionToRemove: individualInscriptionToRemove ? { id: individualInscriptionToRemove.id, player_id: individualInscriptionToRemove.player_id } : null,
      convertedFrom,
      otherPlayerInCouple
    });

    // Validate conversion conditions
    if (otherPlayerInCouple) {
      return { 
        success: false, 
        error: "Uno de los jugadores ya está inscrito en otra pareja para este torneo." 
      };
    }

    if (!individualInscriptionToRemove) {
      // Neither player has individual registration, use regular couple registration
      console.log("[registerCoupleForTournamentAndRemoveIndividual] No individual registration found, proceeding with regular couple registration");
      const result = await registerCoupleForTournament(tournamentId, player1Id, player2Id);
      return {
        ...result,
        convertedFrom: null,
        message: result.success ? "Pareja inscrita correctamente" : result.error
      };
    }

    // Create or find the couple
    const { data: existingCouple, error: findCoupleError } = await supabase
      .from('couples')
      .select('id')
      .or(`and(player1_id.eq.${player1Id},player2_id.eq.${player2Id}),and(player1_id.eq.${player2Id},player2_id.eq.${player1Id})`)
      .maybeSingle();

    if (findCoupleError) {
      console.error("[registerCoupleForTournamentAndRemoveIndividual] Error checking existing couple:", findCoupleError);
      return { success: false, error: "Error al verificar pareja existente." };
    }

    let coupleIdToInsert: string;
    
    if (existingCouple) {
      coupleIdToInsert = existingCouple.id;
    } else {
      // Create new couple
      const { data: newCouple, error: coupleError } = await supabase
        .from('couples')
        .insert({ player1_id: player1Id, player2_id: player2Id })
        .select('id')
        .single();
      
      if (coupleError || !newCouple?.id) {
        console.error("[registerCoupleForTournamentAndRemoveIndividual] Error creating couple:", coupleError);
        return { success: false, error: "No se pudo crear la pareja." };
      }
      coupleIdToInsert = newCouple.id;
    }

    // Check for existing couple inscription
    const { data: existingCoupleInscription, error: checkCoupleError } = await supabase
      .from('inscriptions')
      .select('id')
      .eq('tournament_id', tournamentId)
      .eq('couple_id', coupleIdToInsert)
      .eq('is_pending', false)
      .maybeSingle();

    if (checkCoupleError) {
      console.error("[registerCoupleForTournamentAndRemoveIndividual] Error checking existing couple inscription:", checkCoupleError);
      return { success: false, error: "Error al verificar inscripción de pareja existente." };
    }
    
    if (existingCoupleInscription) {
      return { success: false, error: "Esta pareja ya está inscrita en el torneo." };
    }

    // Strategy: Create new couple inscription and delete individual inscription
    
    // First, create the new couple inscription
    // We'll use the player_id of the player who was individually registered as the main reference
    const { data: newInscription, error: insertError } = await supabase
      .from('inscriptions')
      .insert({
        tournament_id: tournamentId,
        couple_id: coupleIdToInsert,
        player_id: individualInscriptionToRemove.player_id, // Keep the original player_id as reference
        is_pending: false
      })
      .select('id')
      .single();
      
    if (insertError || !newInscription) {
      console.error("[registerCoupleForTournamentAndRemoveIndividual] Error creating couple inscription:", insertError);
      return { success: false, error: "No se pudo crear la inscripción de pareja." };
    }
    
    // Then, delete the individual inscription
    const { error: deleteError } = await supabase
      .from('inscriptions')
      .delete()
      .eq('id', individualInscriptionToRemove.id);
      
    if (deleteError) {
      console.error("[registerCoupleForTournamentAndRemoveIndividual] Error deleting individual inscription:", deleteError);
      // Try to rollback by deleting the couple inscription we just created
      await supabase
        .from('inscriptions')
        .delete()
        .eq('id', newInscription.id);
      return { success: false, error: "No se pudo eliminar la inscripción individual." };
    }
    
    console.log(`[registerCoupleForTournamentAndRemoveIndividual] Successfully converted individual inscription ${individualInscriptionToRemove.id} to couple inscription ${newInscription.id} for couple ${coupleIdToInsert}`);
    
    revalidatePath(`/tournaments/${tournamentId}`);
    
    const convertedPlayerName = convertedFrom === 'player1' ? 'primer jugador' : 'segundo jugador';
    return { 
      success: true, 
      inscription: newInscription,
      convertedFrom,
      message: `Inscripción convertida exitosamente. El ${convertedPlayerName} que estaba inscrito individualmente ahora forma pareja contigo.`
    };

  } catch (error: any) {
    console.error("[registerCoupleForTournamentAndRemoveIndividual] Unexpected error:", error);
    return { 
      success: false, 
      error: `Error inesperado al convertir inscripción: ${error.message}` 
    };
  }
}

// Helper function to get custom pairing indices for traditional bracket distribution
// This creates the specific pairing pattern requested: best vs worst at top, second best vs second worst at bottom
function getCustomPairingIndices(bracketSize: number): number[] {
  const pairingMaps: Record<number, number[]> = {
    // For 2 teams (1 match): [1v2] - single match
    2: [0, 1],
    
    // For 4 teams (2 matches): [1v4, 2v3] with 2nd best (seed 2) at bottom
    4: [0, 3, 1, 2],
    
    // For 8 teams (4 matches): [1v8, 4v6, 5v3, 7v2] with 2nd best (seed 2) at bottom  
    8: [0, 7, 3, 5, 4, 2, 6, 1],
    
    // For 16 teams (8 matches): balanced distribution with proper seeding
    16: [0, 15, 7, 8, 3, 12, 4, 11, 1, 14, 6, 9, 2, 13, 5, 10],
    
    // For 32 teams (16 matches): full bracket distribution
    32: [0, 31, 15, 16, 7, 24, 8, 23, 3, 28, 12, 19, 4, 27, 11, 20, 1, 30, 14, 17, 6, 25, 9, 22, 2, 29, 13, 18, 5, 26, 10, 21],
    
    // For 64 teams (32 matches): extended bracket distribution  
    64: [0, 63, 31, 32, 15, 48, 16, 47, 7, 56, 24, 39, 8, 55, 23, 40, 3, 60, 28, 35, 12, 51, 19, 44, 4, 59, 27, 36, 11, 52, 20, 43, 1, 62, 30, 33, 14, 49, 17, 46, 6, 57, 25, 38, 9, 54, 22, 41, 2, 61, 29, 34, 13, 50, 18, 45, 5, 58, 26, 37, 10, 53, 21, 42]
  };
  
  // Return custom mapping or fall back to standard pairing for unsupported sizes
  if (pairingMaps[bracketSize]) {
    return pairingMaps[bracketSize];
  }
  
  // Fallback to standard pairing (1vN, 2v(N-1), etc.) for unsupported bracket sizes
  const standardIndices: number[] = [];
  for (let i = 0; i < bracketSize / 2; i++) {
    standardIndices.push(i, bracketSize - 1 - i);
  }
  return standardIndices;
}

// =============================================================================
// NUEVO ALGORITMO DE SEEDING PARA BRACKETS ELIMINATORIOS
// =============================================================================

import { 
  generateEliminationBracket, 
  CoupleSeeded, 
  BracketMatch,
  validateCouplesData,
  convertMatchesToDatabaseFormat,
  debugSeeding,
  assignGlobalSeeds
} from '@/utils/bracket-generator';

/**
 * Extrae datos de parejas clasificadas desde la base de datos y los convierte al formato CoupleSeeded
 */
async function extractCouplesSeededFromDatabase(tournamentId: string, supabase: any): Promise<CoupleSeeded[]> {
  console.log(`[extractCouplesSeeded] Extrayendo parejas clasificadas para torneo ${tournamentId}`);

  // 1. Obtener todas las zonas del torneo con sus parejas y estadísticas
  // IMPORTANTE: Ordenar por created_at para respetar el orden de creación
  const { data: zones, error: zonesError } = await supabase
    .from('zones')
    .select(`
      id,
      name,
      created_at,
      zone_couples (
        couple_id,
        couples (
          id,
          player1_id,
          player2_id,
          player1_details:players!couples_player1_id_fkey(first_name, last_name),
          player2_details:players!couples_player2_id_fkey(first_name, last_name)
        )
      )
    `)
    .eq('tournament_id', tournamentId)
    .eq('es_prueba', false)
    .order('created_at', { ascending: true }); // Ordenar por orden de creación

  if (zonesError) {
    console.error('[extractCouplesSeeded] Error fetching zones:', zonesError);
    throw new Error(`Error obteniendo zonas: ${zonesError.message}`);
  }

  if (!zones || zones.length === 0) {
    console.log('[extractCouplesSeeded] No se encontraron zonas para el torneo');
    return [];
  }

  console.log('[extractCouplesSeeded] Zonas ordenadas por creación:', zones.map((z: any) => ({ name: z.name, created_at: z.created_at })));

  // 2. Para cada zona, calcular las estadísticas de las parejas
  const couplesSeeded: CoupleSeeded[] = [];

  for (const zone of zones) {
    const zoneName = zone.name;
    const couples = zone.zone_couples?.map((zc: any) => zc.couples).filter(Boolean) || [];

    if (couples.length === 0) continue;

    console.log(`[extractCouplesSeeded] Procesando zona ${zoneName} con ${couples.length} parejas`);

    // Obtener matches de esta zona para calcular estadísticas
    const { data: zoneMatches, error: matchesError } = await supabase
      .from('matches')
      .select('couple1_id, couple2_id, winner_id, result_couple1, result_couple2, status')
      .eq('tournament_id', tournamentId)
      .eq('zone_id', zone.id)
      .eq('status', 'COMPLETED');

    if (matchesError) {
      console.error(`[extractCouplesSeeded] Error fetching matches for zone ${zoneName}:`, matchesError);
      continue;
    }

    // Calcular estadísticas para cada pareja en esta zona
    const coupleStats: { [coupleId: string]: { points: number; scored: number; conceded: number; played: number; won: number; lost: number } } = {};

    couples.forEach((couple: any) => {
      coupleStats[couple.id] = { points: 0, scored: 0, conceded: 0, played: 0, won: 0, lost: 0 };
    });

    (zoneMatches || []).forEach((match: any) => {
      const couple1Id = match.couple1_id;
      const couple2Id = match.couple2_id;
      const winnerId = match.winner_id;

      if (couple1Id && coupleStats[couple1Id]) {
        coupleStats[couple1Id].played++;
        const games1 = parseInt(match.result_couple1 || '0');
        const games2 = parseInt(match.result_couple2 || '0');
        coupleStats[couple1Id].scored += games1;
        coupleStats[couple1Id].conceded += games2;
        
        if (winnerId === couple1Id) {
          coupleStats[couple1Id].won++;
          coupleStats[couple1Id].points += POINTS_FOR_WINNING_MATCH; // Puntos por ganar
        } else {
          coupleStats[couple1Id].lost++;
          coupleStats[couple1Id].points += Math.abs(POINTS_FOR_LOSING_MATCH); // Usar valor absoluto para cálculo
        }
      }

      if (couple2Id && coupleStats[couple2Id]) {
        coupleStats[couple2Id].played++;
        const games1 = parseInt(match.result_couple1 || '0');
        const games2 = parseInt(match.result_couple2 || '0');
        coupleStats[couple2Id].scored += games2;
        coupleStats[couple2Id].conceded += games1;
        
        if (winnerId === couple2Id) {
          coupleStats[couple2Id].won++;
          coupleStats[couple2Id].points += POINTS_FOR_WINNING_MATCH; // Puntos por ganar
        } else {
          coupleStats[couple2Id].lost++;
          coupleStats[couple2Id].points += Math.abs(POINTS_FOR_LOSING_MATCH); // Usar valor absoluto para cálculo
        }
      }
    });

    // Ordenar parejas en la zona por puntos y diferencia de juegos
    const sortedCouples = couples.sort((a: any, b: any) => {
      const statsA = coupleStats[a.id];
      const statsB = coupleStats[b.id];
      
      // Primero por puntos
      if (statsB.points !== statsA.points) {
        return statsB.points - statsA.points;
      }
      
      // Luego por diferencia de juegos
      const diffA = statsA.scored - statsA.conceded;
      const diffB = statsB.scored - statsB.conceded;
      if (diffB !== diffA) {
        return diffB - diffA;
      }
      
      // Finalmente por juegos a favor
      return statsB.scored - statsA.scored;
    });

    // Convertir a formato CoupleSeeded
    // IMPORTANTE: Incluir TODAS las parejas, no solo las ganadoras
    sortedCouples.forEach((couple: any, index: number) => {
      const stats = coupleStats[couple.id];
      const player1Name = `${couple.player1_details?.first_name || ''} ${couple.player1_details?.last_name || ''}`.trim();
      const player2Name = `${couple.player2_details?.first_name || ''} ${couple.player2_details?.last_name || ''}`.trim();
      
      couplesSeeded.push({
        id: couple.id,
        zona: zoneName,
        puntos: stats.points,
        posicionEnZona: index + 1, // 1-indexado
        player1_id: couple.player1_id,
        player2_id: couple.player2_id,
        player1_name: player1Name || 'Jugador 1',
        player2_name: player2Name || 'Jugador 2',
        zone_id: zone.id,
        // Incluir stats completas para referencia
        games_scored: stats.scored,
        games_conceded: stats.conceded,
        matches_played: stats.played,
        matches_won: stats.won,
        matches_lost: stats.lost
      });
    });
  }

  console.log(`[extractCouplesSeeded] Extraídas ${couplesSeeded.length} parejas clasificadas de ${zones.length} zonas`);
  
  // Mostrar resumen por zona
  const zonesSummary = zones.map((z: any) => {
    const couplesInZone = couplesSeeded.filter(c => c.zona === z.name);
    return `${z.name}: ${couplesInZone.length} parejas`;
  });
  console.log(`[extractCouplesSeeded] Resumen: ${zonesSummary.join(', ')}`);
  
  return couplesSeeded;
}

/**
 * Función principal mejorada que genera las seeds y los matches eliminatorios
 * Reemplaza a populateTournamentSeedCouples y createKnockoutStageMatchesAction
 */
export async function generateEliminationBracketAction(tournamentId: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  seededCouples?: any[];
  matches?: any[];
}> {
  try {
    const supabase = await createClient();
    console.log(`[generateEliminationBracket] Iniciando generación de bracket para torneo ${tournamentId}`);

    // Paso 1: Extraer parejas clasificadas
    const couplesData = await extractCouplesSeededFromDatabase(tournamentId, supabase);
    
    if (couplesData.length === 0) {
      return { success: false, error: "No hay parejas clasificadas para generar el bracket eliminatorio." };
    }

    // Paso 2: Validar datos
    const validation = validateCouplesData(couplesData);
    if (!validation.valid) {
      console.error('[generateEliminationBracket] Datos inválidos:', validation.errors);
      return { success: false, error: `Datos inválidos: ${validation.errors.join(', ')}` };
    }

    // Paso 3: Debug del proceso (opcional, remover en producción)
    console.log('[generateEliminationBracket] Datos de entrada:');
    couplesData.forEach(couple => {
      console.log(`  ${couple.id}: Zona ${couple.zona}, Pos ${couple.posicionEnZona}, ${couple.puntos} pts`);
    });

    // Paso 4: Generar bracket
    const bracketMatches = generateEliminationBracket(couplesData);
    
    if (bracketMatches.length === 0) {
      return { success: false, error: "No se pudieron generar matches para el bracket." };
    }

    // Paso 5: Asignar seeds globales y guardar en tournament_couple_seeds
    const seededCouples = assignGlobalSeeds(couplesData);
    
    // Limpiar seeds antiguos
    const { error: deleteOldSeedsError } = await supabase
      .from('tournament_couple_seeds')
      .delete()
      .eq('tournament_id', tournamentId);

    if (deleteOldSeedsError) {
      console.error('[generateEliminationBracket] Error eliminando seeds antiguos:', deleteOldSeedsError);
      return { success: false, error: `Error limpiando datos antiguos: ${deleteOldSeedsError.message}` };
    }

    // Insertar nuevos seeds
    const seedInserts = seededCouples.map(couple => ({
      tournament_id: tournamentId,
      couple_id: couple.id,
      seed: couple.seed,
      zone_id: couple.zone_id,
      es_prueba: false
    }));

    const { data: insertedSeeds, error: insertSeedsError } = await supabase
      .from('tournament_couple_seeds')
      .insert(seedInserts)
      .select();

    if (insertSeedsError) {
      console.error('[generateEliminationBracket] Error insertando seeds:', insertSeedsError);
      return { success: false, error: `Error guardando seeds: ${insertSeedsError.message}` };
    }

    // Paso 6: Limpiar matches eliminatorios antiguos
    const { error: deleteOldMatchesError } = await supabase
      .from('matches')
      .delete()
      .eq('tournament_id', tournamentId)
      .neq('round', 'ZONE');

    if (deleteOldMatchesError) {
      console.error('[generateEliminationBracket] Error eliminando matches antiguos:', deleteOldMatchesError);
      return { success: false, error: `Error limpiando matches antiguos: ${deleteOldMatchesError.message}` };
    }

    // Paso 7: Convertir matches a formato de base de datos e insertar
    const matchesForDb = convertMatchesToDatabaseFormat(bracketMatches, tournamentId);
    
    const { data: insertedMatches, error: insertMatchesError } = await supabase
      .from('matches')
      .insert(matchesForDb)
      .select();

    if (insertMatchesError) {
      console.error('[generateEliminationBracket] Error insertando matches:', insertMatchesError);
      return { success: false, error: `Error guardando matches: ${insertMatchesError.message}` };
    }

    // Paso 8: Actualizar estado del torneo
    const { error: updateTournamentError } = await supabase
      .from('tournaments')
      .update({ status: 'IN_PROGRESS' })
      .eq('id', tournamentId);

    if (updateTournamentError) {
      console.error('[generateEliminationBracket] Error actualizando torneo:', updateTournamentError);
      // No fallar por esto, el bracket ya se generó correctamente
    }

    // Paso 9: Limpiar la caché
    revalidatePath(`/tournaments/${tournamentId}`);
    revalidatePath('/tournaments');

    console.log(`[generateEliminationBracket] ✅ Bracket generado exitosamente:`);
    console.log(`  - ${seededCouples.length} parejas sembradas`);
    console.log(`  - ${bracketMatches.length} matches creados`);
    console.log(`  - Ronda inicial: ${bracketMatches[0]?.round}`);

    return {
      success: true,
      message: `Bracket eliminatorio generado exitosamente. ${seededCouples.length} parejas sembradas, ${bracketMatches.length} matches creados.`,
      seededCouples: insertedSeeds,
      matches: insertedMatches
    };

  } catch (error: any) {
    console.error('[generateEliminationBracket] Error inesperado:', error);
    return { 
      success: false, 
      error: `Error inesperado al generar bracket: ${error.message}` 
    };
  }
}

/**
 * Función de utilidad para verificar el estado de las zonas antes de generar brackets
 */
export async function checkZonesReadyForElimination(tournamentId: string): Promise<{
  ready: boolean;
  message: string;
  zones?: any[];
  totalCouples?: number;
}> {
  try {
    const supabase = await createClient();

    // Obtener zonas con matches
    const { data: zones, error: zonesError } = await supabase
      .from('zones')
      .select(`
        id,
        name,
        zone_couples (count),
        matches (
          id,
          status
        )
      `)
      .eq('tournament_id', tournamentId)
      .eq('es_prueba', false);

    if (zonesError) {
      return { ready: false, message: `Error verificando zonas: ${zonesError.message}` };
    }

    if (!zones || zones.length === 0) {
      return { ready: false, message: "No hay zonas configuradas en el torneo." };
    }

    let totalCouples = 0;
    const zonesStatus = zones.map(zone => {
      const couplesCount = zone.zone_couples?.[0]?.count || 0;
      const matches = zone.matches || [];
      const completedMatches = matches.filter(m => m.status === 'COMPLETED').length;
      const totalMatches = matches.length;
      
      totalCouples += couplesCount;
      
      return {
        name: zone.name,
        couples: couplesCount,
        matches: `${completedMatches}/${totalMatches}`,
        completed: totalMatches > 0 && completedMatches === totalMatches
      };
    });

    const allZonesCompleted = zonesStatus.every(z => z.completed);

    if (!allZonesCompleted) {
      const incompleteZones = zonesStatus.filter(z => !z.completed).map(z => z.name);
      return {
        ready: false,
        message: `Las siguientes zonas no han completado todos sus matches: ${incompleteZones.join(', ')}`,
        zones: zonesStatus,
        totalCouples
      };
    }

    if (totalCouples < 2) {
      return {
        ready: false,
        message: `Se necesitan al menos 2 parejas para generar brackets. Encontradas: ${totalCouples}`,
        zones: zonesStatus,
        totalCouples
      };
    }

    return {
      ready: true,
      message: `✅ Todas las zonas están listas. ${totalCouples} parejas clasificadas.`,
      zones: zonesStatus,
      totalCouples
    };

  } catch (error: any) {
    return { ready: false, message: `Error inesperado: ${error.message}` };
  }
}

// Helper function to get custom pairing indices for traditional bracket distribution