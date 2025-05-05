// app/api/mcp/query/route.ts
import { supabase } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { question, role } = await req.json()

  // Aquí validás la intención de la IA antes de permitir acceso a datos
  if (!role || !question) {
    return NextResponse.json({ error: "Falta información" }, { status: 400 })
  }

  // Ejemplo simple: la IA quiere obtener los torneos de un club
  if (question.includes("listar torneos") && role === "CLUB") {
    const { data, error } = await supabase
      .from("tournaments")
      .select("*")
      .eq("club_id", "123") // Aquí podrías usar un ID real del contexto

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data })
  }

  // Si no entendés la intención, devolvés un mensaje neutral
  return NextResponse.json({ message: "No se pudo entender la solicitud." })
}
