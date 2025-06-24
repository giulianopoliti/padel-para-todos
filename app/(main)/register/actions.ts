"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { EmailOtpType } from "@supabase/supabase-js"
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

// Interface for registration result
interface RegisterResult {
  success: boolean;
  error?: string;
  message?: string;
  matched?: boolean;
  requiresConfirmation?: boolean;
  showConflictReport?: boolean;
  existingPlayer?: {
    id: string;
    name: string;
    score: number;
    category: string;
    dni: string;
    isExistingPlayer: boolean;
  };
  tempUserId?: string;
  conflictData?: {
    dni: string | null;
    existingPlayerId: string;
    newPlayerId: string;
  };
  playerData?: {
    name: string;
    score: number;
    category: string;
    isExistingPlayer: boolean;
  };
  redirectUrl?: string;
}

/**
 * Helper function to check if a player exists by DNI
 */
async function checkPlayerByDNI(dni: string, supabase: any) {
  console.log(`[checkPlayerByDNI] Searching for player with DNI: ${dni}`);
  
  const { data: existingPlayer, error } = await supabase
    .from('players')
    .select('id, first_name, last_name, dni, user_id, score, category_name, is_categorized')
    .eq('dni', dni)
    .maybeSingle();
    
  if (error) {
    console.error(`[checkPlayerByDNI] Error searching player by DNI ${dni}:`, error);
    return { success: false, error: error.message };
  }
  
  console.log(`[checkPlayerByDNI] Found player:`, existingPlayer);
  return { success: true, player: existingPlayer };
}

/**
 * Helper function to link a user to an existing player
 */
async function linkUserToExistingPlayer(playerId: string, userId: string, supabase: any, formData?: FormData) {
  console.log(`[linkUserToExistingPlayer] Linking user ${userId} to player ${playerId}`);
  
  // Prepare update data - always include user_id
  const updateData: any = { user_id: userId };
  
  // If formData is provided, also update additional fields from the registration form
  if (formData) {
    const phone = formData.get('phone') as string | null;
    const gender = formData.get('gender') as string | null;
    const dateOfBirth = formData.get('dateOfBirth') as string | null;
    
    // Only update fields that have values
    if (phone && phone.trim() !== '') {
      updateData.phone = phone;
    }
    
    if (gender && gender.trim() !== '') {
      updateData.gender = gender as 'MALE' | 'SHEMALE' | 'MIXED';
    }
    
    if (dateOfBirth && dateOfBirth.trim() !== '') {
      updateData.date_of_birth = dateOfBirth;
    }
    
    console.log(`[linkUserToExistingPlayer] Updating player with additional data:`, updateData);
  }
  
  const { error } = await supabase
    .from('players')
    .update(updateData)
    .eq('id', playerId);
    
  if (error) {
    console.error(`[linkUserToExistingPlayer] Error linking user to player:`, error);
    return { success: false, error: error.message };
  }
  
  console.log(`[linkUserToExistingPlayer] Successfully linked user ${userId} to player ${playerId} with updated data`);
  return { success: true };
}

/**
 * Helper function to validate player linking compatibility
 */
function validatePlayerLinking(existingPlayer: any, formData: FormData) {
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  
  // Check if names match (case insensitive)
  const firstNameMatch = existingPlayer.first_name?.toLowerCase() === firstName?.toLowerCase();
  const lastNameMatch = existingPlayer.last_name?.toLowerCase() === lastName?.toLowerCase();
  
  console.log(`[validatePlayerLinking] Comparing names:`, {
    existing: `${existingPlayer.first_name} ${existingPlayer.last_name}`,
    provided: `${firstName} ${lastName}`,
    firstNameMatch,
    lastNameMatch
  });
  
  return {
    isValid: firstNameMatch && lastNameMatch,
    existingName: `${existingPlayer.first_name} ${existingPlayer.last_name}`,
    providedName: `${firstName} ${lastName}`
  };
}

/**
 * Function to confirm linking a user account to an existing player
 * Legacy version for backward compatibility
 */
