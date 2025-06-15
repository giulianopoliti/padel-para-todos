import { getPlayersMale, getCategories } from "@/app/api/users"
import { getMultiplePlayersWeeklyPoints } from "@/app/api/tournaments/actions"
import RankingClient from "./ranking-client"

export const revalidate = 3600 // Revalidate data every hour

export default async function RankingPage() {
  // Fetch initial data on the server
  const [players, categories] = await Promise.all([
    getPlayersMale(),
    getCategories()
  ])

  // Get weekly points for all players
  const playerIds = players.map(player => player.id);
  const weeklyPointsResult = await getMultiplePlayersWeeklyPoints(playerIds);
  const weeklyPoints = weeklyPointsResult.success ? weeklyPointsResult.weeklyPoints : {};

  return <RankingClient 
    initialPlayers={players} 
    initialCategories={categories} 
    weeklyPoints={weeklyPoints}
  />
}

