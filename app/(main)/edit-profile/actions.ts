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
  // avatar_url is handled separately as a file upload
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
  const avatarFile = formData.get('avatar_file') as File | null;
  const existingAvatarUrl = rawFormEntries.avatar_url_existing as string | undefined;

  // Transform raw form data for Zod parsing
  const dataToValidate = {
    first_name: rawFormEntries.first_name,
    last_name: rawFormEntries.last_name,
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
  let newAvatarPublicUrl: string | null = null;
  let shouldUpdateAvatar = false;

  try {
    if (avatarFile && avatarFile.size > 0) {
      const fileExtension = avatarFile.name.split('.').pop();
      const avatarFileName = `avatars/${user.id}-${Date.now()}.${fileExtension}`;
      console.log("Attempting to upload with filename:", avatarFileName);
      console.log("User ID for filename:", user.id);
      
      const { error: uploadError } = await supabase.storage
        .from('avatars') // Ensure this bucket exists and has public read access
        .upload(avatarFileName, avatarFile, {
          cacheControl: '3600',
          upsert: true, 
        });

      if (uploadError) {
        console.error("Error uploading avatar:", uploadError);
        return { success: false, message: `Error al subir el avatar: ${uploadError.message}`, errors: { general: ["Error al subir la imagen."] } };
      }
      
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(avatarFileName);
      
      if (!publicUrlData || !publicUrlData.publicUrl) {
        console.error("Error getting public URL for avatar:", avatarFileName);
        // Optionally, attempt to delete the uploaded file if getting URL fails
        // await supabase.storage.from('avatars').remove([avatarFileName]);
        return { success: false, message: "Error al obtener la URL pública del avatar.", errors: { general: ["No se pudo obtener la URL de la imagen."] } };
      }
      newAvatarPublicUrl = publicUrlData.publicUrl;
      shouldUpdateAvatar = true;
    } else if (existingAvatarUrl === '') { // User explicitly wants to remove avatar
        newAvatarPublicUrl = null;
        shouldUpdateAvatar = true;
    }

    // Update user role (always set to PLAYER)
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({ role: 'PLAYER' })
      .eq('id', user.id);

    if (userUpdateError) {
      console.error("Error updating user role:", userUpdateError);
      return { success: false, message: `Error al actualizar rol de usuario: ${userUpdateError.message}`, errors: null };
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

    // Add profile image URL to player data if it should be updated
    if (shouldUpdateAvatar) {
      playerUpsertData.profile_image_url = newAvatarPublicUrl;
    }
    
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

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, message: "Usuario no autenticado." };
    }

    // Get user data with all related information
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select(`
        *,
        players (
          *,
          categories (name),
          clubes (id, name)
        )
      `)
      .eq("id", user.id)
      .single();

    if (userError) {
      console.error("Error fetching user data:", userError);
      return { success: false, message: "Error al obtener datos del usuario." };
    }

    // Get all clubs for the dropdown
    const { data: allClubs, error: clubsError } = await supabase
      .from("clubes")
      .select("id, name")
      .order("name");

    if (clubsError) {
      console.error("Error fetching clubs:", clubsError);
    }

    // Flatten the player data if it exists
    const playerData = userData.players?.[0];

    const userProfile = {
      ...userData,
      // Player specific fields
      ...(playerData && {
        first_name: playerData.first_name,
        last_name: playerData.last_name,
        dni: playerData.dni,
        phone: playerData.phone,
        date_of_birth: playerData.date_of_birth,
        category_name: playerData.category_name,
        score: playerData.score,
        preferred_hand: playerData.preferred_hand,
        racket: playerData.racket,
        gender: playerData.gender,
        preferred_side: playerData.preferred_side,
        club_id: playerData.club_id,
        profile_image_url: playerData.profile_image_url,
      }),
    };

    return {
      success: true,
      message: "Datos obtenidos con éxito.",
      userProfile,
      allClubs: allClubs || []
    };
  } catch (error) {
    console.error("Unexpected error in getPlayerProfile:", error);
    return { success: false, message: "Error inesperado al obtener el perfil." };
  }
}

