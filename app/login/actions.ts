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
  } else if (role === 'JUGADOR') {
    redirect('/dashboard/player')
  } else {
    redirect('/dashboard/coach')
  }
}

export async function register(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  const supabase = await createClient()
  
  // 1. Registrar en auth.users
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  
  if (error) {
    return { error: error.message }
  }

  if (data.user) {
    // Verificar si el usuario ya existe en la tabla users
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', data.user.id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      return { error: 'Error al verificar el usuario: ' + checkError.message }
    }

    // Si el usuario no existe en la tabla users, crearlo
    if (!existingUser) {
      const { error: userError } = await supabase.from('users').insert([
        {
          id: data.user.id,
          email,
          role: 'JUGADOR', // Por defecto será jugador
        }
      ])
      
      if (userError) {
        return { error: userError.message }
      }
    }

    // En lugar de redirigir, devolvemos éxito con la ruta para completar el perfil
    return { 
      success: true, 
      message: 'Registro exitoso. Serás redirigido para completar tu perfil.',
      redirectUrl: '/dashboard/player/complete-profile',
      userId: data.user.id
    }
  }
  
  return { 
    success: true, 
    message: 'Registro exitoso. Por favor, verifica tu correo electrónico para confirmar tu cuenta.' 
  }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}