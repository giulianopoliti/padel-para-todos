'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { getPlayerById } from '../players/actions';
import { getUserByDni } from '../users';
import { Zone as GeneratedZone, Couple as GeneratedCouple } from '@/types'; // Assuming your types are here
import { generateZones } from '@/utils/bracket-generator'; // Added import
import { generateKnockoutRounds, KnockoutPairing } from "@/utils/bracket-generator";
import { ZoneWithRankedCouples, CoupleWithStats } from "@/utils/bracket-generator"; // Assuming these are exported or defined in a way actions.ts can access if not in the same file

/**
 * Iniciar un torneo - cambiar su estado a "PAIRING" (fase de emparejamiento)
 */


export async function getTournamentsByUserId(userId: string) {
  const supabase = await createClient();

  // 1. Buscar el club del usuario
  const { data: club, error: clubError } = await supabase
    .from('clubes')
    .select('id, name')
    .eq('user_id', userId)
    .single();

  if (clubError || !club) {
    console.error('[getTournamentsByUserId] Error fetching club:', clubError?.message);
    return [];
  }

  // 2. Buscar los torneos de ese club
  const { data: tournaments, error: tournamentsError } = await supabase
    .from('tournaments')
    .select('*, clubes (id, name)')
    .eq('club_id', club.id);

  if (tournamentsError) {
    console.error('[getTournamentsByUserId] Error fetching tournaments:', tournamentsError.message);
    return [];
  }

  return tournaments;
}
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
  
  // Revalidar rutas para actualizar la UI
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath(`/my-tournaments/${tournamentId}`);
  revalidatePath('/tournaments');
  revalidatePath('/my-tournaments');
  
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

/**
 * Obtener los detalles completos de un torneo y sus inscripciones (jugadores y parejas)
 */
export async function getTournamentDetailsWithInscriptions(tournamentId: string) {
  const supabase = await createClient();
  console.log(`[getTournamentDetailsWithInscriptions] Iniciando para torneo ID: ${tournamentId}`);

  // 1. Obtener detalles del torneo
  const tournament = await getTournamentById(tournamentId);
  if (!tournament) {
    console.log('[getTournamentDetailsWithInscriptions] No se encontró el torneo');
    return { tournament: null, inscriptions: [] };
  }

  try {
    // 2. Obtener todas las inscripciones para este torneo
    const { data: inscriptions, error: inscriptionsError } = await supabase
      .from('inscriptions')
      .select('*')
      .eq('tournament_id', tournamentId);

    if (inscriptionsError) {
      console.error('[getTournamentDetailsWithInscriptions] Error al obtener inscripciones:', inscriptionsError);
      return { tournament, inscriptions: [] };
    }

    console.log(`[getTournamentDetailsWithInscriptions] Encontradas ${inscriptions?.length || 0} inscripciones`);

    // 4. Obtener información de parejas PRIMERO para poder recopilar todos los IDs de jugadores
    const coupleIds = inscriptions
      .filter(insc => insc.couple_id)
      .map(insc => insc.couple_id)
      .filter(Boolean);

    let couples = [];
    if (coupleIds.length > 0) {
      const { data: couplesData, error: couplesError } = await supabase
        .from('couples')
        .select('*')
        .in('id', coupleIds);

      if (couplesError) {
        console.error('[getTournamentDetailsWithInscriptions] Error al obtener parejas:', couplesError);
      } else {
        couples = couplesData || [];
      }
    }

    // 3. Recopilar TODOS los IDs de jugadores, incluyendo tanto player_id como player1_id y player2_id
    const playerIds = [
      ...inscriptions.filter(insc => insc.player_id).map(insc => insc.player_id),
      ...couples.filter(couple => couple.player1_id).map(couple => couple.player1_id),
      ...couples.filter(couple => couple.player2_id).map(couple => couple.player2_id)
    ].filter(Boolean); // Filtrar nulls/undefined
    
    // Eliminar duplicados usando Set
    const uniquePlayerIds = [...new Set(playerIds)];

    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('*')
      .in('id', uniquePlayerIds.length > 0 ? uniquePlayerIds : ['no-players']);

    if (playersError) {
      console.error('[getTournamentDetailsWithInscriptions] Error al obtener jugadores:', playersError);
    }

    // 5. Crear un mapa de jugadores por ID para acceso rápido
    const playersMap = (players || []).reduce((acc, player) => {
      acc[player.id] = player;
      return acc;
    }, {});

    // 6. Procesar la información de parejas para incluir detalles de jugadores
    const couplesWithPlayers = couples.map(couple => {
      const player1 = playersMap[couple.player1_id] || null;
      const player2 = playersMap[couple.player2_id] || null;
      
      return {
        ...couple,
        player1: player1 ? [player1] : [],
        player2: player2 ? [player2] : []
      };
    });

    // 7. Crear un mapa de parejas por ID
    const couplesMap = couplesWithPlayers.reduce((acc, couple) => {
      acc[couple.id] = couple;
      return acc;
    }, {});

    // 8. Construir la respuesta final combinando inscripciones con sus jugadores/parejas
    const processedInscriptions = inscriptions.map(inscription => {
      const result = {
        ...inscription,
        player: inscription.player_id ? [playersMap[inscription.player_id]].filter(Boolean) : [],
        couple: inscription.couple_id ? [couplesMap[inscription.couple_id]].filter(Boolean) : []
      };
      return result;
    });

    console.log(`[getTournamentDetailsWithInscriptions] Proceso completado con ${processedInscriptions.length} inscripciones procesadas`);
    return { tournament, inscriptions: processedInscriptions };
  } catch (error) {
    console.error('[getTournamentDetailsWithInscriptions] Error inesperado:', error);
    return { tournament, inscriptions: [] };
  }
}

