export type Role = "CLUB" | "JUGADOR" | "ENTRENADOR"

export type Category = {
  id: string
  name: string // "2da", "3ra", "4ta", etc.
}

export type Player = {
  id: string
  firstName: string
  lastName: string
  score: number
  category: string // Category name, calculated automatically based on score, foreign key to category table
  preferredHand?: "LEFT" | "RIGHT" // Mano hábil
  racket?: string // Paleta
  preferredSide?: "FOREHAND" | "BACKHAND" // Lado del que juega
  createdAt: string
  club_id: string
  gender: "MALE" | "FEMALE"
}

export type Tournament = {
  id: string
  name: string
  clubId: string
  createdAt: string
  category: string // Category ID
  gender: string
  status: "NOT_STARTED" | "IN_PROGRESS" | "FINISHED"
  startDate: string
  endDate: string
}

export type Couple = {
  id: string
  player1Id: string
  player2Id: string
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
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED"
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

