import type { Database } from '@/database.types';

type MatchStatus = Database["public"]["Enums"]["match_status"];

export type Role = "CLUB" | "PLAYER" | "COACH"
export type Round = "ZONE" | "32VOS" | "16VOS" | "8VOS" | "4TOS" | "SEMIFINAL" | "FINAL"
export type Category = {
  name: string // "2da", "3ra", "4ta", etc.
  lower_range: number
  upper_range: number
}


export type Club = {
  id: string
  name: string
  address: string;
  cover_image_url?: string | null
  image?: string // For compatibility with components that expect image field
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
  club_name: string
  gender: "MALE" | "FEMALE"
  profileImage?: string // Profile image URL
}

export type PlayerDTO = {
  id: string
  first_name: string
  last_name: string
  dni: string,
  score: number
}

export type Tournament = {
  id: string
  name: string
  club: Club
  createdAt: string
  category: string // Category ID
  gender: string
  status: "NOT_STARTED" | "IN_PROGRESS" | "FINISHED"
  type: "AMERICAN" | "LONG"
  startDate: string
  endDate: string
  pre_tournament_image_url?: string | null
  price?: number | null
  description?: string
  address?: string
  time?: string
  prize?: string
  maxParticipants?: number
  currentParticipants?: number
}

export type Couple = {
  id: string
  player_1: string
  player_2: string
}

export type MatchResult = {
  sets: {
    setNumber: number;
    player1Score: number;
    player2Score: number;
  }[];
  winner: string;
};

export type AmericanMatchResult = {
  games: {
    gameNumber: number;
    couple1Score: number;
    couple2Score: number;
  }[];
  winner: string;
};

export type LargeMatchResult = {
  sets: {
    setNumber: number;
    couple1Score: number;
    couple2Score: number;
  }[];
  tiebreak?: {
    couple1Score: number;
    couple2Score: number;
  };
  winner: string;
};

export interface BaseMatch {
  id: string;
  tournament_id: string;
  couple_1: Couple;
  couple_2: Couple;
  created_at: string;
  round: Round;
  status: MatchStatus; // Uses: PENDING, IN_PROGRESS, FINISHED, CANCELED
  court?: string | null;
  date?: string; // Adding date field since it's used in the table
  // Optional result fields (games or sets won by each couple)
  result_couple1?: string | null;
  result_couple2?: string | null;
}

export interface AmericanMatch extends BaseMatch {
  type: "AMERICAN";
  result_couple_1?: AmericanMatchResult;
  result_couple_2?: AmericanMatchResult;
}

export interface LargeMatch extends BaseMatch {
  type: "LARGE";
  result_couple_1?: LargeMatchResult;
  result_couple_2?: LargeMatchResult;
}

export type Match = AmericanMatch | LargeMatch;

export type User = {
  id: string
  email: string
  role: Role
  playerId?: string // If the user is a player
  clubId?: string // If the user is a club
  coachId?: string // If the user is a coach
  avatar_url?: string // User profile avatar URL
  auth_id?: string
  created_at?: string
}

// 🚀 TIPO OPTIMIZADO: Detalles completos del usuario con IDs de rol específicos
export interface DetailedUserDetails extends User {
  player_id?: string | null;
  club_id?: string | null;
  coach_id?: string | null;
  player_status?: string | null; // Para manejar el estado del jugador (active/inactive)
}

export type Zone = {
  id: string
  name: string
  description?: string
  created_at: string
  couples: Couple[]
}


