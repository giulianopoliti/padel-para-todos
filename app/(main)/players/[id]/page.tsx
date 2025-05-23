import { createClient } from "@/utils/supabase/server"
import { useParams } from "next/navigation"
export default async function PlayerPage({ params }: { params: { id: string } }) {
    const supabase = await createClient()
    const { data: player, error } = await supabase.from('players').select('*').eq('id', params.id).single()
    return (
        <div>
            <h1>Player Page</h1>
            <p>{player?.first_name} {player?.last_name}</p>
        </div>
    )
}