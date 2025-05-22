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
  couple1_id: string;
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
  supabase: any
) {
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
  const { data, error } = await supabase.from('tournaments').update({ status: 'COMPLETED' }).eq('id', tournamentId).select().single();
  if (error) {
    console.error("[completeTournament] Error al finalizar torneo:", error);
    throw new Error("No se pudo finalizar el torneo");
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
  revalidatePath(`/my-tournaments/${tournamentId}`); // Added for consistency
  return { success: true, tournament: plainTournament };
}

export async function getTournamentById(tournamentId: string) {
  if (!tournamentId) {
    console.warn("[getTournamentById] No tournamentId provided");
    return null;
  }
  const supabase = await createClient();
  const { data: rawTournament, error } = await supabase.from('tournaments').select('*, clubes(id, name), categories(name)').eq('id', tournamentId).single();
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

export async function registerCoupleForTournament(tournamentId: string, player1Id: string, player2Id: string) {
  const supabase = await createClient();
  let coupleIdToInsert: string | null = null;
  const {data: coupleData1 } = await supabase.from('couples').select('id').eq('player1_id', player1Id).eq('player2_id', player2Id).maybeSingle();
  const {data: coupleData2 } = await supabase.from('couples').select('id').eq('player1_id', player2Id).eq('player2_id', player1Id).maybeSingle();

  if (coupleData1?.id) coupleIdToInsert = coupleData1.id;
  else if (coupleData2?.id) coupleIdToInsert = coupleData2.id;
  else {
    const {data: newCouple, error: coupleError} = await supabase.from('couples').insert({ player1_id: player1Id, player2_id: player2Id }).select('id').single();
    if (coupleError || !newCouple) {
        console.error("[registerCoupleForTournament] Error creating couple:", coupleError);
        throw new Error("No se pudo crear la pareja.");
    }
    coupleIdToInsert = newCouple.id;
  }
  if (!coupleIdToInsert) throw new Error("No se pudo determinar el ID de la pareja.");

  // Check for existing non-pending inscription for this couple
  const { data: existingInscription, error: checkError } = await supabase
    .from('inscriptions')
    .select('id')
    .eq('tournament_id', tournamentId)
    .eq('couple_id', coupleIdToInsert)
    .eq('is_pending', false)
    .maybeSingle();

  if (checkError) {
    console.error("[registerCoupleForTournament] Error checking existing inscription:", checkError);
    throw new Error("Error al verificar inscripción existente.");
  }
  if (existingInscription) {
    // Depending on desired behavior, you might throw an error or return a specific message
    throw new Error("Esta pareja ya está inscrita en el torneo.");
  }

  const { data, error: inscriptionError } = await supabase
    .from('inscriptions')
    .insert({ 
      tournament_id: tournamentId, 
      couple_id: coupleIdToInsert, 
      player_id: player1Id, // As discussed, using one player for the inscription record
      is_pending: false // Direct registration is not pending
    })
    .select('id')
    .single(); 
  if (inscriptionError) {
    console.error("[registerCoupleForTournament] Error al registrar pareja:", inscriptionError);
    throw new Error("No se pudo inscribir la pareja.");
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

export async function registerAuthenticatedPlayerForTournament(tournamentId: string): Promise<{ success: boolean; message: string; inscriptionId?: string }> {
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
    const { data: updatedMatch, error: fetchMatchError } = await supabase.from("matches").select("tournament_id, couple1_id, couple2_id, winner_id").eq("id", matchId).single();

    if (!fetchMatchError && updatedMatch) {
      tournamentIdForReval = updatedMatch.tournament_id;
      const { couple1_id, couple2_id, winner_id: actualWinnerCoupleId } = updatedMatch;
      let winningCoupleId_param: string | null = null;
      let losingCoupleId_param: string | null = null;

      if (actualWinnerCoupleId) {
        if (couple1_id === actualWinnerCoupleId) { winningCoupleId_param = couple1_id; losingCoupleId_param = couple2_id; }
        else if (couple2_id === actualWinnerCoupleId) { winningCoupleId_param = couple2_id; losingCoupleId_param = couple1_id; }
        
        if (winningCoupleId_param) {
          await _calculateAndApplyScoreChanges(winningCoupleId_param, losingCoupleId_param, supabase);
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
  try {
    const { data: tData, error: tError } = await supabase.from('tournaments').select('id, status').eq('id', tournamentId).single();
    if (tError || !tData) return { success: false, error: (tError?.message || "Error obteniendo torneo.") };
    if (tData.status !== 'IN_PROGRESS' && tData.status !== 'ZONE_COMPLETED') return { success: false, error: `Torneo no en estado válido (actual: ${tData.status}). Se requiere IN_PROGRESS o ZONE_COMPLETED.` };

    const zonesRes = await fetchTournamentZones(tournamentId);
    if (!zonesRes.success || !zonesRes.zones) return { success: false, error: zonesRes.error || "No se pudo obtener datos de zona para eliminatorias." };

    // Correctly map to ZoneWithRankedCouples[], ensuring full stats are preserved.
    const zonesWRCouples: ZoneWithRankedCouples[] = zonesRes.zones.map(z => ({
      ...z, // Spread all properties from the original zone object
      couples: z.couples.map((c: any) => ({ // c is the rich couple object from fetchTournamentZones
        id: c.id,
        player_1: c.player1_id, // Maps player1_id to player_1, assuming CoupleWithStats expects this
        player_2: c.player2_id, // Maps player2_id to player_2, assuming CoupleWithStats expects this
        stats: c.stats // Pass the FULL stats object
      })) as CoupleWithStats[]
    }));

    if (zonesWRCouples.length === 0 && zonesRes.zones.length > 0) {
        console.warn("[createKnockoutStageMatchesAction] Zones found, but no couples with stats. Check zone phase completion and stats calculation.");
        // Depending on rules, this might be an error or simply no one advances.
    } else if (zonesWRCouples.length === 0) {
         return { success: false, error: "No hay datos de zona/parejas para generar eliminatorias." };
    }
    
    const knockoutPairings = generateKnockoutRounds(zonesWRCouples);
    if (knockoutPairings.length === 0) {
      console.log("[createKnockoutStageMatchesAction] No knockout pairings generated. This might mean the tournament winner is determined or not enough qualifiers.");
      return { success: true, message: "No hay más partidos de eliminatoria por generar (e.g., ganador determinado o insuficientes clasificados)." };
    }

    const matchesToInsertData: GenericMatchInsertData[] = knockoutPairings.map((p, idx) => ({ tournament_id: tournamentId, couple1_id: p.couple1.id, couple2_id: p.couple2.id === 'BYE_MARKER' ? null : p.couple2.id, round: p.round, status: p.couple2.id === 'BYE_MARKER' ? 'COMPLETED' : 'NOT_STARTED', order: idx, winner_id: p.couple2.id === 'BYE_MARKER' ? p.couple1.id : null }));
    
    const createdMatches: any[] = [];
    for (const matchData of matchesToInsertData) {
      const result = await _createMatch(supabase, matchData);
      if (result.success && result.match) {
        createdMatches.push(result.match);
        if (matchData.status === 'COMPLETED' && matchData.winner_id) { // BYE match, apply score changes
          await _calculateAndApplyScoreChanges(matchData.winner_id, null, supabase);
        }
      } else {
        return { success: false, error: `Error insertando partidos de eliminatoria: ${result.error}` };
      }
    }
    console.log(`[createKnockoutStageMatchesAction] Creados ${createdMatches.length} partidos de eliminatoria.`);
    return { success: true, message: "Partidos de eliminatoria creados.", matches: createdMatches };
  } catch (e: any) { return { success: false, error: e.message || "Error inesperado en eliminatorias." }; }
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
    const currentRMatches = matchesFromDB.filter(m => m.round === currentRound);
    if (!currentRMatches.every(m => m.status === "COMPLETED")) return { success: false, error: "No todos los partidos de la ronda actual están completados." };

    const winners = currentRMatches.filter(m => m.winner_id).map(m => ({ winnerId: m.winner_id as string})); 
    if (winners.length === 0 && currentRMatches.length > 0) {
        return { success: false, error: "No hay ganadores en la ronda actual para avanzar." };
    }
    
    const nextRMatchesData: GenericMatchInsertData[] = [];
    for (let i = 0; i < winners.length; i += 2) {
      const c1_id = winners[i].winnerId;
      let c2_id: string | null = null;
      let match_status = "NOT_STARTED";
      let match_winner_id: string | null = null;

      if (i + 1 >= winners.length) { // Odd number of winners, last one gets a BYE
        match_status = "COMPLETED"; 
        match_winner_id = c1_id;
      } else {
        c2_id = winners[i+1].winnerId;
      }
      nextRMatchesData.push({ tournament_id: tournamentId, couple1_id: c1_id, couple2_id: c2_id, round: nextRound, status: match_status, order: i/2, winner_id: match_winner_id });
    }

    const createdNextRMatches: any[] = [];
    if (nextRMatchesData.length > 0) {
        for (const matchData of nextRMatchesData) {
          const result = await _createMatch(supabase, matchData);
          if (result.success && result.match) {
            createdNextRMatches.push(result.match);
            if (matchData.status === 'COMPLETED' && matchData.winner_id) { // BYE match, apply score changes
              await _calculateAndApplyScoreChanges(matchData.winner_id, null, supabase);
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