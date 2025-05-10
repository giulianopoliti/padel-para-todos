'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getPlayerById } from '../players/actions';
import { getUserByDni } from '../users';
/**
 * Iniciar un torneo - cambiar su estado a "PAIRING" (fase de emparejamiento)
 */
export async function startTournament(tournamentId: string) {
  const supabase = await createClient();
  console.log(`[startTournament] Iniciando torneo ${tournamentId} (fase de emparejamiento)`);
  
  // Actualizar el estado del torneo
  const { data, error } = await supabase
    .from('tournaments')
    .update({ status: 'PAIRING' })
    .eq('id', tournamentId)
    .select()
    .single();
    
  if (error) {
    console.error("[startTournament] Error al iniciar torneo:", error);
    throw new Error("No se pudo iniciar el torneo");
  }
  
  console.log("[startTournament] Torneo iniciado exitosamente (fase de emparejamiento):", data);
  
  // Revalidar rutas
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath('/tournaments');
  
  return { success: true, tournament: data };
}

/**
 * Iniciar los partidos de un torneo - cambiar su estado a "IN_PROGRESS"
 * Se llama después de que los emparejamientos estén completos
 */
export async function startMatches(tournamentId: string) {
  const supabase = await createClient();
  console.log(`[startMatches] Iniciando partidos del torneo ${tournamentId}`);
  
  // Actualizar el estado del torneo
  const { data, error } = await supabase
    .from('tournaments')
    .update({ status: 'IN_PROGRESS' })
    .eq('id', tournamentId)
    .select()
    .single();
    
  if (error) {
    console.error("[startMatches] Error al iniciar partidos:", error);
    throw new Error("No se pudieron iniciar los partidos del torneo");
  }
  
  console.log("[startMatches] Partidos iniciados exitosamente:", data);
  
  // Revalidar rutas
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath('/tournaments');
  
  return { success: true, tournament: data };
}

/**
 * Finalizar un torneo - cambiar su estado a "COMPLETED"
 */
export async function completeTournament(tournamentId: string) {
  const supabase = await createClient();
  console.log(`[completeTournament] Finalizando torneo ${tournamentId}`);
  
  // Actualizar el estado del torneo
  const { data, error } = await supabase
    .from('tournaments')
    .update({ status: 'COMPLETED' })
    .eq('id', tournamentId)
    .select()
    .single();
    
  if (error) {
    console.error("[completeTournament] Error al finalizar torneo:", error);
    throw new Error("No se pudo finalizar el torneo");
  }
  
  console.log("[completeTournament] Torneo finalizado exitosamente:", data);
  
  // Revalidar rutas
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath('/tournaments');
  
  return { success: true, tournament: data };
}

/**
 * Obtener los detalles completos de un torneo por su ID, incluyendo datos relacionados.
 */
export async function getTournamentById(tournamentId: string) {
  if (!tournamentId) {
    console.warn("[getTournamentById] No tournamentId provided");
    return null;
  }
  const supabase = await createClient();
  const { data: tournament, error } = await supabase
    .from('tournaments')
    .select(`
      *,
      clubes ( id, name ),
      categories ( name )
    `)
    .eq('id', tournamentId)
    .single();

  if (error) {
    console.error(`[getTournamentById] Error fetching tournament details for ID ${tournamentId}:`, error.message);
    return null;
  }
  // Realiza un cast explícito si estás seguro de la estructura o define un tipo más preciso
  return tournament as any; // Considera definir un tipo como TournamentWithDetails del @public/page
} 

export async function getMatchesByTournamentId(tournamentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('tournament_id', tournamentId);
    if (error) throw error;
    return data;
}


export async function getInscriptionsByTournamentId(tournamentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('inscriptions')
    .select('*')
    .eq('tournament_id', tournamentId);

  if (error) throw error;
  return data;
}

