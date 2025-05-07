'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Registrar una pareja para un torneo
 * Primero crea la pareja si no existe, luego la inscribe en el torneo
 */
export async function registerCoupleForTournament({ 
  player1Id, 
  player2Id, 
  tournamentId 
}: { 
  player1Id: string; 
  player2Id: string;
  tournamentId: string; 
}) {
  const supabase = await createClient();
  console.log(`[registerCoupleForTournament] Inscribiendo pareja en torneo ${tournamentId}`, {
    player1Id,
    player2Id
  });
  
  // Verificar que ambos jugadores existan
  const { data: player1, error: player1Error } = await supabase
    .from('players')
    .select('id, first_name, last_name')
    .eq('id', player1Id)
    .single();
    
  if (player1Error) {
    console.error("[registerCoupleForTournament] Error verificando jugador 1:", player1Error);
    throw new Error("No se pudo verificar el primer jugador");
  }
  
  const { data: player2, error: player2Error } = await supabase
    .from('players')
    .select('id, first_name, last_name')
    .eq('id', player2Id)
    .single();
    
  if (player2Error) {
    console.error("[registerCoupleForTournament] Error verificando jugador 2:", player2Error);
    throw new Error("No se pudo verificar el segundo jugador");
  }
  
  console.log("[registerCoupleForTournament] Jugadores verificados:", { player1, player2 });
  
  // Verificar si la pareja ya existe (en cualquier orden)
  const { data: existingCouple, error: coupleCheckError } = await supabase
    .from('couples')
    .select('id')
    .or(`player_1.eq.${player1Id},player_2.eq.${player1Id}`)
    .or(`player_1.eq.${player2Id},player_2.eq.${player2Id}`)
    .maybeSingle();
    
  if (coupleCheckError) {
    console.error("[registerCoupleForTournament] Error verificando pareja existente:", coupleCheckError);
    throw new Error("No se pudo verificar si la pareja ya existe");
  }
  
  let coupleId;
  
  if (existingCouple) {
    // Usar la pareja existente
    coupleId = existingCouple.id;
    console.log(`[registerCoupleForTournament] Usando pareja existente: ${coupleId}`);
  } else {
    // Crear una nueva pareja
    const { data: newCouple, error: createCoupleError } = await supabase
      .from('couples')
      .insert({
        player_1: player1Id,
        player_2: player2Id,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();
      
    if (createCoupleError) {
      console.error("[registerCoupleForTournament] Error creando pareja:", createCoupleError);
      throw new Error("No se pudo crear la pareja");
    }
    
    coupleId = newCouple.id;
    console.log(`[registerCoupleForTournament] Pareja creada con ID: ${coupleId}`);
  }
  
  // Verificar si la pareja ya está inscrita en este torneo
  const { data: existingInscription, error: inscriptionCheckError } = await supabase
    .from('inscriptions')
    .select('id')
    .eq('tournament_id', tournamentId)
    .eq('couple_id', coupleId)
    .maybeSingle();
    
  if (inscriptionCheckError) {
    console.error("[registerCoupleForTournament] Error verificando inscripción existente:", inscriptionCheckError);
    throw new Error("No se pudo verificar si la pareja ya está inscrita");
  }
  
  if (existingInscription) {
    console.log("[registerCoupleForTournament] La pareja ya está inscrita en este torneo");
    throw new Error("Esta pareja ya está inscrita en el torneo");
  }
  
  // Inscribir la pareja en el torneo
  const { error: inscriptionError } = await supabase
    .from('inscriptions')
    .insert({
      couple_id: coupleId,
      tournament_id: tournamentId,
      created_at: new Date().toISOString()
    });
    
  if (inscriptionError) {
    console.error("[registerCoupleForTournament] Error inscribiendo pareja:", inscriptionError);
    throw new Error("No se pudo inscribir la pareja en el torneo");
  }
  
  console.log("[registerCoupleForTournament] Pareja inscrita exitosamente");
  
  // Revalidar la ruta para actualizar la UI
  try {
    console.log(`[registerCoupleForTournament] Revalidando ruta: /tournaments/${tournamentId}`);
    revalidatePath(`/tournaments/${tournamentId}`);
    // También revalidar la ruta principal de torneos
    revalidatePath('/tournaments');
  } catch (revalidateError) {
    console.error("[registerCoupleForTournament] Error al revalidar ruta:", revalidateError);
    // No lanzar error aquí para no interrumpir el flujo principal
  }
  
  return { success: true, message: "Pareja inscrita con éxito" };
} 

export async function getCouplesByTournamentId(tournamentId: string) {
  if (!tournamentId) {
    console.warn("[getCouplesByTournamentId] No tournamentId provided");
    return []; // Devuelve array vacío si no hay ID
  }
  const supabase = await createClient();

  // 1. Obtener los couple_id de la tabla inscriptions para el torneo dado
  const { data: inscriptions, error: inscriptionsError } = await supabase
    .from('inscriptions')
    .select('couple_id') // Solo necesitamos couple_id
    .eq('tournament_id', tournamentId);

  if (inscriptionsError) {
    console.error(`[getCouplesByTournamentId] Error fetching inscriptions for tournament ${tournamentId}:`, inscriptionsError.message);
    throw inscriptionsError; // Relanzar el error para que sea manejado por el llamador
  }

  if (!inscriptions || inscriptions.length === 0) {
    // console.log(`[getCouplesByTournamentId] No inscriptions found for tournament ${tournamentId}`);
    return []; // No hay parejas inscritas en este torneo
  }

  // Extraer los IDs de las parejas (asegurándose de que no sean null y sean únicos)
  const coupleIds = inscriptions
    .map(inscription => inscription.couple_id)
    .filter(id => id !== null) as string[];
    
  if (coupleIds.length === 0) {
    // console.log(`[getCouplesByTournamentId] No valid couple_ids found in inscriptions for tournament ${tournamentId}`);
    return [];
  }

  // 2. Obtener los detalles de esas parejas
  // Incluimos detalles de player_1 y player_2 para mostrar nombres, etc.
  const { data: couples, error: couplesError } = await supabase
    .from('couples')
    .select(`
      *,
      player_1:players!couples_player_1_fkey ( id, first_name, last_name ),
      player_2:players!couples_player_2_fkey ( id, first_name, last_name )
    `)
    .in('id', coupleIds);

  if (couplesError) {
    console.error(`[getCouplesByTournamentId] Error fetching couple details for tournament ${tournamentId}:`, couplesError.message);
    throw couplesError;
  }

  // console.log(`[getCouplesByTournamentId] Fetched ${couples?.length || 0} couples for tournament ${tournamentId}`);
  return couples || [];
}