export async function confirmPlayerLinking(playerId: string, tempUserId: string, formData?: FormData): Promise<RegisterResult> {
  const supabase = await createClient();
  
  console.log(`[confirmPlayerLinking] Confirming link between user ${tempUserId} and player ${playerId}`);
  
  try {
    // Double-check that the player doesn't already have a user linked
    const { data: playerCheck, error: checkError } = await supabase
      .from('players')
      .select('id, first_name, last_name, user_id, score, category_name')
      .eq('id', playerId)
      .single();
      
    if (checkError) {
      console.error(`[confirmPlayerLinking] Error checking player:`, checkError);
      return { success: false, error: 'Error al verificar el jugador.' };
    }
    
    if (playerCheck.user_id) {
      console.error(`[confirmPlayerLinking] Player already has user linked:`, playerCheck.user_id);
      return { success: false, error: 'Este jugador ya tiene una cuenta vinculada.' };
    }
    
    // Perform the linking with form data if available
    const linkResult = await linkUserToExistingPlayer(playerId, tempUserId, supabase, formData);
    
    if (!linkResult.success) {
      return { success: false, error: `Error al vincular cuenta: ${linkResult.error}` };
    }
    
    console.log(`[confirmPlayerLinking] Successfully linked user ${tempUserId} to player ${playerId}`);
    
    revalidatePath('/', 'layout');
    
    return {
      success: true,
      matched: true,
      message: `¡Cuenta vinculada exitosamente! Tu perfil de jugador existente ha sido conectado con tu nueva cuenta.`,
      playerData: {
        name: `${playerCheck.first_name} ${playerCheck.last_name}`,
        score: playerCheck.score || 0,
        category: playerCheck.category_name || 'Sin categorizar',
        isExistingPlayer: true
      },
      redirectUrl: '/login',
    };
    
  } catch (error: any) {
    console.error(`[confirmPlayerLinking] Unexpected error:`, error);
    return { success: false, error: `Error inesperado: ${error.message}` };
  }
}

/**
 * Function to confirm linking a user account to an existing player with complete form data
 * This version receives the complete form data to update additional fields like date_of_birth, phone, etc.
 */
export async function confirmPlayerLinkingWithFormData(
  playerId: string, 
  tempUserId: string, 
  formData: FormData
): Promise<RegisterResult> {
  const supabase = await createClient();
  
  console.log(`[confirmPlayerLinkingWithFormData] Confirming link between user ${tempUserId} and player ${playerId} with form data`);
  
  try {
    // Double-check that the player doesn't already have a user linked
    const { data: playerCheck, error: checkError } = await supabase
      .from('players')
      .select('id, first_name, last_name, user_id, score, category_name')
      .eq('id', playerId)
      .single();
      
    if (checkError) {
      console.error(`[confirmPlayerLinkingWithFormData] Error checking player:`, checkError);
      return { success: false, error: 'Error al verificar el jugador.' };
    }
    
    if (playerCheck.user_id) {
      console.error(`[confirmPlayerLinkingWithFormData] Player already has user linked:`, playerCheck.user_id);
      return { success: false, error: 'Este jugador ya tiene una cuenta vinculada.' };
    }
    
    // Perform the linking with complete form data
    const linkResult = await linkUserToExistingPlayer(playerId, tempUserId, supabase, formData);
    
    if (!linkResult.success) {
      return { success: false, error: `Error al vincular cuenta: ${linkResult.error}` };
    }
    
    console.log(`[confirmPlayerLinkingWithFormData] Successfully linked user ${tempUserId} to player ${playerId} with updated data`);
    
    revalidatePath('/', 'layout');
    
    return {
      success: true,
      matched: true,
      message: `¡Cuenta vinculada exitosamente! Tu perfil de jugador existente ha sido conectado con tu nueva cuenta y datos actualizados.`,
      playerData: {
        name: `${playerCheck.first_name} ${playerCheck.last_name}`,
        score: playerCheck.score || 0,
        category: playerCheck.category_name || 'Sin categorizar',
        isExistingPlayer: true
      },
      redirectUrl: '/login',
    };
    
  } catch (error: any) {
    console.error(`[confirmPlayerLinkingWithFormData] Unexpected error:`, error);
    return { success: false, error: `Error inesperado: ${error.message}` };
  }
}