export async function getPlayersByTournamentId(tournamentId: string) {
  if (!tournamentId) {
    console.warn("[getPlayersByTournamentId] No tournamentId provided");
    return [];
  }
  const supabase = await createClient();

  // 1. Obtener los player_id de la tabla inscriptions para el torneo dado
  //    Asegúrate de que solo tomas inscripciones individuales (donde couple_id es NULL)
  const { data: inscriptions, error: inscriptionsError } = await supabase
    .from('inscriptions')
    .select('player_id')
    .eq('tournament_id', tournamentId)
    .is('couple_id', null); // Solo jugadores individuales inscritos

  if (inscriptionsError) {
    console.error(`[getPlayersByTournamentId] Error fetching inscriptions for tournament ${tournamentId}:`, inscriptionsError.message);
    throw inscriptionsError;
  }

  if (!inscriptions || inscriptions.length === 0) {
    return []; 
  }

  const playerIds = inscriptions
    .map(inscription => inscription.player_id)
    .filter(id => id !== null) as string[];
    
  if (playerIds.length === 0) {
    return [];
  }

  // 2. Obtener los detalles de esos jugadores
  const { data: players, error: playersError } = await supabase
    .from('players')
    .select('id, first_name, last_name, score') // Added score
    .in('id', playerIds);

  if (playersError) {
    console.error(`[getPlayersByTournamentId] Error fetching player details for tournament ${tournamentId}:`, playersError.message);
    throw playersError;
  }
  return players || [];
}


export async function registerNewPlayerForTournament(tournamentId: string, firstName: string, lastName: string, phone: string, dni: string) {
  const supabase = await createClient();

  console.log(`[registerNewPlayerForTournament] Attempting to register player for tournamentId: ${tournamentId}`);
  console.log(`[registerNewPlayerForTournament] Player details received - DNI: ${dni}, Name: ${firstName} ${lastName}, Phone: ${phone}`);

  // Validate tournamentId
  if (!tournamentId || typeof tournamentId !== 'string' || tournamentId.length < 36) { // Basic UUID length check
    console.error("[registerNewPlayerForTournament] Invalid or missing tournamentId:", tournamentId);
    throw new Error("ID de torneo inválido o faltante.");
  }

  // Get player by DNI
  const existingPlayerData = await getUserByDni(dni);
  console.log("[registerNewPlayerForTournament] Result from getUserByDni:", existingPlayerData);

  let playerId: string | null = null;

  if (existingPlayerData && existingPlayerData.length > 0 && existingPlayerData[0].id) {
    playerId = existingPlayerData[0].id;
    console.log(`[registerNewPlayerForTournament] Found existing player with ID: ${playerId}`);
    // Here you might want to check if this existing player's first/last name matches,
    // or if they need an update, or if it's an error if details mismatch.
    // For now, we'll assume if DNI matches, it's the correct player.
  } else {
    // Player not found by DNI, so we need to create them.
    // Note: The original function didn't create a player, it just errored if DNI lookup failed to provide an ID.
    // This logic needs to be aligned with how your application should behave.
    // For now, to match the error scenario but with better diagnostics:
    console.error(`[registerNewPlayerForTournament] Player with DNI ${dni} not found or does not have an ID.`);
    // If you intend to create the player here, you'd call a player creation function.
    // e.g., const newPlayer = await createPlayer({ dni, firstName, lastName, phone, ...other necessary fields... });
    // playerId = newPlayer.id;
    // For now, we will throw an error as player creation logic is not in this function.
    throw new Error(`Jugador con DNI ${dni} no encontrado. No se puede inscribir sin un ID de jugador válido.`);
  }

  // Validate playerId after attempting to fetch/create
  if (!playerId || typeof playerId !== 'string' || playerId.length < 36) { // Basic UUID length check
    console.error("[registerNewPlayerForTournament] Invalid or missing playerId after DNI lookup/creation attempt:", playerId);
    throw new Error("ID de jugador inválido o faltante para la inscripción.");
  }

  // Prepare data for insertion
  const inscriptionData = {
    tournament_id: tournamentId,
    player_id: playerId,
    // couple_id will be null by default if not provided, which is fine as it's nullable.
  };

  console.log("[registerNewPlayerForTournament] Attempting to insert into 'inscriptions':", inscriptionData);

  const { data, error } = await supabase
    .from('inscriptions')
    .insert(inscriptionData)
    .select()
    .single(); // Assuming you expect one row back

  if (error) {
    console.error("[registerNewPlayerForTournament] Error al registrar jugador en 'inscriptions':", error);
    console.error("[registerNewPlayerForTournament] Supabase error details - Message:", error.message, "Details:", error.details, "Hint:", error.hint, "Code:", error.code);
    throw new Error(`No se pudo registrar el jugador: ${error.message}`);
  }

  console.log("[registerNewPlayerForTournament] Jugador registrado exitosamente. Inscription data:", data);
  return { success: true, inscription: data };
}

