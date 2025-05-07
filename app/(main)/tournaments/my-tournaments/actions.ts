'use server';

import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/app/api/users';
import { Tournament } from '@/types'; 

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