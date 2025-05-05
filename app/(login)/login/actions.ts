"use server"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"

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
      
      // Verify role - fetch only the role
      try {
        const { data: userData, error: userRoleError } = await supabase
          .from("users")
          .select("role") // Select only the role column
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

        // Check if role is not set
        const roleSet = userData.role !== null;

        console.log(`[SERVER] User data: role=${userData.role}, selectedRole=${role}`);

        // If role is not set, force profile completion
        if (!roleSet) {
          console.log("[SERVER] User role not set. Login allowed, redirecting to profile completion.");
          return { success: true, redirectUrl: "/complete-profile" }; 
        }

        // Role is set, NOW enforce role match
        if (userData.role !== role) {
          console.error(`[SERVER] Role mismatch for completed profile: DB Role=${userData.role} vs Selected Role=${role}`) // Log mismatch
          await supabase.auth.signOut() // Log out the user
          return { error: `Esta cuenta está registrada como ${userData.role}, no como ${role}.` } // Informative error
        }

        // Role matches, proceed to home
        console.log("[SERVER] Role verified, authentication successful")
        return { success: true, redirectUrl: "/home" } 

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

