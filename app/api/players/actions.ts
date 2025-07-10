'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { PlayerDTO } from '@/types';
/**
 * Buscar jugadores existentes por nombre, apellido o DNI
 */
export async function searchPlayer(searchTerm: string) {
  const supabase = await createClient();
  console.log(`[searchPlayer] Buscando jugadores con término: "${searchTerm}"`);
  
  // Limpiar y preparar el término de búsqueda
  const cleanTerm = searchTerm.trim().toLowerCase();
  
  try {
    // Primero, verificar si la tabla existe y tiene algún registro
    const { count, error: countError } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true });
      
    if (countError) {
      console.error("[searchPlayer] Error verificando tabla players:", countError);
    } else {
      console.log(`[searchPlayer] Total de jugadores en la tabla: ${count}`);
    }
    
    // Buscar jugadores por nombre, apellido o DNI que coincida con el término de búsqueda
    // Incluir TODOS los jugadores (reales y de prueba) para facilitar testing
    const { data, error } = await supabase
      .from('players')
      .select('id, first_name, last_name, dni')
      .or(`first_name.ilike.%${cleanTerm}%,last_name.ilike.%${cleanTerm}%,dni.ilike.%${cleanTerm}%`)
      .limit(20);
    
    if (error) {
      console.error("[searchPlayer] Error en la consulta:", error);
      throw new Error("No se pudo buscar jugadores: " + error.message);
    }
    
    console.log(`[searchPlayer] Resultados encontrados: ${data?.length || 0}`, data);
    
    // Si no hay resultados, intentar una búsqueda más flexible
    if (!data || data.length === 0) {
      console.log("[searchPlayer] Sin resultados, intentando búsqueda más flexible");
      
      // Intentar buscar todos los jugadores
      const { data: allPlayers, error: allPlayersError } = await supabase
        .from('players')
        .select('id, first_name, last_name, dni')
        .limit(20);
      
      if (allPlayersError) {
        console.error("[searchPlayer] Error obteniendo todos los jugadores:", allPlayersError);
        return [];
      }
      
      console.log(`[searchPlayer] Total jugadores obtenidos: ${allPlayers?.length || 0}`);
      
      // Filtrar manualmente los resultados
      const filteredResults = allPlayers?.filter(player => {
        const firstName = (player.first_name || '').toLowerCase();
        const lastName = (player.last_name || '').toLowerCase();
        const dni = (player.dni || '').toLowerCase();
        return firstName.includes(cleanTerm) || lastName.includes(cleanTerm) || dni.includes(cleanTerm);
      });
      
      console.log(`[searchPlayer] Resultados en segundo intento: ${filteredResults?.length || 0}`);
      return filteredResults || [];
    }
    
    return data;
  } catch (generalError) {
    console.error("[searchPlayer] Error general:", generalError);
    // Devolver array vacío en caso de error para evitar romper la UI
    return [];
  }
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

/**
 * Registrar un jugador para un torneo
 * Si es un jugador existente, solo lo inscribe
 * Si es un jugador nuevo, lo crea primero con el score más bajo de la categoría
 */
