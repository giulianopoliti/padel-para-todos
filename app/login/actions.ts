"use server"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function login(formData: FormData) {
  try {
    console.log("[SERVER] Login attempt started")
    
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const role = formData.get("role") as string

    if (!email || !password || !role) {
      console.log("[SERVER] Missing fields in login attempt")
      return { error: "Todos los campos son requeridos" }
    }

    console.log(`[SERVER] Login attempt for email: ${email}, role: ${role}`)
    
    let supabase;
    try {
      supabase = await createClient()
      console.log("[SERVER] Supabase client created successfully")
    } catch (e) {
      console.error("[SERVER] Error creating Supabase client:", e)
      return { error: "Error de conexión con el servicio" }
    }

    // Authentication flow
    console.log("[SERVER] Attempting to sign in with password")
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("[SERVER] Auth error:", error.message)
      return { error: error.message }
    }

    console.log("[SERVER] Password authentication successful, verifying user")
    
    // Use getUser() for secure authentication verification
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        console.error("[SERVER] User verification error:", userError.message)
        return { error: "Error de autenticación" }
      }

      if (!user) {
        console.error("[SERVER] No user returned from getUser()")
        return { error: "Error de autenticación - usuario no encontrado" }
      }

      console.log(`[SERVER] User verified, checking role for user ID: ${user.id}`)
      
      // Verify role - using minimal data selection
      try {
        const { data: userData, error: userRoleError } = await supabase
          .from("users")
          .select("role") // Only select the role field, not everything
          .eq("id", user.id)
          .single()

        if (userRoleError) {
          console.error("[SERVER] Role verification error:", userRoleError.message)
          await supabase.auth.signOut()
          return { error: "Error verificando permisos de usuario" }
        }

        if (!userData) {
          console.error("[SERVER] No user data found in users table")
          await supabase.auth.signOut()
          return { error: "Perfil de usuario no encontrado" }
        }

        console.log(`[SERVER] User role from database: ${userData.role}, selected role: ${role}`)
        
        if (userData.role !== role) {
          console.error(`[SERVER] Role mismatch: ${userData.role} vs ${role}`)
          await supabase.auth.signOut()
          return { error: `Esta cuenta no tiene permisos de ${role}` }
        }

        console.log("[SERVER] Role verified, authentication successful")
        
        // Return success to redirect on the client side
        // This avoids the need for a server redirect which might be causing the resource issue
        return { success: true }
      } catch (dbError) {
        console.error("[SERVER] Database error when checking role:", dbError)
        await supabase.auth.signOut()
        return { error: "Error en la base de datos al verificar el rol" }
      }
    } catch (authError) {
      console.error("[SERVER] Error in auth verification:", authError)
      return { error: "Error en la verificación de autenticación" }
    }
  } catch (e) {
    console.error("[SERVER] Critical error in login action:", e)
    return { error: "Error crítico al procesar la solicitud" }
  }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  
  // Redirect happens outside any try/catch
  redirect("/login")
}