export async function registerCoupleForTournament(tournamentId: string, player1Id: string, player2Id: string) {
  const supabase = await createClient();
  let coupleIdToInsert = null;
  const {data: coupleData1, error: coupleError1} = await supabase
    .from('couples')
    .select('id')
    .eq('player1_id', player1Id)
    .eq('player2_id', player2Id)
    .single();
    const {data: coupleData2, error: coupleError2} = await supabase
    .from('couples')
    .select('id')
    .eq('player1_id', player2Id)
    .eq('player2_id', player1Id)
    .single();
    console.log("[registerCoupleForTournament] Jugador 1:", player1Id);
    console.log("[registerCoupleForTournament] Jugador 2:", player2Id);
    console.log("[registerCoupleForTournament] coupleError1:", coupleError1);
    console.log("[registerCoupleForTournament] coupleError2:", coupleError2);
    if (coupleError1?.details !== null && coupleError2?.details !== null) {
      const {data: coupleData, error: coupleError} = await supabase
        .from('couples')
        .insert({ player1_id: player1Id, player2_id: player2Id })
        .select('id')
        .single();
        coupleIdToInsert = coupleData?.id;
    }
    else if (coupleError1 !== null && coupleError2 === null) {
      coupleIdToInsert = coupleData2?.id;
    }
    else if (coupleError1 === null && coupleError2 !== null) {
      coupleIdToInsert = coupleData1?.id;
    }
    else {
      throw new Error("No se pudo registrar la pareja");
    }
    const { data, error } = await supabase
    .from('inscriptions')
    .insert({ tournament_id: tournamentId, couple_id: coupleIdToInsert, player_id: player1Id})
    .select('id')
    .single();
    console.log("[registerCoupleForTournament] Jugador registrado exitosamente. Inscription data:", data);
  

  if (error) {
    console.error("[registerCoupleForTournament] Error al registrar jugador:", error);
    throw new Error("No se pudo registrar el jugador");
  }
  return { success: true, inscription: data };
}

export async function getCouplesByTournamentId(tournamentId: string): Promise<any[]> {
  const supabase = await createClient();

  // 1. Get distinct couple_ids from inscriptions for the tournament
  const { data: inscriptionCouples, error: inscriptionsError } = await supabase
    .from('inscriptions')
    .select('couple_id')
    .eq('tournament_id', tournamentId)
    .not('couple_id', 'is', null); // Ensure we only get entries that are for couples

  if (inscriptionsError) {
    console.error(`[getCouplesByTournamentId] Error fetching inscriptions for tournament ${tournamentId}:`, inscriptionsError.message);
    throw inscriptionsError;
  }

  if (!inscriptionCouples || inscriptionCouples.length === 0) {
    return []; // No couples inscribed in this tournament
  }

  const coupleIds = inscriptionCouples
    .map(ins => ins.couple_id)
    .filter(id => id !== null) as string[]; // Extract non-null couple_ids

  if (coupleIds.length === 0) {
    return []; // Should not happen if .not('couple_id', 'is', null) worked, but good for safety
  }

  // 2. Get details for these couples from the 'couples' table
  const { data: couples, error: couplesError } = await supabase
    .from('couples') // Your actual couples table name
    .select('*')     // Fetches all columns from the couples table (id, player1_id, player2_id, etc.)
    .in('id', coupleIds);

  if (couplesError) {
    console.error(`[getCouplesByTournamentId] Error fetching couple details:`, couplesError.message);
    throw couplesError;
  }

  return couples || [];
}

/**
 * Registers an authenticated player for a tournament as a solo participant.
 */
