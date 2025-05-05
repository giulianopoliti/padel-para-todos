"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { EmailOtpType } from "@supabase/supabase-js"

export async function register(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email y contraseña son requeridos" }
  }

  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres" }
  }

  const supabase = await createClient()

  // Attempt to sign up the user
  const { error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Optional: Email confirmation can be enabled in Supabase project settings
      // emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`,
    },
  })

  if (signUpError) {
    console.error("[SERVER REGISTER] SignUp Error:", signUpError.message)
    // Provide a more user-friendly error message
    if (signUpError.message.includes("User already registered")) {
       return { error: "Este email ya está registrado. Intenta iniciar sesión." }
    }
    if (signUpError.message.includes("Password should be at least 6 characters")) {
       return { error: "La contraseña debe tener al menos 6 caracteres." }
    }
    return { error: `Error al registrar: ${signUpError.message}` }
  }

  // If sign up is successful, Supabase might handle confirmation flow.
  // Let's try to add the user to our public.users table immediately.
  // Note: This assumes the user ID from auth matches the public.users table ID.
  // We get the user *after* signUp to ensure it was created in auth.
  
  // Re-authenticate to get the newly created user ID securely
  const { data: { user }, error: getUserError } = await supabase.auth.getUser();
    
  if (getUserError || !user) {
      console.error("[SERVER REGISTER] Error getting user after sign up:", getUserError?.message);
      // Even if we can't add to users table now, signup in auth succeeded.
      // Inform the user to check email if confirmation is needed, or login.
       return { 
         success: true, 
         message: "Registro inicial completado. Revisa tu email si se requiere confirmación, o intenta iniciar sesión.",
         redirectUrl: "/login" // Optionally redirect immediately
       };
  }

  // Add user to public.users table with role null and profile incomplete
  const { error: insertError } = await supabase
    .from("users")
    .insert({
        id: user.id, // Use the ID from the authenticated user
        auth_id: user.id, // Also store auth_id explicitly if needed
        email: user.email,
        role: null // Set role to null initially
     });

  if (insertError) {
    console.error("[SERVER REGISTER] Error inserting user into public.users:", insertError.message);
    // Even if profile insert fails, auth succeeded. Maybe let them log in and try completion later?
    // Or display a specific error asking them to contact support.
       return { 
         success: false, // Indicate failure because profile setup is crucial here
         error: "Registro completado, pero hubo un problema al inicializar tu perfil. Por favor, contacta soporte.",
       };
  }

  console.log("[SERVER REGISTER] User registered and added to public.users, needs profile completion:", user.id);

  // Redirect user to complete their profile
  return { 
     success: true, 
     message: "¡Registro exitoso! Serás redirigido para completar tu perfil.",
     redirectUrl: "/complete-profile" // Redirect to profile completion page
   };
} 