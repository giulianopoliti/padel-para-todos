import type { Tournament, Category, AmericanMatch, LargeMatch, Couple } from "@/types"

export interface TournamentDetailsProps {
  tournament: Tournament
  category: Category | null
  matches: AmericanMatch[] | LargeMatch[]
  couples: Couple[]
  user: any
  isRegistered: boolean
  loading: boolean
  router: any
  onRegister: () => void
}

export interface MatchTableProps {
  matches: AmericanMatch[] | LargeMatch[]
  formatDate: (dateString: string) => string
}

export interface RegistrationButtonProps {
  tournament: Tournament
  category: Category | null
  user: any
  isRegistered: boolean
  isRegistering?: boolean
  loading: boolean
  router: any
  onRegister: () => void
  formatDate: (dateString: string) => string
} 