// --- Zod Schema for Club Profile Validation ---
const clubProfileSchema = z.object({
  name: z.string().min(1, "El nombre del club es requerido."),
  address: z.string().min(1, "La dirección es requerida."),
  // email will be handled via user table update if necessary, or assumed from existing user.email
  instagram: z.string().url("Debe ser una URL válida para Instagram o estar vacío.").nullable().optional().or(z.literal('')),
  services: z.array(z.string().uuid("ID de servicio inválido.")).optional(), // Array of service UUIDs
  // avatar_url for club can be handled similarly to player if clubs have avatars in 'users' or 'clubes' table
  avatar_url: z.string().url("Debe ser una URL válida.").nullable().optional(),
});

export type ClubFormState = {
  message: string;
  errors?: {
    name?: string[];
    address?: string[];
    instagram?: string[];
    services?: string[];
    avatar_url?: string[];
    currentPassword?: string[];
    newPassword?: string[];
    confirmNewPassword?: string[];
    general?: string[];
  } | null;
  success: boolean;
  clubProfile?: any; // To pass back fetched club profile data
  allServices?: any[]; // To pass back all available services
  clubServices?: string[]; // To pass back IDs of services the club has
};

// --- Server Action to Get Club Profile ---
export async function getClubProfile(): Promise<ClubFormState> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, message: "Usuario no autenticado.", errors: null };
  }

  try {
    // 1. Fetch basic user data (including email for security section)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role, avatar_url')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      console.error("GetClubProfile: Error fetching user data for club", userError);
      return { success: false, message: userError?.message || "No se encontraron datos de usuario.", errors: null };
    }

    if (userData.role !== 'CLUB') {
      return { success: false, message: "El usuario no tiene el rol de CLUB.", errors: null };
    }

    // 2. Fetch club-specific details from 'clubes' table
    const { data: clubData, error: clubError } = await supabase
      .from('clubes')
      .select('id, name, address, instagram, cover_image_url, gallery_images') // Added image fields
      .eq('user_id', user.id)
      .single();

    if (clubError && clubError.code !== 'PGRST116') { // PGRST116: single row not found (new club)
      console.error("GetClubProfile: Error fetching club details", clubError);
      return { success: false, message: `Error al obtener datos del club: ${clubError.message}`, errors: null };
    }

    // 3. Fetch all available services from 'services' table
    const { data: allServices, error: allServicesError } = await supabase
      .from('services')
      .select('id, name');

    console.log("Fetched allServices from DB:", allServices);
    if (allServicesError) {
      console.error("GetClubProfile: Error object fetching all services:", allServicesError);
      console.error("GetClubProfile: Error fetching all services message:", allServicesError.message);
      return { success: false, message: `Error al obtener lista de servicios: ${allServicesError.message}`, errors: null };
    }

    // 4. Fetch current services for the club from 'services_clubes' (join table)
    let clubSelectedServicesIds: string[] = [];
    if (clubData?.id) {
      const { data: currentClubServices, error: currentClubServicesError } = await supabase
        .from('services_clubes')
        .select('service_id')
        .eq('club_id', clubData.id);
      
      if (currentClubServicesError) {
        console.error("GetClubProfile: Error fetching club's current services", currentClubServicesError);
        // Non-critical, proceed but log error
      }
      if (currentClubServices) {
        clubSelectedServicesIds = currentClubServices.map(s => s.service_id);
      }
    }

    const combinedProfile = {
      ...userData,
      ...(clubData || {}),
      // email is already in userData
    };

    return {
      success: true,
      message: "Datos del club obtenidos con éxito.",
      clubProfile: combinedProfile,
      allServices: allServices || [],
      clubServices: clubSelectedServicesIds,
      errors: null,
    };

  } catch (error: any) {
    console.error("GetClubProfile: Unexpected error", error);
    return { success: false, message: `Error inesperado: ${error.message}`, errors: null };
  }
}