/**
 * Function to reject linking and create a new player instead
 */
export async function rejectPlayerLinking(formData: FormData, tempUserId: string, existingPlayerId?: string): Promise<RegisterResult> {
  const supabase = await createClient();
  
  console.log(`[rejectPlayerLinking] User rejected linking to existing player ${existingPlayerId}`);
  
  try {
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const dni = formData.get('dni') as string | null;
    const phone = formData.get('phone') as string | null;
    const gender = formData.get('gender') as string | null;
    const dateOfBirth = formData.get('dateOfBirth') as string | null;
    
    // Create a temporary/blocked player profile so the user record is complete
    // This will be cleaned up by the admin after resolving the conflict
    const { data: blockedPlayer, error: playerError } = await supabase.from('players').insert({
      first_name: firstName,
      last_name: lastName,
      dni: dni, // Keep original DNI for conflict resolution
      phone: phone,
      gender: gender === '' ? null : (gender as 'MALE' | 'SHEMALE' | 'MIXED'),
      date_of_birth: dateOfBirth === '' ? null : dateOfBirth,
      user_id: tempUserId,
      score: 0,
      is_categorized: false, // Mark as inactive to indicate it's blocked
    }).select('id').single();
    
    if (playerError) {
      console.error(`[rejectPlayerLinking] Error creating blocked player profile:`, playerError);
      return { success: false, error: `Error al crear perfil temporal: ${playerError.message}` };
    }
    
    console.log(`[rejectPlayerLinking] Created blocked player profile ${blockedPlayer.id} for user ${tempUserId}`);
    
    // Register DNI conflict for admin review if there was an existing player
    if (existingPlayerId && dni) {
      console.log(`[rejectPlayerLinking] Registering DNI conflict for admin review`);
      
      const { error: conflictError } = await supabase.from('dni_conflicts').insert({
        dni: dni,
        existing_player_id: existingPlayerId,
        new_player_id: blockedPlayer.id, // Reference the blocked player
        new_user_id: tempUserId,
        status: 'pending'
      });
      
      if (conflictError) {
        console.error(`[rejectPlayerLinking] Error registering DNI conflict:`, conflictError);
      } else {
        console.log(`[rejectPlayerLinking] DNI conflict registered for admin review`);
      }
    }
    
    console.log(`[rejectPlayerLinking] Registration blocked due to DNI conflict rejection`);
    
    return {
      success: false,
      error: 'Registro bloqueado por conflicto de datos. Contacta al administrador para resolver este problema.',
      showConflictReport: true,
      conflictData: existingPlayerId ? {
        dni: dni,
        existingPlayerId: existingPlayerId,
        newPlayerId: blockedPlayer.id
      } : undefined,
    };
    
  } catch (error: any) {
    console.error(`[rejectPlayerLinking] Unexpected error:`, error);
    return { success: false, error: `Error inesperado: ${error.message}` };
  }
}

/**
 * Function to check for DNI conflicts BEFORE creating auth user
 * This prevents creating orphaned auth users
 */
