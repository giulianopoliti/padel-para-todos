import { getTournamentById } from "@/app/api/tournaments"
import { supabase } from "@/lib/supabase"
import type { Tournament, Match, Category, Player, AmericanMatch, LargeMatch, Couple } from "@/types"
import TournamentDetailsClient from "./tournament-details-client"

export const revalidate = 3600 // Revalidate data every hour

export default async function TournamentDetailsPage({ params }: { params: { id: string } }) {
  const {id} = params

  // Fetch tournament details
  const tournament = await getTournamentById(id)
  if (!tournament) {
    return null // The client component will handle the not found state
  }

  // Fetch category
  const { data: categoryData } = await supabase
    .from("categories")
    .select("*")
    .eq("id", tournament.category)
    .single()

  // Fetch matches for this tournament
  const { data: matchesData } = await supabase
    .from("matches")
    .select("*")
    .eq("tournament_id", id)
    .order("created_at", { ascending: true })
    console.log("matchesData", matchesData);

  // Fetch players for this tournament
  const { data: playersData } = await supabase
    .from("couples")
    .select("*")


  return (
    <TournamentDetailsClient
      initialTournament={tournament}
      initialCategory={categoryData as Category | null}
      initialMatches={matchesData as Match[] || []}
      initialCouples={playersData as Couple[] || []}
    />
  )
}