export async function registerNewPlayer({ 
  playerId, 
  tournamentId, 
  playerData, 
  isExistingPlayer 
}: { 
  playerId?: string; 
  tournamentId: string; 
  playerData?: { first_name: string; last_name: string; gender: string; dni: string };
  isExistingPlayer: boolean;
}) {
  const supabase = await createClient();
  console.log(`[registerNewPlayer] Inscribiendo jugador en torneo ${tournamentId}`, {
    playerId,
    isExistingPlayer,
    playerData
  });
  
  // Obtener información del torneo para saber la categoría
  const { data: tournamentData, error: tournamentError } = await supabase
    .from('tournaments')
    .select(`
      *,
      club:club_id (
        id, 
        name
      )
    `)
    .eq('id', tournamentId)
    .single();
  
  if (tournamentError) {
    console.error("[registerNewPlayer] Error fetching tournament:", tournamentError);
    throw new Error("No se pudo obtener información del torneo");
  }
  
  console.log("[registerNewPlayer] Datos del torneo:", tournamentData);
  
  // Determinar el nombre de la categoría
  const categoryName = tournamentData.category_name || '';
  console.log("[registerNewPlayer] Nombre de categoría determinado:", categoryName);
  
  let playerToRegister = playerId;
  
  // Si es un nuevo jugador, verificar si ya existe con ese DNI
  if (!isExistingPlayer && playerData) {
    // Verificar si ya existe un jugador con el mismo DNI
    const { data: existingPlayerWithDNI, error: dniCheckError } = await supabase
      .from('players')
      .select('id, first_name, last_name')
      .eq('dni', playerData.dni)
      .maybeSingle();
    
    if (dniCheckError) {
      console.error("[registerNewPlayer] Error al verificar DNI:", dniCheckError);
    } else if (existingPlayerWithDNI) {
      console.log("[registerNewPlayer] Ya existe un jugador con este DNI:", existingPlayerWithDNI);
      // Si existe, usar ese jugador en lugar de crear uno nuevo
      playerToRegister = existingPlayerWithDNI.id;
      console.log(`[registerNewPlayer] Usando jugador existente con DNI: ${playerData.dni}, ID: ${playerToRegister}`);
    } else {
      // Si no existe, crear un nuevo jugador
      // Obtener el score más bajo para la categoría
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('lower_range')
        .eq('name', categoryName)
        .single();
        
      if (categoryError) {
        console.error("[registerNewPlayer] Error fetching category:", categoryError);
        throw new Error("No se pudo obtener información de la categoría");
      }
      
      console.log("[registerNewPlayer] Datos de la categoría:", categoryData);
      
        // Crear el nuevo jugador con el score mínimo de la categoría
  const newPlayerData = {
    first_name: playerData.first_name,
    last_name: playerData.last_name,
    gender: playerData.gender,
    dni: playerData.dni,
    score: categoryData.lower_range || 0,
    category_name: categoryName,
    is_categorized: true, // Mark as categorized when creating new player
    created_at: new Date().toISOString()
  };
      
      // Los nuevos jugadores se crean sin club asignado
      
      console.log("[registerNewPlayer] Datos para crear jugador:", newPlayerData);
      
      const { data: newPlayer, error: newPlayerError } = await supabase
        .from('players')
        .insert(newPlayerData)
        .select('id')
        .single();
        
      if (newPlayerError) {
        console.error("[registerNewPlayer] Error creating new player:", newPlayerError);
        throw new Error("No se pudo crear el nuevo jugador");
      }
      
      playerToRegister = newPlayer.id;
      console.log("[registerNewPlayer] Nuevo jugador creado con ID:", playerToRegister);
    }
  } else if (isExistingPlayer && playerId) {
    // Si es un jugador existente, verificar que exista y categorizar si es necesario
    console.log("[registerNewPlayer] Verificando jugador existente:", playerId);
    const { data: existingPlayer, error: existingPlayerError } = await supabase
      .from('players')
      .select('id, dni, is_categorized, score')
      .eq('id', playerId)
      .single();
      
    if (existingPlayerError) {
      console.error("[registerNewPlayer] Error verificando jugador existente:", existingPlayerError);
      throw new Error("No se pudo verificar el jugador existente");
    }
    
    console.log("[registerNewPlayer] Jugador existente verificado:", existingPlayer);
    
    // Check if the player needs to be categorized for their first tournament
    const categorizationResult = await checkAndCategorizePlayer(playerId, categoryName, supabase);
    
    if (!categorizationResult.success) {
      console.error("[registerNewPlayer] Error categorizing existing player:", categorizationResult.message);
      throw new Error(categorizationResult.message);
    }
    
    if (categorizationResult.wasCategorized) {
      console.log(`[registerNewPlayer] Player ${playerId} was categorized with score ${categorizationResult.newScore} for category ${categorizationResult.categoryName}`);
    } else {
      console.log(`[registerNewPlayer] Player ${playerId} was already categorized`);
    }
  }
  
  // Verificar que no esté ya inscrito
  const { data: existingInscription, error: existingInscriptionError } = await supabase
    .from('inscriptions')
    .select('id')
    .eq('tournament_id', tournamentId)
    .eq('player_id', playerToRegister);
    
  if (existingInscriptionError) {
    console.error("[registerNewPlayer] Error checking existing inscription:", existingInscriptionError);
    throw new Error("No se pudo verificar si el jugador ya está inscrito");
  }
  
  if (existingInscription && existingInscription.length > 0) {
    console.log("[registerNewPlayer] El jugador ya está inscrito:", existingInscription);
    throw new Error("El jugador ya está inscrito en este torneo");
  }
  
  // Inscribir al jugador en el torneo
  const { error: inscriptionError } = await supabase
    .from('inscriptions')
    .insert({
      player_id: playerToRegister,
      tournament_id: tournamentId,
      created_at: new Date().toISOString()
    });
    
  if (inscriptionError) {
    console.error("[registerNewPlayer] Error registering player:", inscriptionError);
    throw new Error("No se pudo inscribir al jugador en el torneo");
  }
  
  console.log("[registerNewPlayer] Jugador inscrito con éxito");
  
  // Revalidar la ruta para actualizar la UI
  try {
    console.log(`[registerNewPlayer] Revalidando ruta: /tournaments/${tournamentId}`);
    revalidatePath(`/tournaments/${tournamentId}`);
    // También revalidar la ruta principal de torneos
    revalidatePath('/tournaments');
  } catch (revalidateError) {
    console.error("[registerNewPlayer] Error al revalidar ruta:", revalidateError);
    // No lanzar error aquí para no interrumpir el flujo principal
  }
  
  return { success: true, message: "Jugador inscrito con éxito", playerId: playerToRegister };
} 

