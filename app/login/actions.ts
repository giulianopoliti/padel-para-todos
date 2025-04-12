"use server"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"

export async function login(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const role = formData.get("role") as string

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Use getUser() for secure authentication verification
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: "Error de autenticación" }
  }

  // Verificar el rol
  const { data: userData, error: userRoleError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (userRoleError || userData.role !== role) {
    await supabase.auth.signOut()
    return { error: `Esta cuenta no tiene permisos de ${role}` }
  }

  // Redirigir al dashboard principal
  redirect("/dashboard")
}
