import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables")
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Función para verificar la sesión actual (útil para debugging)
export async function checkSession() {
  const { data, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error('Error checking session:', error)
    return null
  }
  
  return data.session
}

// Función para iniciar sesión y luego verificar si fue exitosa
export async function signInAndVerify(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    // Verificamos inmediatamente si la sesión se estableció
    const session = await checkSession()
    return { success: !!session, session, user: data.user }
  } catch (error) {
    console.error('Error in signInAndVerify:', error)
    return { success: false, session: null, user: null }
  }
}

