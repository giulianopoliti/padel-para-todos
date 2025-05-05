import type { Tournament, Category, AmericanMatch, LargeMatch, Couple, User } from "@/types"

// Esta interfaz ahora solo contiene datos básicos del torneo
export interface BaseTournamentProps {
  tournament: Tournament
  category: Category | null
  matches: AmericanMatch[] | LargeMatch[]
  couples: Couple[]
  user: User | null
  isRegistered: boolean
  loading: boolean
  isAuthenticated: boolean
  onRegister: () => void
  // Eliminamos: user, isRegistered, loading, isAuthenticated, router, onRegister
}

export interface MatchTableProps {
  matches: AmericanMatch[] | LargeMatch[]
  formatDate: (dateString: string) => string
}

// Eliminamos RegistrationButtonProps por ahora, ya que no se usará
// export interface RegistrationButtonProps { ... } 