export async function getPlayerById(playerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('id', playerId);
  if (error) {
    console.error("[getPlayerById] Error fetching player:", error);
    throw new Error("No se pudo obtener el jugador");
  }
  return data;
}

export async function getAllPlayersDTO(): Promise<PlayerDTO[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('players')
    .select('id, first_name, last_name, dni, score');

  if (error) {
    console.error("[getAllPlayersDTO] Error fetching players:", error.message);
    throw new Error("No se pudo obtener los jugadores");
  }
  const playersDTO: PlayerDTO[] = [];
  for (const player of data) {
    playersDTO.push({
      id: player.id,
      first_name: player.first_name,
      last_name: player.last_name,
      dni: player.dni,
      score: player.score
    });
  }
  return playersDTO;
}

/**
 * Crear un jugador nuevo sin inscribirlo automáticamente al torneo
 * Esta función es útil cuando se está creando un jugador para formar una pareja
 */
export async function createPlayerForCouple({ 
  tournamentId, 
  playerData 
}: { 
  tournamentId: string; 
  playerData: { first_name: string; last_name: string; gender: string; dni: string };
}) {
  const supabase = await createClient();
  console.log(`[createPlayerForCouple] Creando jugador para pareja en torneo ${tournamentId}`, {
    playerData
  });
  
  // Verificar si ya existe un jugador con el mismo DNI
  const { data: existingPlayerWithDNI, error: dniCheckError } = await supabase
    .from('players')
    .select('id, first_name, last_name')
    .eq('dni', playerData.dni)
    .maybeSingle();
  
  if (dniCheckError) {
    console.error("[createPlayerForCouple] Error al verificar DNI:", dniCheckError);
    throw new Error("Error al verificar DNI existente");
  } 
  
  if (existingPlayerWithDNI) {
    console.log("[createPlayerForCouple] Ya existe un jugador con este DNI:", existingPlayerWithDNI);
    // Si existe, devolver ese jugador
    return { success: true, playerId: existingPlayerWithDNI.id, message: "Jugador existente encontrado" };
  }
  
  // Obtener información del torneo para saber la categoría
  const { data: tournamentData, error: tournamentError } = await supabase
    .from('tournaments')
    .select(`
      *,
      club:club_id (
        id, 
        name
      )
    `)
    .eq('id', tournamentId)
    .single();
  
  if (tournamentError) {
    console.error("[createPlayerForCouple] Error fetching tournament:", tournamentError);
    throw new Error("No se pudo obtener información del torneo");
  }
  
  console.log("[createPlayerForCouple] Datos del torneo:", tournamentData);
  
  // Determinar el nombre de la categoría
  const categoryName = tournamentData.category_name || '';
  console.log("[createPlayerForCouple] Nombre de categoría determinado:", categoryName);
  
  // Obtener el score más bajo para la categoría
  const { data: categoryData, error: categoryError } = await supabase
    .from('categories')
    .select('lower_range')
    .eq('name', categoryName)
    .single();
    
  if (categoryError) {
    console.error("[createPlayerForCouple] Error fetching category:", categoryError);
    throw new Error("No se pudo obtener información de la categoría");
  }
  
  console.log("[createPlayerForCouple] Datos de la categoría:", categoryData);
  
        // Crear el nuevo jugador con el score mínimo de la categoría
      const newPlayerData = {
        first_name: playerData.first_name,
        last_name: playerData.last_name,
        gender: playerData.gender,
        dni: playerData.dni,
        score: categoryData.lower_range || 0,
        category_name: categoryName,
        is_categorized: true, // Mark as categorized when creating new player
        created_at: new Date().toISOString()
      };
  
  // Los nuevos jugadores se crean sin club asignado
  
  console.log("[createPlayerForCouple] Datos para crear jugador:", newPlayerData);
  
  const { data: newPlayer, error: newPlayerError } = await supabase
    .from('players')
    .insert(newPlayerData)
    .select('id')
    .single();
    
  if (newPlayerError) {
    console.error("[createPlayerForCouple] Error creating new player:", newPlayerError);
    throw new Error("No se pudo crear el nuevo jugador");
  }
  
  console.log("[createPlayerForCouple] Nuevo jugador creado con ID:", newPlayer.id);
  
  return { success: true, playerId: newPlayer.id, message: "Jugador creado exitosamente" };
}

