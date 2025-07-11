'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/database.types';
import type { BaseMatch } from '@/types';

export async function updateMatch(
  matchId: string,
  data: {
    status?: BaseMatch['status'];
    court?: string | undefined;
  }
) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('No autorizado');
    }

    // Get match to verify permissions
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('tournament_id')
      .eq('id', matchId)
      .single();

    if (matchError || !match || !match.tournament_id) {
      throw new Error('Partido no encontrado');
    }

    // Verify user is tournament owner
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('club_id')
      .eq('id', match.tournament_id)
      .single();

    if (tournamentError || !tournament || !tournament.club_id) {
      throw new Error('Torneo no encontrado');
    }

    // Get user's club
    const { data: club, error: clubError } = await supabase
      .from('clubes')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (clubError || !club || club.id !== tournament.club_id) {
      throw new Error('No autorizado para modificar este partido');
    }

    // Update match
    const { error: updateError } = await supabase
      .from('matches')
      .update({
        status: data.status,
        court: data.court,
      })
      .eq('id', matchId);

    if (updateError) {
      throw new Error('Error al actualizar el partido');
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating match:', error);
    throw error;
  }
} 