import { getPlayersMale, getCategories } from "../api/users"
import RankingClient from "./ranking-client"

export const revalidate = 3600 // Revalidate data every hour

export default async function RankingPage() {
  // Fetch initial data on the server
  const [players, categories] = await Promise.all([
    getPlayersMale(),
    getCategories()
  ])


  return <RankingClient initialPlayers={players} initialCategories={categories} />
}