export async function registerPlayerForTournament(tournamentId: string, playerId: string) {
  const supabase = await createClient();
  console.log(`[registerPlayerForTournament] Registrando jugador ${playerId} para torneo ${tournamentId}`);
  
  try {
    // Verificar si el jugador ya está inscrito
    const { data: existingInscription, error: checkError } = await supabase
      .from('inscriptions')
      .select('id')
      .eq('tournament_id', tournamentId)
      .eq('player_id', playerId)
      .maybeSingle();
      
    if (checkError) {
      console.error("[registerPlayerForTournament] Error al verificar inscripción existente:", checkError);
    }
    
    if (existingInscription) {
      console.log(`[registerPlayerForTournament] El jugador ${playerId} ya está inscrito en el torneo ${tournamentId}`);
      return { success: false, message: "El jugador ya está inscrito en este torneo" };
    }
    
    // Registrar el jugador
    const { data, error } = await supabase
      .from('inscriptions')
      .insert({ tournament_id: tournamentId, player_id: playerId })
      .select()
      .single();

    if (error) {
      console.error("[registerPlayerForTournament] Error al registrar jugador:", error);
      throw new Error("No se pudo registrar el jugador");
    }
    
    console.log("[registerPlayerForTournament] Jugador registrado exitosamente:", data);
    
    // Revalidar rutas para actualizar la UI
    revalidatePath(`/tournaments/${tournamentId}`);
    revalidatePath(`/my-tournaments/${tournamentId}`);
    revalidatePath('/tournaments');
    revalidatePath('/my-tournaments');
    
    return { success: true, inscription: data };
  } catch (error) {
    console.error("[registerPlayerForTournament] Error inesperado:", error);
    throw error;
  }
}
    
interface ClientZone extends Omit<GeneratedZone, 'id' | 'created_at' | 'couples'> {
  couples: { id: string }[]; // ID here will be couples.id
}