// --- Server Action to Update Club Profile ---
export async function completeClubProfile(prevState: ClubFormState, formData: FormData): Promise<ClubFormState> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, message: "Error de autenticación. Intenta iniciar sesión de nuevo.", errors: null };
  }

  // Ensure user is a CLUB
  const { data: userRoleData, error: roleError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (roleError || !userRoleData || userRoleData.role !== 'CLUB') {
    return { success: false, message: "Acción no permitida. Rol de usuario incorrecto.", errors: null };
  }

  const rawFormEntries = Object.fromEntries(formData.entries());
  const submittedServices = formData.getAll('services').map(String);
  
  const dataToValidate = {
    name: rawFormEntries.name,
    address: rawFormEntries.address,
    instagram: rawFormEntries.instagram === '' ? null : rawFormEntries.instagram,
    services: submittedServices.length > 0 ? submittedServices : undefined, // Zod expects undefined for optional arrays if empty
    avatar_url: rawFormEntries.avatar_url === '' || typeof rawFormEntries.avatar_url !== 'string' || (typeof rawFormEntries.avatar_url === 'string' && !rawFormEntries.avatar_url.startsWith('http')) ? null : rawFormEntries.avatar_url,
  };

  const validation = clubProfileSchema.safeParse(dataToValidate);

  if (!validation.success) {
    console.error("Club Validation Errors:", validation.error.flatten().fieldErrors);
    return {
      success: false,
      message: "Error de validación. Revisa los campos del club.",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const validatedData = validation.data;

  try {
    // 1. Update 'users' table (e.g., avatar_url)
    if (validatedData.avatar_url !== undefined) {
        const { error: userUpdateError } = await supabase
            .from('users')
            .update({ avatar_url: validatedData.avatar_url })
            .eq('id', user.id);
        if (userUpdateError) {
            console.error("Error updating club user avatar:", userUpdateError);
            return { success: false, message: `Error al actualizar avatar del club: ${userUpdateError.message}`, errors: null };
        }
    }

    // 2. Upsert club data into 'clubes' table - DIAGNOSTIC STEP
    let clubId = null;
    const clubCoreData = {
        name: validatedData.name,
        address: validatedData.address,
        instagram: validatedData.instagram,
        // user_id will be set in insert, or used in eq for update
    };

    // Try to update first
    const { data: updatedClub, error: clubUpdateError } = await supabase
        .from('clubes')
        .update(clubCoreData)
        .eq('user_id', user.id)
        .select('id')
        .single();

    if (clubUpdateError && clubUpdateError.code !== 'PGRST116') { // PGRST116 means no row found to update
        console.error("Error updating club data (diagnostic step):", clubUpdateError);
        return { success: false, message: `Error al actualizar datos del club (diagnóstico): ${clubUpdateError.message}`, errors: null };
    }

    if (updatedClub && updatedClub.id) {
        clubId = updatedClub.id;
        console.log("Club updated (diagnostic step), ID:", clubId);
    } else {
        // No club found to update, so insert new one
        console.log("No club found to update with user_id (diagnostic step), attempting insert:", user.id);
        const { data: insertedClub, error: clubInsertError } = await supabase
            .from('clubes')
            .insert({ ...clubCoreData, user_id: user.id })
            .select('id')
            .single();
        
        if (clubInsertError) {
            console.error("Error inserting new club data (diagnostic step):", clubInsertError);
            // Check if the insert error is because the user_id unique constraint was violated (meaning it exists now)
            if (clubInsertError.message.includes('duplicate key value violates unique constraint') && clubInsertError.message.includes('clubes_user_id_unique')) {
                console.error("Insert failed due to existing user_id. This is unexpected after update attempt.");
                 return { success: false, message: `Error al insertar datos del club: Conflicto de ID de usuario inesperado. ${clubInsertError.message}`, errors: null };
            } else if (clubInsertError.message.includes('clubes_user_id_fkey')) {
                 console.error("Insert failed due to user_id foreign key violation.");
                 return { success: false, message: `Error al insertar datos del club: ID de usuario inválido. ${clubInsertError.message}`, errors: null };
            }
            return { success: false, message: `Error al insertar nuevos datos del club (diagnóstico): ${clubInsertError.message}`, errors: null };
        }
        if (!insertedClub || !insertedClub.id) {
            console.error("Failed to insert club or get ID back (diagnostic step)");
            return { success: false, message: "No se pudo crear la entrada del club (diagnóstico).", errors: null };
        }
        clubId = insertedClub.id;
        console.log("Club inserted (diagnostic step), ID:", clubId);
    }

    if (!clubId) {
        console.error("Club ID is null after update/insert attempts (diagnostic step)");
        return { success: false, message: "No se pudo obtener el ID del club después de la operación (diagnóstico).", errors: null };
    }

    // 3. Manage club services in 'services_clubes' join table
    //    a. Delete existing services for the club
    const { error: deleteServicesError } = await supabase
      .from('services_clubes')
      .delete()
      .eq('club_id', clubId);

    if (deleteServicesError) {
      console.error("Error deleting old club services:", deleteServicesError);
      return { success: false, message: `Error al actualizar servicios (eliminando antiguos): ${deleteServicesError.message}`, errors: null };
    }

    //    b. Insert new selected services if any
    if (validatedData.services && validatedData.services.length > 0) {
      const servicesToInsert = validatedData.services.map(serviceId => ({
        club_id: clubId,
        service_id: serviceId,
      }));
      const { error: insertServicesError } = await supabase
        .from('services_clubes')
        .insert(servicesToInsert);

      if (insertServicesError) {
        console.error("Error inserting new club services:", insertServicesError);
        return { success: false, message: `Error al guardar nuevos servicios: ${insertServicesError.message}`, errors: null };
      }
    }
    
    // 4. Handle Password Change (if fields are present and valid)
    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmNewPassword = formData.get('confirmNewPassword') as string;

    if (newPassword) { // Only attempt password change if newPassword is provided
        if (!currentPassword) {
            return { success: false, message: "Debes ingresar tu contraseña actual para cambiarla.", errors: { currentPassword: ["Contraseña actual requerida."] } };
        }
        if (newPassword !== confirmNewPassword) {
            return { success: false, message: "Las nuevas contraseñas no coinciden.", errors: { newPassword: ["Las contraseñas no coinciden."], confirmNewPassword: ["Las contraseñas no coinciden."] } };
        }
        if (newPassword.length < 6) { // Example minimum length
            return { success: false, message: "La nueva contraseña debe tener al menos 6 caracteres.", errors: { newPassword: ["Mínimo 6 caracteres."] } };
        }

        // Verify current password (optional but recommended if not handled by Supabase Auth update inherently)
        // Supabase auth.updateUser handles current password verification if you provide the old password in a specific way, 
        // but it is often simpler to re-authenticate or use a dedicated password change function.
        // For simplicity, directly attempting to update the user with the new password.
        const { error: passwordUpdateError } = await supabase.auth.updateUser({ password: newPassword });

        if (passwordUpdateError) {
            console.error("Error updating club password:", passwordUpdateError);
            if (passwordUpdateError.message.includes("New password should be different from the old password.")){
                 return { success: false, message: "La nueva contraseña debe ser diferente a la actual.", errors: { newPassword: ["Debe ser diferente a la actual."] } };
            }
            return { success: false, message: `Error al cambiar la contraseña: ${passwordUpdateError.message}`, errors: { newPassword: [`Error: ${passwordUpdateError.message}`] } };
        }
        // If password update is successful, the main success message will cover it.
    }


    return { success: true, message: "Perfil del club actualizado con éxito.", errors: null };

  } catch (error: any) {
    console.error("Unexpected error updating club profile:", error);
    return { success: false, message: `Error inesperado: ${error.message || 'Ocurrió un problema'}`, errors: null };
  }
} 

// =================== CLUB IMAGE ACTIONS ===================

/**
 * Upload cover image for a club
 */
export async function uploadClubCoverAction(formData: FormData): Promise<{ success: boolean; message: string; url?: string }> {
  console.log('🔧 uploadClubCoverAction called')
  const supabase = await createClient();

  try {
    console.log('🔍 Checking authentication...')
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log('❌ Authentication failed:', authError)
      return { success: false, message: "Usuario no autenticado." };
    }
    console.log('✅ User authenticated:', user.id)

    console.log('🏢 Getting user club...')
    // Get user's club
    const { data: userClub, error: clubError } = await supabase
      .from("clubes")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (clubError || !userClub) {
      console.log('❌ Club not found:', clubError)
      return { success: false, message: "No tienes un club asociado." };
    }
    console.log('✅ Club found:', userClub.id)

    console.log('📁 Checking formData entries:', Array.from(formData.entries()))
    // Get file from form data - FIXED: looking for 'file' instead of 'cover_image'
    const file = formData.get('file') as File;
    if (!file || file.size === 0) {
      console.log('❌ No file found in formData')
      return { success: false, message: "No se seleccionó ningún archivo." };
    }
    console.log('✅ File found:', file.name, file.size, file.type)

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      console.log('❌ Invalid file type:', file.type)
      return { success: false, message: "Tipo de archivo no permitido. Solo se permiten imágenes (JPG, PNG, WEBP)." };
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      console.log('❌ File too large:', file.size)
      return { success: false, message: "El archivo es demasiado grande. Máximo 5MB." };
    }

    console.log('🚀 Calling uploadClubCoverImage...')
    // Upload using the utility function
    const { uploadClubCoverImage } = await import("@/app/api/users");
    const result = await uploadClubCoverImage(userClub.id, file);
    console.log('📥 Upload result:', result)

    if (result.success) {
      console.log('✅ Cover upload successful')
      
      // Invalidate cache for pages that show club data
      const { revalidatePath } = await import("next/cache");
      revalidatePath('/'); // Home page
      revalidatePath('/clubes'); // Clubs page
      revalidatePath('/edit-profile'); // Edit profile page
      console.log('🔄 Cache invalidated for pages: /, /clubes, /edit-profile')
      
      return { success: true, message: "Imagen de portada subida exitosamente.", url: result.url };
    } else {
      console.log('❌ Cover upload failed:', result.error)
      return { success: false, message: result.error || "Error al subir la imagen." };
    }
  } catch (error) {
    console.error("💥 Error in uploadClubCoverAction:", error);
    return { success: false, message: "Error inesperado al subir la imagen." };
  }
}

