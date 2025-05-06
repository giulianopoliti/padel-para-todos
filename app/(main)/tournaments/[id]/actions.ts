'use server'

import { createClient } from '@/utils/supabase/server';
import { Database, Tables } from '@/database.types';
import { revalidatePath } from 'next/cache';
import { getUser } from '@/app/api/users';

// Simple UUID generator function


// Type for the response of the server action
export type InscriptionResult = {
    success: boolean;
    message: string;
    inscriptionId?: string; // Optionally return the new ID
};

// Type for Player data needed
type Player = Tables<"players">;

export async function registerPlayerForTournament(tournamentId: string): Promise<InscriptionResult> {
    const supabase = await createClient();

    // 1. Get current authenticated user using the getUser function
    const user = await getUser();
    console.log("Inscription Action: User", user);
    if (!user) {
        console.error("Inscription Action: No authenticated user found");
        return { success: false, message: "Error de autenticación. Por favor inicia sesión nuevamente." };
    }

    // 2. Find the Player ID associated with the authenticated user
    let playerId: string | null = null;
    try {
        const { data: playerData, error: playerError } = await supabase
            .from('players')
            .select('id') // Select only the ID
            .eq('user_id', user.id) // Match based on the auth user ID link
            .single();

        if (playerError) {
            console.error("Inscription Action: Player Fetch Error", playerError);
            // Handle case where user might not have a player profile yet
            if (playerError.code === 'PGRST116') { // "Resource not found"
                 return { success: false, message: "No se encontró un perfil de jugador asociado a tu cuenta." };
            }
            return { success: false, message: `Error al buscar perfil de jugador: ${playerError.message}` };
        }
        if (!playerData) {
             return { success: false, message: "No se encontró un perfil de jugador asociado a tu cuenta." };
        }
        playerId = playerData.id;
        console.log(`Inscription Action: Found Player ID ${playerId} for User ID ${user.id}`);

    } catch (error: any) {
        console.error("Inscription Action: Unexpected Error fetching player", error);
        return { success: false, message: `Error inesperado: ${error.message}` };
    }

    if (!playerId) {
        // Should be caught above, but double-check
        return { success: false, message: "No se pudo determinar el ID del jugador." };
    }

    // 3. Check if player is already inscribed in this tournament
    try {
        const { data: existingInscription, error: checkError } = await supabase
            .from('inscriptions')
            .select('id')
            .eq('tournament_id', tournamentId)
            .eq('player_id', playerId)
            .maybeSingle(); // Use maybeSingle to handle 0 or 1 result

        if (checkError) {
            console.error("Inscription Action: Error checking existing inscription", checkError);
            return { success: false, message: `Error al verificar inscripción: ${checkError.message}` };
        }

        if (existingInscription) {
            console.log(`Inscription Action: Player ${playerId} already registered for tournament ${tournamentId}`);
            return { success: false, message: "Ya estás inscrito en este torneo." };
        }

    } catch (error: any) {
         console.error("Inscription Action: Unexpected Error checking inscription", error);
        return { success: false, message: `Error inesperado: ${error.message}` };
    }

    // 4. Insert the inscription
    try {
        const { data: newInscription, error: insertError } = await supabase
            .from('inscriptions')
            .insert({
                player_id: playerId,
                tournament_id: tournamentId
                // Omit couple_id entirely, assuming the column is nullable
            })
            .select('id')
            .single();

        if (insertError) {
            console.error("Inscription Action: Insert Error", insertError);
            return { success: false, message: `Error al inscribir: ${insertError.message}` };
        }
        
        if (!newInscription) {
             console.error("Inscription Action: Insert succeeded but no data returned");
            return { success: false, message: "Error al inscribir: No se recibió confirmación." };
        }

        console.log(`Inscription Action: Player ${playerId} successfully registered for tournament ${tournamentId}, Inscription ID: ${newInscription.id}`);
        
        // Revalidate the tournament path to show updated data (like inscriptions)
        revalidatePath(`/tournaments/${tournamentId}`);

        return { success: true, message: "Inscripción exitosa!", inscriptionId: newInscription.id };

    } catch (error: any) {
        console.error("Inscription Action: Unexpected Error inserting inscription", error);
        return { success: false, message: `Error inesperado: ${error.message}` };
    }
} 