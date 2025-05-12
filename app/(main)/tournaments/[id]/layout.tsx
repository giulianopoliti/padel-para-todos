import { createClient } from '@/utils/supabase/server';
import type { ReactNode } from 'react';
import type { User as AuthUser } from "@supabase/supabase-js";
import type { Tournament, Category, Match } from '@/types'; 
import type { Database, Tables } from "@/database.types"; 

interface UserDetailsInternal {
  id: string; 
  role: string | null;
  entity_id: string | null; 
}

async function getUserSessionAndDetails(): Promise<{ user: AuthUser | null; userDetails: UserDetailsInternal | null; }> {
  const supabaseClient = await createClient();
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

  if (authError || !user) {
    return { user: null, userDetails: null };
  }

  const { data: userRecord, error: userRecordError } = await supabaseClient
    .from('users')
    .select('id, role') 
    .eq('id', user.id)
    .single();

  if (userRecordError || !userRecord) {
    console.error("[Layout getUserSessionAndDetails] Error fetching user record for user:", user.id, userRecordError?.message);
    return { user, userDetails: null }; 
  }

  let entity_id: string | null = null;
  if (userRecord.role === 'CLUB') {
    const { data: clubData, error: clubError } = await supabaseClient
      .from('clubes') 
      .select('id')    
      .eq('user_id', userRecord.id) 
      .single();
    if (clubError) {
      console.error("[Layout getUserSessionAndDetails] Error fetching club_id for user:", userRecord.id, clubError.message);
    } else if (clubData) {
      entity_id = clubData.id;
    }
  } 
  
  return { 
    user, 
    userDetails: { 
      id: userRecord.id, 
      role: userRecord.role, 
      entity_id: entity_id 
    } 
  };
}

interface TournamentIdLayoutProps {
  children: ReactNode;
  club: ReactNode;       
  player: ReactNode;     
  public: ReactNode;      
  params: { id: string };
}

export default async function TournamentIdLayout({
  children,
  club,
  player,
  public: publicView, 
  params: { id: tournamentId },
}: TournamentIdLayoutProps) {
  const { user, userDetails } = await getUserSessionAndDetails();
  const supabaseClient = await createClient();

  const { data: tournamentData, error: tournamentError } = await supabaseClient
    .from('tournaments')
    .select('id, name, club_id') 
    .eq('id', tournamentId)
    .single();

  if (tournamentError || !tournamentData) {
    console.error(`[Layout] Error fetching tournament (${tournamentId}):`, tournamentError?.message);
    return publicView;
  }

  const isClubOwnerOfThisTournament =
    user &&
    userDetails?.role === 'CLUB' &&
    userDetails.entity_id === tournamentData.club_id; 

  if (isClubOwnerOfThisTournament) {
    return club;
  } else if (user) {
    return player;
  } else {
    return publicView;
  }
} 