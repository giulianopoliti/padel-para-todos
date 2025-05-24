'use server'

import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { Database } from '@/database.types';
// --- Zod Schema for Player Profile Validation ---

// Since this page is now only for players, we simplify the schema.
const playerProfileSchema = z.object({
  // user_id will be taken from the authenticated user session
  first_name: z.string().min(1, "El nombre es requerido."),
  last_name: z.string().min(1, "El apellido es requerido."),
  avatar_url: z.string().url("Debe ser una URL válida.").nullable().optional(),
  dni: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  date_of_birth: z.string().nullable().optional(), // Expecting yyyy-mm-dd or empty
  category_name: z.string().nullable().optional(), // Now editable
  score: z.number().nullable().optional(),
  preferred_hand: z.string().nullable().optional(),
  racket: z.string().nullable().optional(),
  gender: z.enum(["MALE", "FEMALE", "MIXED"] as const).nullable().optional(), // Corrected "SHEMALE" to "FEMALE" based on common usage, adjust if "SHEMALE" is intentional
  preferred_side: z.enum(["DRIVE", "REVES"] as const).nullable().optional(),
  club_id: z.string().uuid("ID de club inválido").nullable().optional(), // NO_CLUB for placeholder
});

export type FormState = {
  message: string;
  errors?: {
    first_name?: string[];
    last_name?: string[];
    avatar_url?: string[];
    dni?: string[];
    phone?: string[];
    date_of_birth?: string[];
    category_name?: string[];
    score?: string[];
    preferred_hand?: string[];
    racket?: string[];
    gender?: string[];
    preferred_side?: string[];
    club_id?: string[];
    general?: string[];
  } | null;
  success: boolean;
};

