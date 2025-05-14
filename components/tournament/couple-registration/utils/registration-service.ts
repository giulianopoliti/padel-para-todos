// Import any necessary API functions
import { registerCoupleForTournament } from "@/app/api/tournaments/actions"

/**
 * Register a couple for a tournament
 * @param tournamentId Tournament ID
 * @param player1Id First player ID
 * @param player2Id Second player ID
 * @returns Result object with success flag
 */
export async function registerCouple(tournamentId: string, player1Id: string, player2Id: string) {
  try {
    // Call the API function to register the couple
    const result = await registerCoupleForTournament(tournamentId, player1Id, player2Id)
    
    return result
  } catch (error) {
    console.error("Error registering couple:", error)
    return { success: false, error: "Failed to register couple" }
  }
}

/**
 * Register a new player and create a couple
 * @param tournamentId Tournament ID
 * @param player1Id First player ID
 * @param playerData Player data for the new player
 * @returns Result object with success flag
 */
export async function registerNewPlayerAsCouple(
  tournamentId: string, 
  player1Id: string, 
  playerData: { dni: string, firstName?: string, lastName?: string, phone?: string }
) {
  try {
    // For now, we'll just pass the DNI and let the server-side handle creation
    const result = await registerCoupleForTournament(tournamentId, player1Id, playerData.dni)
    
    return result
  } catch (error) {
    console.error("Error registering couple with new player:", error)
    return { success: false, error: "Failed to register couple with new player" }
  }
} 