export async function createTournamentZonesAction(
  tournamentId: string,
  zonesToCreate: ClientZone[]
) {
  const supabase = await createClient();
  console.log(`[createTournamentZonesAction] Creating zones for tournament ${tournamentId}`);

  const createdZonesDatabaseInfo = [];

  for (const zone of zonesToCreate) {
    // 1. Create the zone
    const { data: newZoneData, error: zoneError } = await supabase
      .from('zones') // Correct table name
      .insert({
        tournament_id: tournamentId,
        name: zone.name,
        // description: zone.description, // Removed as column does not exist in the table
      })
      .select('id, name')
      .single();

    if (zoneError) {
      console.error(`[createTournamentZonesAction] Error creating zone '${zone.name}':`, zoneError);
      return { success: false, error: `Failed to create zone: ${zone.name}. ${zoneError.message}` };
    }

    console.log(`[createTournamentZonesAction] Created zone: ${newZoneData.name} (ID: ${newZoneData.id})`);
    createdZonesDatabaseInfo.push({ id: newZoneData.id, name: newZoneData.name });

    // 2. Link couples to the newly created zone
    if (zone.couples && zone.couples.length > 0) {
      const zoneCouplesEntries = zone.couples.map(couple => ({
        zone_id: newZoneData.id,
        couple_id: couple.id, // Corrected: This should be couples.id
      }));

      const { error: zoneCouplesError } = await supabase
        .from('zone_couples') // Correct table name for linking
        .insert(zoneCouplesEntries);

      if (zoneCouplesError) {
        console.error(`[createTournamentZonesAction] Error linking couples to zone '${newZoneData.name}':`, zoneCouplesError);
        return { success: false, error: `Failed to link couples to zone: ${newZoneData.name}. ${zoneCouplesError.message}` };
      }
      console.log(`[createTournamentZonesAction] Successfully linked ${zone.couples.length} couples to zone '${newZoneData.name}'.`);
    }
  }

  console.log(`[createTournamentZonesAction] Successfully created ${createdZonesDatabaseInfo.length} zones for tournament ${tournamentId}.`);
  return { success: true, createdZones: createdZonesDatabaseInfo };
}

