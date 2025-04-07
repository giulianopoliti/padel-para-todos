export type Role = "CLUB" | "JUGADOR" | "ENTRENADOR"

export type Category = {
  id: string
  name: string // "2da", "3ra", "4ta", etc.
}

export type Player = {
  id: string
  userId?: string // If the player has an account
  firstName: string
  lastName: string
  score: number
  category: string // Category ID, calculated automatically based on score
  dominantHand?: "left" | "right" // Mano hábil
  paddle?: string // Paleta
  preferredSide?: "forehand" | "backhand" // Lado del que juega
  createdAt: string
  createdBy: string // Club ID that created the player
}

export type Tournament = {
  id: string
  name: string
  clubId: string
  startDate: string
  endDate: string
  category: string // Category ID
  status: "not_started" | "in_progress" | "finished"
}

export type Team = {
  id: string
  player1Id: string
  player2Id: string
  tournamentId?: string // Optional, if the team is for a specific tournament
}

export type Match = {
  id: string
  tournamentId: string
  team1Id: string
  team2Id: string
  team1Score?: number[]
  team2Score?: number[]
  date: string
  round: string // "final", "semifinal", "quarterfinal", "round1", etc.
  status: "scheduled" | "completed" | "cancelled"
  courtNumber?: number
  category: string // Category ID
}

export type User = {
  id: string
  email: string
  role: Role
  playerId?: string // If the user is a player
  clubId?: string // If the user is a club
  coachId?: string // If the user is a coach
}