export async function checkDNIConflictBeforeRegistration(formData: FormData): Promise<RegisterResult> {
  const supabase = await createClient();
  
  console.log(`[checkDNIConflictBeforeRegistration] Checking for DNI conflicts before registration`);
  
  try {
    const dni = formData.get('dni') as string | null;
    const role = formData.get('role') as string;
    
    // Only check for PLAYER role
    if (role !== 'PLAYER' || !dni || dni.trim() === '') {
      return { success: true }; // No conflict check needed
    }
    
    // Check if DNI already exists
    const existingPlayerResult = await checkPlayerByDNI(dni, supabase);
    
    if (!existingPlayerResult.success) {
      return { success: false, error: `Error al verificar DNI: ${existingPlayerResult.error}` };
    }
    
    if (!existingPlayerResult.player) {
      return { success: true }; // No conflict, proceed with registration
    }
    
    // DNI conflict found - validate if it could be the same person
    const validation = validatePlayerLinking(existingPlayerResult.player, formData);
    
    if (!validation.isValid) {
      console.log(`[checkDNIConflictBeforeRegistration] DNI exists but names don't match - blocking registration`);
      
      // Register conflict for admin review WITHOUT creating any users
      const { error: conflictError } = await supabase.from('dni_conflicts').insert({
        dni: dni,
        existing_player_id: existingPlayerResult.player.id,
        new_player_id: null, // No new player created
        new_user_id: null, // No new user created
        status: 'pending',
        phone: formData.get('phone') as string || null, // Capture user's phone number
        admin_notes: JSON.stringify({
          conflict_type: 'blocked_before_registration',
          attempted_name: `${formData.get('firstName')} ${formData.get('lastName')}`,
          existing_name: `${existingPlayerResult.player.first_name} ${existingPlayerResult.player.last_name}`,
          email: formData.get('email'),
          phone: formData.get('phone') as string || 'No proporcionado',
          blocked_reason: 'Names do not match existing player - registration blocked before user creation'
        })
      });
      
      if (conflictError) {
        console.error(`[checkDNIConflictBeforeRegistration] Error registering conflict:`, conflictError);
      }
      
      return {
        success: false,
        error: 'Este DNI ya está registrado con un nombre diferente. Contacta al administrador para resolver este conflicto.',
        showConflictReport: true,
        conflictData: {
          dni: dni,
          existingPlayerId: existingPlayerResult.player.id,
          newPlayerId: 'blocked' // Indicates it was blocked before creation
        }
      };
    }
    
    // Names match - offer confirmation
    return {
      success: false, // Don't proceed with normal registration
      requiresConfirmation: true,
      existingPlayer: {
        id: existingPlayerResult.player.id,
        name: `${existingPlayerResult.player.first_name} ${existingPlayerResult.player.last_name}`,
        score: existingPlayerResult.player.score || 0,
        category: existingPlayerResult.player.category_name || 'Sin categorizar',
        dni: existingPlayerResult.player.dni,
        isExistingPlayer: true
      }
    };
    
  } catch (error: any) {
    console.error(`[checkDNIConflictBeforeRegistration] Unexpected error:`, error);
    return { success: false, error: `Error verificando conflictos: ${error.message}` };
  }
}

/**
 * Function to register user and link to existing player in one step
 * This avoids creating temporary users
 */
export async function registerAndLinkToExistingPlayer(formData: FormData, playerId: string): Promise<RegisterResult> {
  const supabase = await createClient();
  
  console.log(`[registerAndLinkToExistingPlayer] Creating user and linking to player ${playerId}`);
  
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    // Basic validation
    if (!email || !password) {
      return { success: false, error: 'Email y contraseña son requeridos.' };
    }
    if (password.length < 6) {
      return { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
    }
    
    // Double-check that the player doesn't already have a user linked
    const { data: playerCheck, error: checkError } = await supabase
      .from('players')
      .select('id, first_name, last_name, user_id, score, category_name')
      .eq('id', playerId)
      .single();
      
    if (checkError) {
      console.error(`[registerAndLinkToExistingPlayer] Error checking player:`, checkError);
      return { success: false, error: 'Error al verificar el jugador.' };
    }
    
    if (playerCheck.user_id) {
      console.error(`[registerAndLinkToExistingPlayer] Player already has user linked:`, playerCheck.user_id);
      return { success: false, error: 'Este jugador ya tiene una cuenta vinculada.' };
    }
    
    // 1. Create auth user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      console.error('[registerAndLinkToExistingPlayer] Supabase auth signUp error:', signUpError);
      return { success: false, error: `Error de autenticación: ${signUpError.message}` };
    }

    const authUser = authData.user;
    if (!authUser) {
      return { success: false, error: 'Error al crear usuario de autenticación.' };
    }
    
    console.log(`[registerAndLinkToExistingPlayer] Auth user created: ${authUser.id}`);
    
    // 2. Create user record in our database
    const { error: userInsertError } = await supabase.from('users').insert({
      id: authUser.id,
      email: authUser.email!,
      role: 'PLAYER',
    });

    if (userInsertError) {
      console.error('[registerAndLinkToExistingPlayer] Error inserting user into users table:', userInsertError);
      // Clean up auth user if database insert fails
      await supabase.auth.admin.deleteUser(authUser.id);
      return { success: false, error: `Error al crear perfil de usuario: ${userInsertError.message}` };
    }
    
    // 3. Link to existing player
    const { error: linkError } = await supabase
      .from('players')
      .update({ user_id: authUser.id })
      .eq('id', playerId);
    
    if (linkError) {
      console.error(`[registerAndLinkToExistingPlayer] Error linking user to player:`, linkError);
      // Clean up user and auth records
      await supabase.from('users').delete().eq('id', authUser.id);
      await supabase.auth.admin.deleteUser(authUser.id);
      return { success: false, error: `Error al vincular cuenta: ${linkError.message}` };
    }
    
    console.log(`[registerAndLinkToExistingPlayer] Successfully linked user ${authUser.id} to player ${playerId}`);
    
    // 4. Sign out the user (they need to log in manually)
    await supabase.auth.signOut();
    
    revalidatePath('/', 'layout');
    
    return {
      success: true,
      matched: true,
      message: `¡Cuenta creada y vinculada exitosamente! Tu perfil de jugador existente ha sido conectado con tu nueva cuenta.`,
      playerData: {
        name: `${playerCheck.first_name} ${playerCheck.last_name}`,
        score: playerCheck.score || 0,
        category: playerCheck.category_name || 'Sin categorizar',
        isExistingPlayer: true
      },
      redirectUrl: '/login',
    };
    
  } catch (error: any) {
    console.error(`[registerAndLinkToExistingPlayer] Unexpected error:`, error);
    return { success: false, error: `Error inesperado: ${error.message}` };
  }
}