export async function startTournament2(tournamentId: string) {
  const supabase = await createClient();
  console.log(`[startTournament2] Attempting to start tournament ${tournamentId}, create zones, matches, and set status to IN_PROGRESS.`);

  // 1. Fetch all participating couples for the tournament
  let participatingCouplesForGenerator: GeneratedCouple[] = [];
  try {
    const couplesData = await getCouplesByTournamentId(tournamentId);
    if (!couplesData || couplesData.length === 0) {
      console.warn(`[startTournament2] No participating couples found for tournament ${tournamentId}. Cannot generate zones or matches.`);
      // Proceed to update status, but log that no zones/matches were made.
    } else {
      participatingCouplesForGenerator = couplesData.map(c => ({
        id: c.id, // This is couples.id from 'couples' table
        player_1: c.player1_id,
        player_2: c.player2_id,
      }));
      console.log(`[startTournament2] Found ${participatingCouplesForGenerator.length} couples for zone/match generation.`);
    }
  } catch (error: any) {
    console.error("[startTournament2] Error fetching participating couples:", error);
    return { success: false, error: "Failed to fetch couples for zone/match generation. " + error.message };
  }

  let algorithmicZones: GeneratedZone[] = []; // To store output of generateZones
  let clientZonesToCreate: ClientZone[] = [];  // For createTournamentZonesAction

  if (participatingCouplesForGenerator.length > 0) {
    try {
      algorithmicZones = generateZones(participatingCouplesForGenerator);
      console.log(`[startTournament2] Generated ${algorithmicZones.length} zones structure from algorithm.`);

      if (algorithmicZones.length > 0) {
        clientZonesToCreate = algorithmicZones.map(agZone => ({
          name: agZone.name,
          // description is optional in GeneratedZone and not used by createTournamentZonesAction currently
          couples: agZone.couples.map(c => ({ id: c.id })), // Pass only couple IDs
        }));
      } else {
        console.log("[startTournament2] generateZones algorithm returned no zones.");
      }
    } catch (error: any) {
      console.error("[startTournament2] Error during zone generation algorithm:", error);
      return { success: false, error: "Failed to generate zones: " + error.message };
    }
  }

  let savedZonesWithCouplesForMatchCreation: { id: string; name: string; couples: GeneratedCouple[] }[] = [];

  if (clientZonesToCreate.length > 0) {
    const zoneCreationResult = await createTournamentZonesAction(tournamentId, clientZonesToCreate);
    if (!zoneCreationResult.success || !zoneCreationResult.createdZones) {
      console.error("[startTournament2] Failed to create tournament zones in DB:", zoneCreationResult.error);
      return { success: false, error: "Failed to save tournament zones. " + zoneCreationResult.error };
    }
    console.log("[startTournament2] Successfully created tournament zones in DB:", zoneCreationResult.createdZones);

    // Prepare data for match creation: combine DB zone IDs with original couple lists
    savedZonesWithCouplesForMatchCreation = zoneCreationResult.createdZones.map(dbZone => {
      const originalAlgoZone = algorithmicZones.find(agZone => agZone.name === dbZone.name);
      if (!originalAlgoZone) {
        // This should not happen if names are consistent and unique from generateZones
        console.error(`[startTournament2] CRITICAL: Could not find original algorithmic zone for DB zone ${dbZone.name}`);
        return null; // Or throw error
      }
      return {
        id: dbZone.id, // DB ID of the zone
        name: dbZone.name,
        couples: originalAlgoZone.couples, // Full couple objects from algorithmicZones
      };
    }).filter(Boolean) as { id: string; name: string; couples: GeneratedCouple[] }[]; // Filter out nulls if any

  } else if (participatingCouplesForGenerator.length > 0) {
    console.log("[startTournament2] No zones were mapped to create in DB.");
  }

  // Create matches for the saved zones
  if (savedZonesWithCouplesForMatchCreation.length > 0) {
    const matchCreationResult = await createTournamentZoneMatchesAction(tournamentId, savedZonesWithCouplesForMatchCreation);
    if (!matchCreationResult.success) {
      console.error("[startTournament2] Failed to create zone matches:", matchCreationResult.error);
      // Decide on error handling: roll back zones? or just report error?
      return { success: false, error: "Failed to create matches for zones. " + matchCreationResult.error };
    }
    console.log("[startTournament2] Successfully created zone matches.");
  } else if (algorithmicZones.length > 0) {
      console.warn("[startTournament2] Zones were algorithmically generated but not saved or processed for match creation. This might indicate an issue in mapping DB zone IDs back.");
  }

  // Update the tournament status to "IN_PROGRESS"
  console.log(`[startTournament2] Proceeding to update tournament ${tournamentId} status to IN_PROGRESS.`);
  const { data: updatedTournament, error: statusUpdateError } = await supabase
    .from('tournaments')
    .update({ status: 'IN_PROGRESS' })
    .eq('id', tournamentId)
    .select()
    .single();

  if (statusUpdateError) {
    console.error("[startTournament2] Error updating tournament status:", statusUpdateError);
    return { success: false, error: "Failed to update tournament status. " + statusUpdateError.message };
  }

  console.log("[startTournament2] Tournament status updated to IN_PROGRESS. Process complete.", updatedTournament);

  revalidatePath(`/my-tournaments/${tournamentId}`);
  revalidatePath('/my-tournaments');
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath('/tournaments');

  return { success: true, tournament: updatedTournament };
}



//------------ZONAS--------------

