// app/login/actions.ts
'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as string
  
  const supabase = await createClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) {
    return { error: error.message }
  }
  
  // Verificar el rol
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', data.user.id)
    .single()
  
  if (userError || userData.role !== role) {
    await supabase.auth.signOut()
    return { error: `Esta cuenta no tiene permisos de ${role}` }
  }
  
  // Redirigir según el rol
  if (role === 'CLUB') {
    redirect('/dashboard/club')
  } else if (role === 'PLAYER') {
    redirect('/dashboard/player')
  } else {
    redirect('/dashboard/coach')
  }
}

export async function register(formData: FormData) {
  try {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    console.log("[SERVER] Received registration request for:", email)
    
    const supabase = await createClient()
    
    // 1. Registrar en auth.users
    console.log("[SERVER] Attempting to register user in auth.users")
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    
    if (error) {
      console.error("[SERVER] Error registering user:", error.message)
      return { error: error.message }
    }

    console.log("[SERVER] User registered in auth.users successfully, user id:", data.user?.id)

    if (data.user) {
      // Verificar si el usuario ya existe en la tabla users
      console.log("[SERVER] Checking if user exists in users table")
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error("[SERVER] Error checking user existence:", checkError.message)
        return { error: 'Error al verificar el usuario: ' + checkError.message }
      }

      // Si el usuario no existe en la tabla users, crearlo
      if (!existingUser) {
        console.log("[SERVER] User not found in users table, creating record")
        const { error: userError } = await supabase.from('users').insert([
          {
            id: data.user.id,
            email,
            role: 'PLAYER', // Por defecto será player
          }
        ])
        const { error: playerError } = await supabase.from('players').insert([
          {
            id: "",
            user_id: data.user.id,
          }
        ])
        
        if (userError) {
          console.error("[SERVER] Error creating user record:", userError.message)
          return { error: userError.message }
        }
        console.log("[SERVER] User record created successfully")
      } else {
        console.log("[SERVER] User already exists in users table")
      }

      // En lugar de redirigir, devolvemos éxito con la ruta para completar el perfil
      console.log("[SERVER] Registration successful, returning success response")
      return { 
        success: true, 
        message: 'Registro exitoso. Serás redirigido para completar tu perfil.',
        redirectUrl: '/dashboard/player/complete-profile',
        userId: data.user.id
      }
    }
    
    console.log("[SERVER] Registration process completed, user needs to verify email")
    return { 
      success: true, 
      message: 'Registro exitoso. Por favor, verifica tu correo electrónico para confirmar tu cuenta.' 
    }
  } catch (e) {
    console.error("[SERVER] Unexpected error during registration:", e)
    return { error: "Error inesperado durante el registro. Por favor, inténtalo de nuevo." }
  }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}