export async function register(formData: FormData): Promise<RegisterResult> {
  // const cookieStore = cookies() // Removed, assuming createClient handles cookies internally or doesn't need it explicitly here.
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as 'PLAYER' | 'CLUB' | 'COACH'

  // Basic validation
  if (!email || !password || !role) {
    return { error: 'Email, contraseña y rol son requeridos.', success: false };
  }
  if (password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres.', success: false };
  }

  try {
    // 1. Sign up the user in Supabase Auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // emailRedirectTo: `${origin}/auth/callback`, // Adjust if you have email confirmation
      },
    });

    if (signUpError) {
      console.error('[RegisterAction] Supabase auth signUp error:', signUpError);
      return { error: `Error de autenticación: ${signUpError.message}`, success: false };
    }

    console.log('[RegisterAction] authData from signUp:', JSON.stringify(authData, null, 2));

    if (!authData.user) {
      console.error('[RegisterAction] No user data returned from signUp.');
      return { error: 'No se pudo crear el usuario en autenticación.', success: false };
    }
    
    const authUserId = authData.user.id;

    // 2. Insert into public.users table
    const { data: publicUser, error: publicUserError } = await supabase
      .from('users')
      .insert({
        id: authUserId,
        email: email,
        role: role,
      })
      .select('id') // Select the id of the newly created public user
      .single();

    console.log('[RegisterAction] publicUser insert result:', JSON.stringify({ data: publicUser, error: publicUserError }, null, 2));

    if (publicUserError || !publicUser) {
      console.error('[RegisterAction] Error inserting into public.users:', publicUserError);
      // Attempt to clean up Supabase auth user if public.users insert fails?
      // For now, just return error. Consider cleanup strategy.
      return { error: `Error creando perfil de usuario: ${publicUserError?.message || 'Datos de usuario público no retornados.'}`, success: false };
    }

    const publicUsersTableId = publicUser.id;

    // 3. Insert into role-specific table
    let roleTableError: any = null;

    if (role === 'CLUB') {
      const clubName = formData.get('clubName') as string;
      const address = formData.get('address') as string | null;
      if (!clubName) {
        // Consider cleanup if this fails after user creation
        return { error: 'El nombre del club es requerido.', success: false };
      }
      const { error } = await supabase.from('clubes').insert({
        name: clubName,
        address: address,
        user_id: publicUsersTableId, // Link to public.users table id
      });
      roleTableError = error;
    } else if (role === 'PLAYER') {
      const firstName = formData.get('firstName') as string;
      const lastName = formData.get('lastName') as string;
      const dni = formData.get('dni') as string | null;
      const phone = formData.get('phone') as string | null;
      const gender = formData.get('gender') as string | null;
      const dateOfBirth = formData.get('dateOfBirth') as string | null;

      if (!firstName || !lastName) {
        return { error: 'Nombre y apellido son requeridos para jugadores.', success: false };
      }

      // Check if player exists by DNI (only if DNI is provided)
      if (dni && dni.trim() !== '') {
        console.log(`[register] Checking for existing player with DNI: ${dni}`);
        
        const playerCheckResult = await checkPlayerByDNI(dni.trim(), supabase);
        
        if (!playerCheckResult.success) {
          return { error: `Error al verificar DNI: ${playerCheckResult.error}`, success: false };
        }
        
        if (playerCheckResult.player) {
          const existingPlayer = playerCheckResult.player;
          
          // Check if player already has a user account linked
          if (existingPlayer.user_id) {
            console.log(`[register] Player with DNI ${dni} already has a user account linked`);
            return { 
              error: 'Ya existe una cuenta vinculada a este DNI. Si es tu cuenta, inicia sesión en lugar de registrarte.', 
              success: false 
            };
          }
          
          // Validate that the names match
          const validation = validatePlayerLinking(existingPlayer, formData);
          
          if (!validation.isValid) {
            console.log(`[register] Name mismatch for DNI ${dni}:`, validation);
            return { 
              error: `El nombre proporcionado (${validation.providedName}) no coincide con el registrado para este DNI (${validation.existingName}). Verifica tus datos.`, 
              success: false 
            };
          }
          
          // Found existing player - return for confirmation instead of automatic linking
          console.log(`[register] Found existing player ${existingPlayer.id} for DNI ${dni}, requesting user confirmation`);
          
          return {
            success: true,
            requiresConfirmation: true,
            message: `Encontramos un jugador registrado con este DNI. ¿Es tu perfil?`,
            existingPlayer: {
              id: existingPlayer.id,
              name: validation.existingName,
              score: existingPlayer.score || 0,
              category: existingPlayer.category_name || 'Sin categorizar',
              dni: existingPlayer.dni,
              isExistingPlayer: true
            },
            tempUserId: publicUsersTableId, // Store for later linking
          };
        }
      }
      
      // No existing player found or no DNI provided - create new player
      console.log(`[register] Creating new player for user ${publicUsersTableId}`);
      
      const { error } = await supabase.from('players').insert({
        first_name: firstName,
        last_name: lastName,
        dni: dni,
        phone: phone,
        gender: gender === '' ? null : (gender as 'MALE' | 'SHEMALE' | 'MIXED'),
        date_of_birth: dateOfBirth === '' ? null : dateOfBirth,
        user_id: publicUsersTableId,
        score: 0, // Default score for new player
        is_categorized: false, // New player needs to be categorized when first registering for a tournament
      });
      roleTableError = error;
    } else if (role === 'COACH') {
      const firstName = formData.get('firstName') as string;
      const lastName = formData.get('lastName') as string;
       if (!firstName || !lastName) {
        return { error: 'Nombre y apellido son requeridos para entrenadores.', success: false };
      }
      const { error } = await supabase.from('coaches').insert({
        name: firstName, // coaches table uses 'name' for first_name
        last_name: lastName,
        user_id: publicUsersTableId,
      });
      roleTableError = error;
    }

    if (roleTableError) {
      console.error(`[RegisterAction] Error inserting into ${role} table:`, roleTableError);
      // Consider cleanup strategy for auth.user and public.users entry
      return { error: `Error creando perfil de ${role.toLowerCase()}: ${roleTableError.message}`, success: false };
    }
    
    // Revalidate relevant paths
    revalidatePath('/', 'layout'); // Revalidate all pages or specific ones like /admin/users if you have one

    return {
      success: true,
      message: '¡Registro completado! Serás redirigido al inicio de sesión.',
      redirectUrl: '/login', // Or to a dashboard if auto-login after signup is implemented
    };

  } catch (e: any) {
    console.error('[RegisterAction] Unexpected error:', e);
    return { error: `Error inesperado: ${e.message}`, success: false };
  }
} 