// Función para obtener las zonas de un torneo con sus parejas
export async function fetchTournamentZones(tournamentId: string) {
  const supabase = await createClient()

  try {
    // 1. Obtener todas las zonas del torneo
    const { data: zones, error: zonesError } = await supabase
      .from("zones")
      .select("*")
      .eq("tournament_id", tournamentId)
      .order("name")

    if (zonesError) {
      console.error("Error al obtener zonas:", zonesError)
      return { success: false, error: "Error al obtener zonas" }
    }

    // 2. Para cada zona, obtener las parejas asociadas
    const zonesWithCouples = await Promise.all(
      zones.map(async (zone) => {
        // Obtener las relaciones zona-pareja
        const { data: coupleLinks, error: coupleLinksError } = await supabase
          .from("zone_couples") // Corrected table name
          .select("couple_id")
          .eq("zone_id", zone.id)

        if (coupleLinksError) {
          console.error("Error al obtener relaciones zona-pareja:", coupleLinksError)
          return { ...zone, couples: [] } // Return zone with empty couples on error
        }

        // Obtener los detalles de cada pareja
        const coupleIds = coupleLinks.map((cl) => cl.couple_id)

        if (coupleIds.length === 0) {
          return { ...zone, couples: [] }
        }

        const { data: couples, error: couplesError } = await supabase
          .from("couples")
          .select(`
            *,
            player1:players!couples_player1_id_fkey (id, first_name, last_name, score),
            player2:players!couples_player2_id_fkey (id, first_name, last_name, score)
          `)
          .in("id", coupleIds)

        if (couplesError) {
          console.error("Error al obtener parejas:", couplesError)
          return { ...zone, couples: [] } // Return zone with empty couples on error
        }

        // 3. Calcular estadísticas para cada pareja en esta zona
        const couplesWithStats = await Promise.all(
          couples.map(async (couple) => {
            // Obtener partidos de esta pareja en esta zona
            const { data: matches, error: matchesError } = await supabase
              .from("matches")
              .select("*")
              .eq("zone_id", zone.id)
              .or(`couple1_id.eq.${couple.id},couple2_id.eq.${couple.id}`)
              .eq("status", "COMPLETED")

            if (matchesError) {
              console.error("Error al obtener partidos:", matchesError)
              return {
                ...couple,
                player1_name: couple.player1?.first_name + " " + couple.player1?.last_name,
                player2_name: couple.player2?.first_name + " " + couple.player2?.last_name,
                stats: { played: 0, won: 0, lost: 0, scored: 0, conceded: 0, points: 0 },
              }
            }

            // Calcular estadísticas
            let played = 0
            let won = 0
            let lost = 0
            let scored = 0
            let conceded = 0

            matches.forEach((match) => {
              played++

              if (match.couple1_id === couple.id) {
                scored += match.score_couple1 || 0
                conceded += match.score_couple2 || 0
                if (match.winner_id === couple.id) won++
                else lost++
              } else {
                scored += match.score_couple2 || 0
                conceded += match.score_couple1 || 0
                if (match.winner_id === couple.id) won++
                else lost++
              }
            })

            // Calcular puntos (2 por victoria, 0 por derrota)
            const points = won * 2

            return {
              ...couple,
              player1_name: couple.player1?.first_name + " " + couple.player1?.last_name,
              player2_name: couple.player2?.first_name + " " + couple.player2?.last_name,
              stats: { played, won, lost, scored, conceded, points },
            }
          }),
        )

        // Ordenar parejas por puntos (de mayor a menor)
        const sortedCouples = couplesWithStats.sort((a, b) => {
          // Primero por puntos
          if (b.stats.points !== a.stats.points) {
            return b.stats.points - a.stats.points
          }
          // Luego por diferencia de sets
          const diffA = a.stats.scored - a.stats.conceded
          const diffB = b.stats.scored - b.stats.conceded
          if (diffB !== diffA) {
            return diffB - diffA
          }
          // Finalmente por sets a favor
          return b.stats.scored - a.stats.scored
        })

        return { ...zone, couples: sortedCouples }
      }),
    )

    return { success: true, zones: zonesWithCouples }
  } catch (error) {
    console.error("Error al obtener zonas con parejas:", error)
    return { success: false, error: "Error inesperado al obtener zonas" }
  }
}


// ------------PARTIDOS--------------