export async function registerAuthenticatedPlayerForTournament(
  tournamentId: string
): Promise<{ success: boolean; message: string; inscriptionId?: string }> {
  const supabase = await createClient();

  console.log(`[registerAuthenticatedPlayerForTournament] Attempting for tournamentId: ${tournamentId}`);

  // 1. Get current authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.error("[registerAuthenticatedPlayerForTournament] Authentication error:", authError.message);
    return { success: false, message: "Error de autenticación. Por favor, inténtalo de nuevo." };
  }
  if (!user) {
    console.warn("[registerAuthenticatedPlayerForTournament] No authenticated user found.");
    return { success: false, message: "Debes iniciar sesión para inscribirte." };
  }
  console.log(`[registerAuthenticatedPlayerForTournament] Authenticated user ID: ${user.id}`);

  // 2. Find the Player ID associated with the authenticated user's auth_id
  // Assuming 'players' table has a 'user_id' column that links to 'auth.users.id'
  let playerId: string | null = null;
  try {
    const { data: playerData, error: playerError } = await supabase
      .from('players')
      .select('id') // Select only the player's primary key
      .eq('user_id', user.id) // Match based on the auth user ID link
      .single(); // Expecting one player profile per user

    if (playerError) {
      if (playerError.code === 'PGRST116') { // "Resource not found" - No player profile for this user
        console.warn(`[registerAuthenticatedPlayerForTournament] No player profile found for user ID: ${user.id}`);
        return { success: false, message: "No se encontró un perfil de jugador asociado a tu cuenta. Por favor, completa tu perfil." };
      }
      console.error("[registerAuthenticatedPlayerForTournament] Error fetching player profile:", playerError.message);
      return { success: false, message: `Error al buscar tu perfil de jugador: ${playerError.message}` };
    }
    
    if (!playerData || !playerData.id) {
      console.warn(`[registerAuthenticatedPlayerForTournament] Player data or ID is missing for user ID: ${user.id}`);
      return { success: false, message: "No se encontró un ID de jugador en tu perfil." };
    }
    playerId = playerData.id;
    console.log(`[registerAuthenticatedPlayerForTournament] Found Player ID: ${playerId} for User ID: ${user.id}`);

  } catch (error: any) {
    console.error("[registerAuthenticatedPlayerForTournament] Unexpected error fetching player profile:", error.message);
    return { success: false, message: `Error inesperado al buscar tu perfil: ${error.message}` };
  }

  if (!playerId) {
    // This case should ideally be caught by the checks above.
    return { success: false, message: "No se pudo determinar tu ID de jugador." };
  }

  // 3. Check if the player is already inscribed in this tournament (either solo or as part of a couple)
  try {
    const { data: existingInscription, error: checkError } = await supabase
      .from('inscriptions')
      .select('id, couple_id')
      .eq('tournament_id', tournamentId)
      .eq('player_id', playerId) // Check if this player_id is in any inscription for this tournament
      .maybeSingle();

    if (checkError) {
      console.error("[registerAuthenticatedPlayerForTournament] Error checking existing inscription:", checkError.message);
      return { success: false, message: `Error al verificar inscripción: ${checkError.message}` };
    }

    if (existingInscription) {
      if (existingInscription.couple_id) {
        console.log(`[registerAuthenticatedPlayerForTournament] Player ${playerId} already registered as part of a couple for tournament ${tournamentId}.`);
        return { success: false, message: "Ya estás inscrito en este torneo como parte de una pareja." };
      } else {
        console.log(`[registerAuthenticatedPlayerForTournament] Player ${playerId} already registered solo for tournament ${tournamentId}.`);
        return { success: false, message: "Ya estás inscrito en este torneo." };
      }
    }
  } catch (error: any) {
    console.error("[registerAuthenticatedPlayerForTournament] Unexpected error checking existing inscription:", error.message);
    return { success: false, message: `Error inesperado al verificar tu inscripción: ${error.message}` };
  }
  
  // 4. Insert the solo inscription
  try {
    const inscriptionPayload = {
      player_id: playerId,
      tournament_id: tournamentId,
      couple_id: null, // Explicitly null for solo inscription
      created_at: new Date().toISOString() 
    };

    console.log("[registerAuthenticatedPlayerForTournament] Inserting inscription:", inscriptionPayload);

    const { data: newInscription, error: insertError } = await supabase
      .from('inscriptions')
      .insert(inscriptionPayload)
      .select('id')
      .single();

    if (insertError) {
      console.error("[registerAuthenticatedPlayerForTournament] Error inserting inscription:", insertError.message, insertError.details);
      return { success: false, message: `Error al inscribirte: ${insertError.message}` };
    }
    
    if (!newInscription || !newInscription.id) {
      console.error("[registerAuthenticatedPlayerForTournament] Insert succeeded but no inscription ID returned.");
      return { success: false, message: "Error al inscribirte: No se recibió confirmación de la inscripción." };
    }

    console.log(`[registerAuthenticatedPlayerForTournament] Player ${playerId} successfully registered solo for tournament ${tournamentId}. Inscription ID: ${newInscription.id}`);
    
    // Revalidate paths to reflect the new inscription
    revalidatePath(`/tournaments/${tournamentId}`);
    revalidatePath('/tournaments'); // Or any other relevant general tournament list page

    return { 
      success: true, 
      message: "¡Inscripción exitosa!", 
      inscriptionId: newInscription.id 
    };

  } catch (error: any) {
    console.error("[registerAuthenticatedPlayerForTournament] Unexpected error inserting inscription:", error.message);
    return { success: false, message: `Error inesperado al realizar la inscripción: ${error.message}` };
  }
}



