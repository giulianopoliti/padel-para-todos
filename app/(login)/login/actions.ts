"use server"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"

export async function login(formData: FormData) {
  try {
    console.log("[SERVER] Login attempt started")
    
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const role = formData.get("role") as string

    console.log(`[SERVER] Form data - Email: ${email}, Role: ${role}, Password length: ${password?.length}`)

    if (!email || !password || !role) {
      console.log("[SERVER] Missing fields in login attempt")
      return { error: "Todos los campos son requeridos" }
    }

    console.log(`[SERVER] Login attempt for email: ${email}, role: ${role}`)
    
    const supabase = await createClient()

    // Single authentication call - let Supabase handle user verification
    console.log("[SERVER] Attempting to sign in with password")
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    console.log(`[SERVER] SignIn result - Error: ${error?.message || 'None'}, User: ${data?.user?.id || 'None'}`)

    if (error) {
      console.error("[SERVER] Auth error details:", {
        message: error.message,
        status: error.status,
        name: error.name
      })
      
      // Return user-friendly error messages
      if (error.message.includes("Invalid login credentials")) {
        return { error: "Credenciales incorrectas. Verifica tu email y contraseña." }
      }
      if (error.message.includes("Email not confirmed")) {
        return { error: "Por favor confirma tu email antes de iniciar sesión." }
      }
      if (error.message.includes("Too many requests")) {
        return { error: "Demasiados intentos. Espera unos minutos antes de intentar de nuevo." }
      }
      
      return { error: "Error de autenticación. Intenta de nuevo más tarde." }
    }

    const user = data.user
    if (!user) {
      console.error("[SERVER] No user returned from signInWithPassword")
      return { error: "Error de autenticación - usuario no encontrado" }
    }

    console.log(`[SERVER] Authentication successful for user: ${user.id}`)
    
    // Quick role verification - simplified version
    try {
      const { data: userData, error: userRoleError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single()

      if (userRoleError) {
        console.error("[SERVER] Role verification error:", userRoleError.message)
        // Don't logout user, let them continue and fix role later if needed
        return { 
          success: true, 
          redirectUrl: "/edit-profile",
          message: "Por favor completa tu perfil"
        }
      }

      if (!userData || !userData.role) {
        console.log("[SERVER] User role not set, redirecting to profile completion")
        return { 
          success: true, 
          redirectUrl: "/edit-profile",
          message: "Por favor completa tu perfil"
        }
      }

      // Role verification - only check if role is set
      if (userData.role !== role) {
        console.log(`[SERVER] Role mismatch: DB Role=${userData.role} vs Selected Role=${role}`)
        
        // Logout automatically to prevent partial authentication state
        console.log("[SERVER] Performing automatic logout due to role mismatch")
        await supabase.auth.signOut()
        
        // Return error message
        return { 
          error: `Esta cuenta está registrada como ${userData.role}. Por favor selecciona el tipo de usuario correcto.`
        }
      }

      // Success - redirect to dashboard
      console.log("[SERVER] Login successful, redirecting to dashboard")
      return { 
        success: true, 
        redirectUrl: "/dashboard",
        message: "Inicio de sesión exitoso"
      }

    } catch (dbError) {
      console.error("[SERVER] Database error when checking role:", dbError)
      // Don't fail login for DB errors, let user continue
      return { 
        success: true, 
        redirectUrl: "/dashboard",
        message: "Inicio de sesión exitoso"
      }
    }
    
  } catch (e) {
    console.error("[SERVER] Critical error in login action:", e)
    return { error: "Error crítico al procesar la solicitud. Intenta de nuevo más tarde." }
  }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  
  // Redirect happens outside any try/catch
  redirect("/login")
}

