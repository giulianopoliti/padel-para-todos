"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"

export async function registerPlayerForTournament(tournamentId: string) {
  try {
    const supabase = await createClient()

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        message: "Debes iniciar sesión para inscribirte en un torneo.",
      }
    }

    // Verificar si el usuario ya tiene un perfil de jugador
    const { data: playerData, error: playerError } = await supabase
      .from("players")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (playerError && playerError.code !== "PGRST116") {
      console.error("Error al verificar perfil de jugador:", playerError)
      return {
        success: false,
        message: "Error al verificar tu perfil de jugador.",
      }
    }

    if (!playerData) {
      return {
        success: false,
        message: "Necesitas completar tu perfil de jugador antes de inscribirte.",
      }
    }

    // Verificar si el jugador ya está inscrito
    const { data: existingInscription, error: inscriptionError } = await supabase
      .from("inscriptions")
      .select("id")
      .eq("tournament_id", tournamentId)
      .eq("player_id", playerData.id)

    if (inscriptionError) {
      console.error("Error al verificar inscripción existente:", inscriptionError)
      return {
        success: false,
        message: "Error al verificar si ya estás inscrito.",
      }
    }

    if (existingInscription && existingInscription.length > 0) {
      return {
        success: false,
        message: "Ya estás inscrito en este torneo.",
      }
    }

    // Verificar si el torneo está abierto para inscripciones
    const { data: tournamentData, error: tournamentError } = await supabase
      .from("tournaments")
      .select("status")
      .eq("id", tournamentId)
      .single()

    if (tournamentError) {
      console.error("Error al verificar estado del torneo:", tournamentError)
      return {
        success: false,
        message: "Error al verificar el estado del torneo.",
      }
    }

    if (tournamentData.status !== "NOT_STARTED") {
      return {
        success: false,
        message: "Este torneo ya no acepta inscripciones.",
      }
    }

    // Crear inscripción
    const { data: newInscription, error: createError } = await supabase
      .from("inscriptions")
      .insert([
        {
          tournament_id: tournamentId,
          player_id: playerData.id,
        },
      ])
      .select()

    if (createError) {
      console.error("Error al crear inscripción:", createError)
      return {
        success: false,
        message: "Error al procesar tu inscripción. Por favor, intenta nuevamente.",
      }
    }

    // Revalidar la ruta para actualizar los datos
    revalidatePath(`/tournaments/${tournamentId}`)

    return {
      success: true,
      message: "¡Te has inscrito correctamente en el torneo!",
    }
  } catch (error) {
    console.error("Error inesperado en registerPlayerForTournament:", error)
    return {
      success: false,
      message: "Ocurrió un error inesperado. Por favor, intenta nuevamente.",
    }
  }
}