export async function completeUserProfile(prevState: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, message: "Error de autenticación. Intenta iniciar sesión de nuevo.", errors: null };
  }

  const rawFormEntries = Object.fromEntries(formData.entries());

  // Transform raw form data for Zod parsing
  const dataToValidate = {
    first_name: rawFormEntries.first_name,
    last_name: rawFormEntries.last_name,
    avatar_url: rawFormEntries.avatar_url === '' || typeof rawFormEntries.avatar_url !== 'string' || (typeof rawFormEntries.avatar_url === 'string' && !rawFormEntries.avatar_url.startsWith('http')) ? null : rawFormEntries.avatar_url,
    dni: rawFormEntries.dni === '' ? null : rawFormEntries.dni,
    phone: rawFormEntries.phone === '' ? null : rawFormEntries.phone,
    date_of_birth: rawFormEntries.date_of_birth === '' ? null : rawFormEntries.date_of_birth,
    category_name: rawFormEntries.category_name === '' ? null : rawFormEntries.category_name,
    score: (rawFormEntries.score === '' || rawFormEntries.score === undefined || rawFormEntries.score === null) ? null : Number(rawFormEntries.score),
    preferred_hand: rawFormEntries.preferred_hand === '' ? null : rawFormEntries.preferred_hand,
    racket: rawFormEntries.racket === '' ? null : rawFormEntries.racket,
    gender: rawFormEntries.gender === '' ? null : (rawFormEntries.gender === 'SHEMALE' ? 'FEMALE' : rawFormEntries.gender),
    preferred_side: rawFormEntries.preferred_side === '' ? null : rawFormEntries.preferred_side,
    club_id: (rawFormEntries.club_id === '' || rawFormEntries.club_id === 'NO_CLUB') ? null : rawFormEntries.club_id,
  };

  const validation = playerProfileSchema.safeParse(dataToValidate);

  if (!validation.success) {
    console.error("Validation Errors:", validation.error.flatten().fieldErrors);
    return {
      success: false,
      message: "Error de validación. Revisa los campos.",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const validatedData = validation.data;

  try {
    const userUpdatePayload: any = { 
        role: 'PLAYER', 
        avatar_url: validatedData.avatar_url,
    };
    
    const { error: userUpdateError } = await supabase
      .from('users')
      .update(userUpdatePayload)
      .eq('id', user.id);

    if (userUpdateError) {
      console.error("Error updating user data:", userUpdateError);
      if (userUpdateError.message.includes('column') && userUpdateError.message.includes('avatar_url') && userUpdateError.message.includes('does not exist')){
        return { success: false, message: `Error al actualizar datos de usuario: La columna 'avatar_url' no existe en la tabla 'users'. Por favor, verifica tu esquema de base de datos y regenera los tipos.`, errors: null };  
      }
      return { success: false, message: `Error al actualizar datos de usuario: ${userUpdateError.message}`, errors: null };
    }

    const playerUpsertData: any = {
      user_id: user.id,
      first_name: validatedData.first_name,
      last_name: validatedData.last_name,
      dni: validatedData.dni,
      phone: validatedData.phone,
      date_of_birth: validatedData.date_of_birth,
      category_name: validatedData.category_name,
      score: validatedData.score,
      preferred_hand: validatedData.preferred_hand,
      racket: validatedData.racket,
      gender: validatedData.gender as Database["public"]["Enums"]["GENDER"],
      preferred_side: validatedData.preferred_side as Database["public"]["Enums"]["PREFERRED_SIDE"],
      club_id: validatedData.club_id,
    };
    
    const { error: playerUpsertError } = await supabase
      .from('players')
      .upsert(playerUpsertData, { onConflict: 'user_id' });

    if (playerUpsertError) {
      console.error(`Error upserting into players:`, playerUpsertError);
      if (playerUpsertError.message.includes('foreign key constraint') && playerUpsertError.message.includes('category_name')) {
          return { 
              success: false, 
              message: `Error al guardar detalles de Jugador: La categoría seleccionada no es válida. (${playerUpsertError.message})`, 
              errors: { category_name: ["Categoría inválida."] } 
            };
      } else if (playerUpsertError.message.includes('column') && playerUpsertError.message.includes('category_name') && playerUpsertError.message.includes('does not exist')){
        return { success: false, message: `Error al guardar detalles de Jugador: La columna 'category_name' no existe en la tabla 'players'. Por favor, verifica tu esquema de base de datos y regenera los tipos.`, errors: { category_name: ["Campo de categoría no existe en la base de datos."] } };  
      }
      return { success: false, message: `Error al guardar detalles de Jugador: ${playerUpsertError.message}. Intenta de nuevo.`, errors: null };
    }

    return { success: true, message: "Perfil de jugador actualizado con éxito.", errors: null };

  } catch (error: any) {
    console.error("Unexpected error updating player profile:", error);
    return { success: false, message: `Error inesperado: ${error.message || 'Ocurrió un problema'}`, errors: null };
  }
}

export async function getPlayerProfile() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("[GetPlayerProfile DEBUG] Auth error or no user:", authError);
    return { success: false, message: "Usuario no autenticado.", userProfile: null, allClubs: [] };
  }
  console.error("[GetPlayerProfile DEBUG] Authenticated user ID:", user.id);

  try {
    const { data: userDataResult, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        role,
        avatar_url
      `)
      .eq('id', user.id)
      .single();

    console.error("[GetPlayerProfile DEBUG] userDataResult from users table:", userDataResult);
    console.error("[GetPlayerProfile DEBUG] userError from users table:", userError);

    if (userError) {
      console.error("GetPlayerProfile: Error fetching user data", userError);
      if (userError.message.includes('column') && userError.message.includes('avatar_url') && userError.message.includes('does not exist')) {
        return { success: false, message: "Error: La columna 'avatar_url' no existe en la tabla 'users'. Regenera los tipos.", userProfile: null, allClubs: [] };
      }
      throw userError;
    }
    
    const userData: any = userDataResult;

    if (!userData) {
        console.error("[GetPlayerProfile DEBUG] No userData found after fetch.");
        return { success: false, message: "No se encontraron datos de usuario.", userProfile: null, allClubs: [] };
    }
    console.error("[GetPlayerProfile DEBUG] Fetched userData:", userData);

    // Ensure user is a player
    if (userData.role !== 'PLAYER') {
        console.error("[GetPlayerProfile DEBUG] User is not a PLAYER. Role:", userData.role);
        return { success: false, message: "El usuario no es un jugador.", userProfile: { ...(userData as any), playerDetails: null }, allClubs: [] };
    }

    const { data: playerDetailsResult, error: playerError } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', user.id)
      .single();
      
    console.error("[GetPlayerProfile DEBUG] playerDetailsResult from players table:", playerDetailsResult);
    console.error("[GetPlayerProfile DEBUG] playerError from players table:", playerError);
      
    const playerDetails: any = playerDetailsResult;

    if (playerError && playerError.code !== 'PGRST116') { 
      console.error("GetPlayerProfile: Error fetching player details", playerError);
      if (playerError.message.includes('column') && playerError.message.includes('category_name') && playerError.message.includes('does not exist')) {
        return { success: false, message: "Error: La columna 'category_name' no existe en la tabla 'players'. Regenera los tipos.", userProfile: null, allClubs: [] };
      }
      throw playerError;
    }
    if (playerDetails) {
        console.error("[GetPlayerProfile DEBUG] Fetched playerDetails:", playerDetails);
    } else {
        console.error("[GetPlayerProfile DEBUG] No playerDetails found (this might be normal for a new player).");
    }

    const { data: clubs, error: clubsError } = await supabase
      .from('clubes')
      .select('id, name');

    if (clubsError) {
      console.error("[GetPlayerProfile DEBUG] Error fetching clubs:", clubsError);
    }

    const finalUserProfile = {
      ...(userData as any),
      ...(playerDetails || {}), 
    };
    console.error("[GetPlayerProfile DEBUG] Final combined userProfile object:", finalUserProfile);

    return { 
      success: true, 
      message: "Datos obtenidos con éxito.", 
      userProfile: finalUserProfile,
      allClubs: clubs || [] 
    };

  } catch (error: any) {
    console.error("[GetPlayerProfile DEBUG] Unexpected error in try-catch:", error);
    return { success: false, message: `Error inesperado al obtener el perfil: ${error.message}`, userProfile: null, allClubs: [] };
  }
} 