/**
 * Upload gallery image for a club
 */
export async function uploadClubGalleryAction(formData: FormData): Promise<{ success: boolean; message: string; url?: string; galleryImages?: string[] }> {
  console.log('🔧 uploadClubGalleryAction called')
  const supabase = await createClient();

  try {
    console.log('🔍 Checking authentication...')
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log('❌ Authentication failed:', authError)
      return { success: false, message: "Usuario no autenticado." };
    }
    console.log('✅ User authenticated:', user.id)

    console.log('🏢 Getting user club...')
    // Get user's club
    const { data: userClub, error: clubError } = await supabase
      .from("clubes")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (clubError || !userClub) {
      console.log('❌ Club not found:', clubError)
      return { success: false, message: "No tienes un club asociado." };
    }
    console.log('✅ Club found:', userClub.id)

    console.log('📁 Checking formData entries:', Array.from(formData.entries()))
    // Get file from form data - FIXED: looking for 'file' instead of 'gallery_image'
    const file = formData.get('file') as File;
    if (!file || file.size === 0) {
      console.log('❌ No file found in formData')
      return { success: false, message: "No se seleccionó ningún archivo." };
    }
    console.log('✅ File found:', file.name, file.size, file.type)

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      console.log('❌ Invalid file type:', file.type)
      return { success: false, message: "Tipo de archivo no permitido. Solo se permiten imágenes (JPG, PNG, WEBP)." };
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      console.log('❌ File too large:', file.size)
      return { success: false, message: "El archivo es demasiado grande. Máximo 5MB." };
    }

    console.log('🚀 Calling uploadClubGalleryImage...')
    // Upload using the utility function
    const { uploadClubGalleryImage } = await import("@/app/api/users");
    const result = await uploadClubGalleryImage(userClub.id, file);
    console.log('📥 Gallery upload result:', result)

    if (result.success) {
      console.log('✅ Gallery upload successful')
      
      // Invalidate cache for pages that show club data
      const { revalidatePath } = await import("next/cache");
      revalidatePath('/'); // Home page
      revalidatePath('/clubes'); // Clubs page
      revalidatePath('/edit-profile'); // Edit profile page
      console.log('🔄 Cache invalidated for pages: /, /clubes, /edit-profile')
      
      return { 
        success: true, 
        message: "Imagen agregada a la galería exitosamente.", 
        url: result.url,
        galleryImages: result.galleryImages
      };
    } else {
      console.log('❌ Gallery upload failed:', result.error)
      return { success: false, message: result.error || "Error al subir la imagen." };
    }
  } catch (error) {
    console.error("💥 Error in uploadClubGalleryAction:", error);
    return { success: false, message: "Error inesperado al subir la imagen." };
  }
}