// Función para obtener los partidos de un torneo
export async function fetchTournamentMatches(tournamentId: string) {
  const supabase = await createClient()

  try {
    // Obtener todos los partidos del torneo
    const { data: matches, error: matchesError } = await supabase
      .from("matches")
      .select(`
        *,
        zone_info:zone_id (name),
        couple1:couples!matches_couple1_id_fkey(
          id, player1_id, player2_id,
          player1_details:players!couples_player1_id_fkey(id, first_name, last_name),
          player2_details:players!couples_player2_id_fkey(id, first_name, last_name)
        ),
        couple2:couples!matches_couple2_id_fkey(
          id, player1_id, player2_id,
          player1_details:players!couples_player1_id_fkey(id, first_name, last_name),
          player2_details:players!couples_player2_id_fkey(id, first_name, last_name)
        )
      `)
      .eq("tournament_id", tournamentId)
      .order("created_at")

    if (matchesError) {
      console.error("Error al obtener partidos:", matchesError)
      return { success: false, error: "Error al obtener partidos" }
    }

    // Procesar los datos para un formato más fácil de usar
    const processedMatches = matches.map((match) => ({
      ...match,
      zone_name: match.zone_info?.name,
      couple1_player1_name:
        match.couple1?.player1_details?.first_name + " " + match.couple1?.player1_details?.last_name,
      couple1_player2_name:
        match.couple1?.player2_details?.first_name + " " + match.couple1?.player2_details?.last_name,
      couple2_player1_name:
        match.couple2?.player1_details?.first_name + " " + match.couple2?.player1_details?.last_name,
      couple2_player2_name:
        match.couple2?.player2_details?.first_name + " " + match.couple2?.player2_details?.last_name,
    }))

    return { success: true, matches: processedMatches }
  } catch (error) {
    console.error("Error al obtener partidos:", error)
    return { success: false, error: "Error inesperado al obtener partidos" }
  }
}

// Interfaz para actualizar el resultado de un partido
interface UpdateMatchResultParams {
  matchId: string
  result_couple1: string // Assuming textual result like "6-3, 6-4"
  result_couple2: string // Assuming textual result
  winner_id: string
}

// Función para actualizar el resultado de un partido
export async function updateMatchResult({ matchId, result_couple1, result_couple2, winner_id }: UpdateMatchResultParams) {
  const supabase = await createClient()

  try {
    // Actualizar el partido con el resultado
    const { error: updateError } = await supabase
      .from("matches")
      .update({
        result_couple1: result_couple1, // Corrected column name
        result_couple2: result_couple2, // Corrected column name
        winner_id: winner_id,
        status: "COMPLETED",
      })
      .eq("id", matchId)

    if (updateError) {
      console.error("Error al actualizar partido:", updateError)
      return { success: false, error: "Error al actualizar el resultado" }
    }

    // Obtener información del partido para revalidar la ruta correcta
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("tournament_id")
      .eq("id", matchId)
      .single()

    if (matchError) {
      console.error("Error al obtener información del partido:", matchError)
      // Continuamos aunque haya error, ya que el resultado se guardó correctamente
    } else if (match) {
      // Revalidar la ruta del torneo para actualizar la UI
      revalidatePath(`/my-tournaments/${match.tournament_id}`)
    }

    return { success: true }
  } catch (error) {
    console.error("Error al actualizar resultado:", error)
    return { success: false, error: "Error inesperado al actualizar el resultado" }
  }
}

interface MatchToInsert {
  tournament_id: string;
  zone_id: string;
  couple1_id: string;
  couple2_id: string;
  status: string;
  round?: string; // Optional round information
}

