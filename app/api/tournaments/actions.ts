'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

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
    .select('id, first_name, last_name') // Ajusta las columnas que necesites
    .in('id', playerIds);

  if (playersError) {
    console.error(`[getPlayersByTournamentId] Error fetching player details for tournament ${tournamentId}:`, playersError.message);
    throw playersError;
  }
  return players || [];
}
