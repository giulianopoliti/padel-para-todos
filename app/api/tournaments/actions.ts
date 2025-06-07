'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
// import { getPlayerById } from '../players/actions'; // Not used directly in the refactored parts, can be kept if used elsewhere
// import { getUserByDni } from '../users'; // Not used directly in the refactored parts, can be kept if used elsewhere
import { Zone as GeneratedZone, Couple as GeneratedCouple } from '@/types'; 
import { generateZones } from '@/utils/bracket-generator'; 
import { generateKnockoutRounds, KnockoutPairing } from "@/utils/bracket-generator";
import { ZoneWithRankedCouples, CoupleWithStats } from "@/utils/bracket-generator"; 

const POINTS_FOR_WINNING_MATCH = 3;
const POINTS_FOR_LOSING_MATCH = 1; 
const SCORE_PERCENTAGE_TO_TRANSFER = 0.01; // 1% 

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

// --- HELPER FUNCTIONS (defined once, correctly placed) ---

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
  tournamentId?: string
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

  if (!losingCoupleId) { // Handle BYE (no opponent)
    for (const pId of validWinnerPlayerIds) {
        await _updatePlayerScore(pId, POINTS_FOR_WINNING_MATCH, supabase);
    }
    console.log(`[ScoreUpdate] BYE scenario for winning couple ${winningCoupleId}. Awarded fixed points.`);
    return;
  }

  const { data: loserCouple, error: lcError } = await supabase
    .from('couples')
    .select('player1_id, player2_id')
    .eq('id', losingCoupleId)
    .single();

  if (lcError || !loserCouple) {
    console.error(`[ScoreUpdate] Error fetching losing couple ${losingCoupleId}. Awarding default points to winners.`);
    for (const pId of validWinnerPlayerIds) {
        await _updatePlayerScore(pId, POINTS_FOR_WINNING_MATCH, supabase);
    }
    return;
  }

  const loserP1Id = loserCouple.player1_id;
  const loserP2Id = loserCouple.player2_id;
  const validLoserPlayerIds = [loserP1Id, loserP2Id].filter(id => typeof id === 'string' && id.length > 0) as string[];

  let totalPointsToTransfer = 0;
  const pointsToDeductFromLosers: { [key: string]: number } = {};

  for (const pId of validLoserPlayerIds) {
      const pScore = await _fetchPlayerScore(pId, supabase);
      if (pScore !== null && pScore > 0) {
          const transferAmount = Math.floor(pScore * SCORE_PERCENTAGE_TO_TRANSFER);
          const actualTransfer = Math.min(transferAmount, pScore); // Cannot transfer more than they have
          pointsToDeductFromLosers[pId] = actualTransfer;
          totalPointsToTransfer += actualTransfer;
      }
  }
  
  for (const pId of validLoserPlayerIds) {
      const deduction = pointsToDeductFromLosers[pId] || 0;
      await _updatePlayerScore(pId, POINTS_FOR_LOSING_MATCH - deduction, supabase);
  }

  if (validWinnerPlayerIds.length > 0) {
    const pointsPerWinnerFromTransfer = totalPointsToTransfer > 0 ? Math.floor(totalPointsToTransfer / validWinnerPlayerIds.length) : 0;
    for (const pId of validWinnerPlayerIds) {
        await _updatePlayerScore(pId, POINTS_FOR_WINNING_MATCH + pointsPerWinnerFromTransfer, supabase);
    }
  } else {
      console.warn(`[ScoreUpdate] No valid player IDs found for winning couple ${winningCoupleId}. Points not distributed.`);
  }
  console.log(`[ScoreUpdate] Scores updated. Winner: ${winningCoupleId}, Loser: ${losingCoupleId}. Transferred total: ${totalPointsToTransfer}`);
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
  const { data, error } = await supabase.from('tournaments').update({ status: 'FINISHED' }).eq('id', tournamentId).select().single();
  if (error) {
    console.error("[completeTournament] Error al finalizar torneo:", error);
    throw new Error("No se pudo finalizar el torneo");
  }
  
  // Calcular y asignar todos los puntos ahora que el torneo está terminado
  console.log(`[completeTournament] Tournament ${tournamentId} marked as FINISHED, calculating all points...`);
  await _calculateAllTournamentPoints(tournamentId, supabase);
  console.log(`[completeTournament] Points calculation completed for tournament: ${tournamentId}`);
  
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
      clubes(id, name, address, cover_image_url), 
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

        const couplesWithStats = await Promise.all(
          couples.map(async (couple) => {
            const { data: matches, error: mError } = await supabase.from("matches").select("*").eq("zone_id", zone.id).or(`couple1_id.eq.${couple.id},couple2_id.eq.${couple.id}`).eq("status", "COMPLETED");
            let p=0,w=0,l=0,s=0,c=0,pts=0;
            if (!mError && matches) {
              matches.forEach(m => {
                p++;
                if (m.couple1_id === couple.id) { s += m.score_couple1||0; c += m.score_couple2||0; if (m.winner_id === couple.id) w++; else l++; }
                else { s += m.score_couple2||0; c += m.score_couple1||0; if (m.winner_id === couple.id) w++; else l++; }
              });
              pts = w * POINTS_FOR_WINNING_MATCH + l * POINTS_FOR_LOSING_MATCH; // Zone points based on constants
            }
            return { ...couple, player1_name: `${couple.player1?.first_name||""} ${couple.player1?.last_name||""}`.trim(), player2_name: `${couple.player2?.first_name||""} ${couple.player2?.last_name||""}`.trim(), stats: { played:p, won:w, lost:l, scored:s, conceded:c, points:pts } };
          })
        );
        const sortedCouples = couplesWithStats.sort((a,b) => (b.stats.points - a.stats.points) || ((b.stats.scored - b.stats.conceded) - (a.stats.scored - a.stats.conceded)) || (b.stats.scored - a.stats.scored));
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
          await _calculateAndApplyScoreChanges(winningCoupleId_param, losingCoupleId_param, supabase, tournamentIdForReval || undefined);
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
            winner_id: winner_id   // Asignar el couple_id del ganador de la final
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

    // El emparejamiento estándar es (Slot 1 vs Slot N), (Slot 2 vs Slot N-1), etc.
    // Donde N es bracketSize.
    for (let i = 0; i < bracketSize / 2; i++) {
      const participant1Data = actualParticipantsForPairing[i]; // Corresponde al Slot (i+1)
      const participant2Data = actualParticipantsForPairing[bracketSize - 1 - i]; // Corresponde al Slot (bracketSize - i)

      // Asegurarse de que participant1Data y participant2Data no sean undefined
      if (!participant1Data || !participant2Data) {
          console.error(`[createKnockoutStageMatchesAction] Error crítico: participante no encontrado para emparejamiento. Index i: ${i}`);
          continue; // Saltar este par
      }
      
      console.log(`[createKnockoutStageMatchesAction] Attempting to pair: Slot ${i+1} (Seed ${participant1Data.seed}) vs Slot ${bracketSize-i} (Seed ${participant2Data.seed})`);

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
         await supabase.from('tournaments').update({ status: 'FINISHED', winner_id: rankedCouples[0].couple_id }).eq('id', tournamentId);
         
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
          // If it's a BYE match, we might want to award points if your system does that.
          // await _calculateAndApplyScoreChanges(matchData.winner_id, null, supabase); // Example if BYEs grant points
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
        await supabase.from('tournaments').update({ status: 'FINISHED', winner_id: tournamentWinner.winnerId }).eq('id', tournamentId);
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
            if (matchData.status === 'COMPLETED' && matchData.winner_id) { // BYE match, apply score changes
              await _calculateAndApplyScoreChanges(matchData.winner_id, null, supabase, tournamentId);
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
    // For now, we assume top N from each zone qualify, or all if not specified.
    // Let's assume the ranking is based on 'points' in 'stats', then other criteria.
    for (const zone of zonesResult.zones) {
      if (!zone.couples || zone.couples.length === 0) {
        console.log(`[populateTournamentSeedCouples] Zone ${zone.name} has no couples.`);
        continue;
      }

      const sortedCouplesInZone = [...zone.couples].sort((a, b) => {
        const pointsA = a.stats?.points || 0;
        const pointsB = b.stats?.points || 0;
        if (pointsB !== pointsA) return pointsB - pointsA; // Higher points first

        // Add more tie-breaking criteria here if needed (e.g., sets difference, head-to-head)
        const gamesWonA = a.stats?.scored || 0;
        const gamesWonB = b.stats?.scored || 0;
        if (gamesWonB !== gamesWonA) return gamesWonB - gamesWonA;
        
        const gamesConcededA = a.stats?.conceded || 0;
        const gamesConcededB = b.stats?.conceded || 0;
        return gamesConcededA - gamesConcededB; // Fewer games conceded is better
      });

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