function generateMatchesForZoneLogic(zone: { id: string; couples: GeneratedCouple[] }, tournamentId: string): MatchToInsert[] {
  const matchesToInsert: MatchToInsert[] = [];
  const couplesInZone = zone.couples;
  const numCouples = couplesInZone.length;

  if (numCouples === 4) {
    const c = couplesInZone;
    // Round 1 type pairings
    matchesToInsert.push({ tournament_id: tournamentId, zone_id: zone.id, couple1_id: c[0].id, couple2_id: c[3].id, status: 'PENDING', round: 'ZONE' });
    matchesToInsert.push({ tournament_id: tournamentId, zone_id: zone.id, couple1_id: c[1].id, couple2_id: c[2].id, status: 'PENDING', round: 'ZONE' });
    // Round 2 type pairings
    matchesToInsert.push({ tournament_id: tournamentId, zone_id: zone.id, couple1_id: c[0].id, couple2_id: c[2].id, status: 'PENDING', round: 'ZONE' });
    matchesToInsert.push({ tournament_id: tournamentId, zone_id: zone.id, couple1_id: c[1].id, couple2_id: c[3].id, status: 'PENDING', round: 'ZONE' });
  } else if (numCouples === 3) {
    const c = couplesInZone;
    matchesToInsert.push({ tournament_id: tournamentId, zone_id: zone.id, couple1_id: c[0].id, couple2_id: c[1].id, status: 'PENDING', round: 'ZONE' });
    matchesToInsert.push({ tournament_id: tournamentId, zone_id: zone.id, couple1_id: c[0].id, couple2_id: c[2].id, status: 'PENDING', round: 'ZONE' });
    matchesToInsert.push({ tournament_id: tournamentId, zone_id: zone.id, couple1_id: c[1].id, couple2_id: c[2].id, status: 'PENDING', round: 'ZONE' });
  }
  // Add more conditions here for other numbers of couples per zone if needed (e.g., 5, 6)
  // For N=6, with 2 matches per couple, total 6 matches. Example pairings:
  // (C1vC2, C3vC4, C5vC6) and then another set of 3 non-overlapping matches.
  // Or specific defined pairings.

  return matchesToInsert;
}

export async function createTournamentZoneMatchesAction(
  tournamentId: string,
  zones: { id: string; name: string; couples: GeneratedCouple[] }[] // Expects zones with their DB IDs and assigned couples
) {
  const supabase = await createClient();
  let allMatchesToInsert: MatchToInsert[] = [];

  console.log(`[createTournamentZoneMatchesAction] Generating matches for ${zones.length} zones in tournament ${tournamentId}`);

  for (const zone of zones) {
    const matchesForThisZone = generateMatchesForZoneLogic(zone, tournamentId);
    allMatchesToInsert = allMatchesToInsert.concat(matchesForThisZone);
    console.log(`[createTournamentZoneMatchesAction] Generated ${matchesForThisZone.length} matches for zone ${zone.name} (ID: ${zone.id})`);
  }

  if (allMatchesToInsert.length > 0) {
    const { data, error } = await supabase.from('matches').insert(allMatchesToInsert).select();
    if (error) {
      console.error('[createTournamentZoneMatchesAction] Error inserting matches:', error);
      return { success: false, error: `Failed to insert matches: ${error.message}` };
    }
    console.log(`[createTournamentZoneMatchesAction] Successfully inserted ${data?.length || 0} matches.`);
    return { success: true, matches: data };
  } else {
    console.log('[createTournamentZoneMatchesAction] No matches were generated to insert.');
    return { success: true, matches: [] };
  }
}

