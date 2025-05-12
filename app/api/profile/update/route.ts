import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticación
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    // Obtener datos del cuerpo de la solicitud
    const data = await request.json()
    
    // Ejecutar una consulta SQL raw a través de Supabase
    const { error } = await supabase.rpc('update_user_avatar', {
      user_id: user.id,
      avatar_url: data.avatar_url
    })

    if (error) {
      console.error("Error SQL:", error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: "Perfil actualizado correctamente" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json(
      { error: "Error al actualizar el perfil" },
      { status: 500 }
    )
  }
} 