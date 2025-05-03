"use client"

import { useState, useEffect } from "react"
import { useTournamentRegistration } from "@/hooks/use-tournament-registration"
import AmericanTournament from "@/components/tournament/american-tournament"
import EliminationTournament from "@/components/tournament/elimination-tournament"
import TournamentNotFound from "@/components/tournament/not-found"
import type { Tournament, Match, Category, AmericanMatch, LargeMatch, Couple } from "@/types"

interface TournamentDetailsClientProps {
  initialTournament: Tournament | null
  initialCategory: Category | null
  initialMatches: Match[]
  initialCouples: Couple[]
}

/**
 * Componente cliente para mostrar los detalles de un torneo
 * Se encarga de manejar el estado y renderizar el tipo de torneo correcto
 */
export default function TournamentDetailsClient({
  initialTournament,
  initialCategory,
  initialMatches,
  initialCouples
}: TournamentDetailsClientProps) {
  // Estado local
  const [tournament, setTournament] = useState<Tournament | null>(initialTournament)
  const [matches, setMatches] = useState<Match[]>(initialMatches)
  const [couples, setCouples] = useState<Couple[]>(initialCouples)
  const [category, setCategory] = useState<Category | null>(initialCategory)
  
  // Hook personalizado para manejar la lógica de registro
  const {
    user,
    userLoading,
    isRegistered,
    isRegistering,
    router,
    handleRegister
  } = useTournamentRegistration(tournament)

  // Logs para depuración
  useEffect(() => {
    console.log("======================= ESTADO DE AUTENTICACIÓN =======================")
    console.log("[TournamentDetailsClient] User:", user);
    console.log("[TournamentDetailsClient] User Loading:", userLoading);
    console.log("[TournamentDetailsClient] Is Registered:", isRegistered);
    console.log("======================================================================")
  }, [user, userLoading, isRegistered]);

  // Si no hay torneo, mostrar componente de "no encontrado"
  if (!tournament) {
    return <TournamentNotFound onBackToTournaments={() => router.push("/tournaments")} />
  }

  // Renderizar el tipo de torneo correspondiente
  if (tournament.type === "AMERICAN") {
    return (
      <AmericanTournament
        tournament={tournament}
        category={category}
        matches={matches as AmericanMatch[]}
        couples={couples}
        user={user}
        isRegistered={isRegistered}
        loading={userLoading}
        router={router}
        onRegister={handleRegister}
      />
    )
  }

  // Por defecto, renderizar torneo de eliminación
  return (
    <EliminationTournament
      tournament={tournament}
      category={category}
      matches={matches as LargeMatch[]}
      couples={couples}
      user={user}
      isRegistered={isRegistered}
      loading={userLoading}
      router={router}
      onRegister={handleRegister}
    />
  )
} 