/**
 * Remove gallery image from a club
 */
export async function removeClubGalleryAction(formData: FormData): Promise<{ success: boolean; message: string; galleryImages?: string[] }> {
  console.log('🔧 removeClubGalleryAction called')
  const supabase = await createClient();

  try {
    console.log('🔍 Checking authentication...')
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log('❌ Authentication failed:', authError)
      return { success: false, message: "Usuario no autenticado." };
    }
    console.log('✅ User authenticated:', user.id)

    console.log('🏢 Getting user club...')
    // Get user's club
    const { data: userClub, error: clubError } = await supabase
      .from("clubes")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (clubError || !userClub) {
      console.log('❌ Club not found:', clubError)
      return { success: false, message: "No tienes un club asociado." };
    }
    console.log('✅ Club found:', userClub.id)

    console.log('📁 Checking formData entries:', Array.from(formData.entries()))
    // Get image URL from form data - FIXED: looking for 'imageUrl' instead of 'image_url'
    const imageUrl = formData.get('imageUrl') as string;
    if (!imageUrl) {
      console.log('❌ No imageUrl found in formData')
      return { success: false, message: "URL de imagen no válida." };
    }
    console.log('✅ ImageUrl found:', imageUrl)

    console.log('🚀 Calling removeClubGalleryImage...')
    // Remove using the utility function
    const { removeClubGalleryImage } = await import("@/app/api/users");
    const result = await removeClubGalleryImage(userClub.id, imageUrl);
    console.log('📥 Remove result:', result)

    if (result.success) {
      console.log('✅ Gallery image removed successfully')
      
      // Invalidate cache for pages that show club data
      const { revalidatePath } = await import("next/cache");
      revalidatePath('/'); // Home page
      revalidatePath('/clubes'); // Clubs page
      revalidatePath('/edit-profile'); // Edit profile page
      console.log('🔄 Cache invalidated for pages: /, /clubes, /edit-profile')
      
      return { 
        success: true, 
        message: "Imagen eliminada de la galería exitosamente.", 
        galleryImages: result.galleryImages
      };
    } else {
      console.log('❌ Image removal failed:', result.error)
      return { success: false, message: result.error || "Error al eliminar la imagen." };
    }
  } catch (error) {
    console.error("💥 Error in removeClubGalleryAction:", error);
    return { success: false, message: "Error inesperado al eliminar la imagen." };
  }
} 