'use server'

import { createClient } from '@/utils/supabase/server'

// Definición de tipos
interface PlayerProfileData {
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  date_of_birth: string;
  dni: string;
  gender: string;
  preferred_hand: string | null;
  preferred_side: string | null;
  club_id: string | null;
  racket: string | null;
}

// Obtener lista de clubes
export async function getClubes() {
  try {
    console.log("[SERVER] Fetching clubs list")
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('clubes')
      .select('id, name')
      .order('name', { ascending: true })
    
    if (error) {
      console.error("[SERVER] Error fetching clubs:", error.message)
      return { error: error.message }
    }
    
    console.log("[SERVER] Successfully fetched clubs:", data.length)
    return { clubs: data }
  } catch (e) {
    console.error("[SERVER] Unexpected error fetching clubs:", e)
    return { error: "Error inesperado al obtener los clubes." }
  }
}

// Actualizar perfil del jugador
export async function updatePlayerProfile(profileData: PlayerProfileData) {
  try {
    console.log("[SERVER] Updating player profile for user:", profileData.user_id)
    const supabase = await createClient()
    
    // Obtener el ID del jugador basado en el user_id
    const { data: playerRecord, error: playerError } = await supabase
      .from('players')
      .select('id')
      .eq('user_id', profileData.user_id)
      .single()
    
    if (playerError) {
      console.error("[SERVER] Error fetching player:", playerError.message)
      return { error: playerError.message }
    }
    
    if (!playerRecord) {
      console.error("[SERVER] Player record not found")
      return { error: "No se encontró el registro del jugador" }
    }
    
    // Actualizar los datos del jugador
    const { error: updateError } = await supabase
      .from('players')
      .update({
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        phone: profileData.phone,
        date_of_birth: profileData.date_of_birth,
        dni: profileData.dni,
        gender: profileData.gender,
        preferred_hand: profileData.preferred_hand,
        preferred_side: profileData.preferred_side,
        club_id: profileData.club_id,
        racket: profileData.racket
      })
      .eq('id', playerRecord.id)
    
    if (updateError) {
      console.error("[SERVER] Error updating player:", updateError.message)
      return { error: updateError.message }
    }
    
    // Actualizar el estado de registro en users
    const { error: usersError } = await supabase
      .from('users')
      .update({ profile_completed: true })
      .eq('id', profileData.user_id)
    
    if (usersError) {
      console.error("[SERVER] Error updating user profile_completed:", usersError.message)
    }
    
    console.log("[SERVER] Player profile updated successfully")
    return { success: true }
  } catch (e) {
    console.error("[SERVER] Unexpected error updating player profile:", e)
    return { error: "Error inesperado al actualizar el perfil." }
  }
} 