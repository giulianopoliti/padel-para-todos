import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  try {
    const { data: matches, error } = await supabase
      .from("matches")
      .select(`
        *,
        zone_info:zone_id(name),
        couple1:couples!matches_couple1_id_fkey(
          id,player1_id,player2_id,
          player1_details:players!couples_player1_id_fkey(id,first_name,last_name),
          player2_details:players!couples_player2_id_fkey(id,first_name,last_name)
        ),
        couple2:couples!matches_couple2_id_fkey(
          id,player1_id,player2_id,
          player1_details:players!couples_player1_id_fkey(id,first_name,last_name),
          player2_details:players!couples_player2_id_fkey(id,first_name,last_name)
        )
      `)
      .eq("tournament_id", params.id)
      .order("created_at");

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Procesar y filtrar los partidos
    const processedMatches = matches
      .filter(m => m.couple1 && m.couple2) // Filtrar BYEs
      .map(m => ({
        ...m,
        zone_name: m.zone_info?.name,
        couple1_player1_name: `${m.couple1?.player1_details?.first_name||""} ${m.couple1?.player1_details?.last_name||""}`.trim(),
        couple1_player2_name: `${m.couple1?.player2_details?.first_name||""} ${m.couple1?.player2_details?.last_name||""}`.trim(),
        couple2_player1_name: `${m.couple2?.player1_details?.first_name||""} ${m.couple2?.player1_details?.last_name||""}`.trim(),
        couple2_player2_name: `${m.couple2?.player2_details?.first_name||""} ${m.couple2?.player2_details?.last_name||""}`.trim()
      }))
      .filter(m => 
        m.couple1_player1_name && m.couple1_player2_name &&
        m.couple2_player1_name && m.couple2_player2_name &&
        !m.couple1_player1_name.includes('BYE') && !m.couple1_player2_name.includes('BYE') &&
        !m.couple2_player1_name.includes('BYE') && !m.couple2_player2_name.includes('BYE')
      );

    return NextResponse.json({ success: true, matches: processedMatches });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || "Error inesperado" },
      { status: 500 }
    );
  }
} 