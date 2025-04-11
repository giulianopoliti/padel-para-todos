import { supabase } from "@/lib/supabase"

import type { Tournament, Category } from "@/types"
import TournamentsClient from "./tournaments-client"
export const revalidate = 3600 // Revalidate data every hour
import { getTournaments, getCategories } from "../api/tournaments"



export default async function TournamentsPage() {
  // Fetch initial data on the server
  const [tournaments, categories] = await Promise.all([
    getTournaments(),
    getCategories()
  ])

  return <TournamentsClient initialTournaments={tournaments} initialCategories={categories} />
}

