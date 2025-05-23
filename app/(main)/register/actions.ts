"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { EmailOtpType } from "@supabase/supabase-js"
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function register(formData: FormData) {
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
      const { error } = await supabase.from('players').insert({
        first_name: firstName,
        last_name: lastName,
        dni: dni,
        phone: phone,
        gender: gender === '' ? null : (gender as 'MALE' | 'SHEMALE' | 'MIXED'),
        date_of_birth: dateOfBirth === '' ? null : dateOfBirth,
        user_id: publicUsersTableId,
        score: 0, // Default score for new player
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