export async function createKnockoutStageMatchesAction(tournamentId: string) {
  console.log(`[createKnockoutStageMatchesAction] Starting for tournament ${tournamentId}`);
  const supabase = await createClient();

  try {
    // 1. Fetch tournament details, including category_name and type from tournaments table
    const { data: tournamentData, error: tournamentError } = await supabase
      .from('tournaments')
      .select('id, category_name, type, status, clubes(id, name)') // Reinstated category_name, ensured no category_id
      .eq('id', tournamentId)
      .single();

    if (tournamentError || !tournamentData) {
      console.error("[createKnockoutStageMatchesAction] Error fetching tournament:", tournamentError);
      return { success: false, error: "Error fetching tournament details." };
    }

    // Prevent re-generation if already past group stage or in knockout
    // This check might need to be more robust based on your exact status flow
    if (tournamentData.status !== 'IN_PROGRESS' && tournamentData.status !== 'ZONE_COMPLETED') { // Assuming ZONE_COMPLETED is a status after zones
        console.warn(`[createKnockoutStageMatchesAction] Tournament ${tournamentId} is not in a state to start knockout. Status: ${tournamentData.status}`);
        return { success: false, error: `Tournament is not in a valid state to start knockout rounds (current status: ${tournamentData.status}).` };
    }

    // 2. Fetch zones with couples and their stats (points are crucial for ranking)
    const zonesResult = await fetchTournamentZones(tournamentId); // This function already calculates stats
    if (!zonesResult.success || !zonesResult.zones) {
      console.error("[createKnockoutStageMatchesAction] Error fetching zones with stats:", zonesResult.error);
      return { success: false, error: zonesResult.error || "Could not fetch zone data for ranking." };
    }

    // Map to ZoneWithRankedCouples[] which expects CoupleWithStats[]
    // Ensure the Couple objects from fetchTournamentZones have the .stats.points structure
    const zonesWithRankedCouples: ZoneWithRankedCouples[] = zonesResult.zones.map(zone => ({
      ...zone, // id, name, created_at from original Zone
      couples: zone.couples.map((c: any) => ({
        id: c.id,
        player_1: c.player1_id, // Map to player_1, player_2 as per Couple type
        player_2: c.player2_id,
        stats: { points: c.stats?.points || 0 }, // Ensure stats.points is present
        // Add other properties from Couple type if they exist on 'c' and are needed by generateKnockoutRounds
      })) as CoupleWithStats[],
    }));

    if (zonesWithRankedCouples.length === 0) {
        console.warn("[createKnockoutStageMatchesAction] No zones found or no couples in zones for tournament", tournamentId);
        return { success: false, error: "No zone or couple data available to generate knockout stage." };
    }
    
    // 3. Generate knockout pairings
    const knockoutPairings = generateKnockoutRounds(zonesWithRankedCouples);
    console.log("[createKnockoutStageMatchesAction] Generated knockout pairings:", knockoutPairings.length);

    if (knockoutPairings.length === 0) {
      // This might happen if only 1 couple qualifies, or no couples.
      // Decide how to handle this - perhaps the tournament ends, or a winner is declared.
      console.warn("[createKnockoutStageMatchesAction] No knockout pairings generated. Tournament might end or need manual intervention.");
      // Optionally update tournament status to FINISHED if this means winner is decided
      // For now, just return success as pairings generation itself didn't fail.
      // await supabase.from('tournaments').update({ status: 'FINISHED' }).eq('id', tournamentId);
      return { success: true, message: "No further matches to generate (e.g., winner decided)." };
    }

    // 4. Prepare matches for DB insertion
    const matchesToInsert = knockoutPairings.map(pairing => ({
      tournament_id: tournamentId,
      // category_name is not in the matches table
      couple1_id: pairing.couple1.id,
      couple2_id: pairing.couple2.id === 'BYE_MARKER' ? null : pairing.couple2.id,
      round: pairing.round, 
      status: 'NOT_STARTED',
      // type: 'ELIMINATION', // Removed type as it's not in the matches table schema
      // zone_id: null, 
    }));

    console.log("[createKnockoutStageMatchesAction] Matches to insert:", matchesToInsert);

    // 5. Insert new matches
    const { error: insertError } = await supabase.from('matches').insert(matchesToInsert);

    if (insertError) {
      console.error("[createKnockoutStageMatchesAction] Error inserting knockout matches:", insertError);
      return { success: false, error: `Failed to insert knockout matches: ${insertError.message}` };
    }

    // 6. Optionally, update tournament status to indicate knockout phase
    // Define a new status like 'KNOCKOUTS' or 'FINALS' in your tournament status enum
    // const { error: statusUpdateError } = await supabase
    //   .from('tournaments')
    //   .update({ status: 'KNOCKOUT_IN_PROGRESS' }) // Replace with your actual status
    //   .eq('id', tournamentId);

    // if (statusUpdateError) {
    //   console.warn("[createKnockoutStageMatchesAction] Failed to update tournament status after creating knockout matches:", statusUpdateError);
    //   // Non-critical error, so we might still return success for match creation
    // }

    console.log("[createKnockoutStageMatchesAction] Successfully created knockout matches for tournament", tournamentId);
    return { success: true, message: "Knockout stage matches created successfully." };

  } catch (error: any) {
    console.error("[createKnockoutStageMatchesAction] Unexpected error:", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}
