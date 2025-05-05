"use client"

import { useState, useEffect } from "react"
import AmericanTournament from "@/components/tournament/american-tournament"
import EliminationTournament from "@/components/tournament/elimination-tournament"
import TournamentNotFound from "@/components/tournament/not-found"
import type { Tournament, Match, Category, AmericanMatch, LargeMatch, Couple, User } from "@/types"
import type { BaseTournamentProps } from "@/components/tournament/tournament-types"
import { useRouter } from 'next/navigation'
import { useUser } from "@/contexts/user-context"

interface TournamentDetailsClientProps {
  initialTournament: Tournament | null
  initialCategory: Category | null
  initialMatches: Match[]
  initialCouples: Couple[]
}

// --- Estrategia: Mapa de Tipos de Torneo a Componentes ---
// Definimos qué componente usar para cada tipo de torneo.
// La clave es el string 'tournament.type', el valor es el componente React.
// Los componentes deben aceptar las props definidas en BaseTournamentProps.
const tournamentComponents: { [key: string]: React.ComponentType<BaseTournamentProps> } = {
  AMERICAN: AmericanTournament as React.ComponentType<BaseTournamentProps>, // Casteamos para asegurar compatibilidad
  ELIMINATION: EliminationTournament as React.ComponentType<BaseTournamentProps>,
  // FUTURO: Si añades 'SWISS', solo necesitas añadirlo aquí:
  // SWISS: SwissTournamentComponent,
};
// ----------------------------------------------------------

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
  // Mantenemos estado local para los datos del torneo
  const [tournament, setTournament] = useState<Tournament | null>(initialTournament)
  const [matches, setMatches] = useState<Match[]>(initialMatches)
  const [couples, setCouples] = useState<Couple[]>(initialCouples)
  const [category, setCategory] = useState<Category | null>(initialCategory)
  const [user, setUser] = useState<User | null>(null)
  const { user: contextUser, loading: contextLoading } = useUser();
  const [isRegistered, setIsRegistered] = useState(false)

  const router = useRouter()
  
  // Si no hay torneo, mostrar componente de "no encontrado"
  if (!tournament) {
    return <TournamentNotFound onBackToTournaments={() => router.push("/tournaments")} />
  }
  useEffect(() => {
    setUser(contextUser)
  }, [contextUser])

  // Si no hay torneo, mostrar componente de "no encontrado"
  if (!tournament) {
    return <TournamentNotFound onBackToTournaments={() => router.push("/tournaments")} />
  }

  // Obtenemos el componente (estrategia) correcto desde nuestro mapa
  const SelectedTournamentComponent = tournamentComponents[tournament.type];

  // Preparamos las props comunes para la estrategia seleccionada
  const tournamentProps: BaseTournamentProps = {
      tournament,
      category,
      // Casteamos matches según el tipo, aunque los componentes ya lo hacían internamente.
      // Podrías simplificar esto si BaseTournamentProps usa un tipo más genérico para matches.
      matches: tournament.type === "AMERICAN" ? matches as AmericanMatch[] : matches as LargeMatch[],
      couples,
      user,
      isAuthenticated: true,
      loading: false,
      onRegister: () => {},
      isRegistered
  };

  // Si encontramos un componente para ese tipo, lo renderizamos
  if (SelectedTournamentComponent) {
    return (
      <div className="space-y-4">
        {/* Información del usuario y botón de inscripción */}
        <div className="bg-white p-4 rounded-lg shadow">
          {(() => {
            console.log("[Debug Inscripción] Estado:", { contextLoading, user: user ? user.email : null });
            if (contextLoading) {
              console.log("[Debug Inscripción] Renderizando: Cargando...");
              return <p>Cargando información de usuario...</p>;
            } else if (user) {
              console.log("[Debug Inscripción] Renderizando: Usuario Logueado");
              return (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Usuario: {user.email}</p>
                    {isRegistered ? 
                      <p className="text-green-600">Ya estás inscrito en este torneo</p> : 
                      <p>No estás inscrito en este torneo</p>
                    }
                  </div>
                  {!isRegistered && (
                    <button 
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                      onClick={() => {
                        // Implementar lógica de inscripción aquí
                        console.log("Inscribiendo usuario al torneo");
                        // Aquí podrías implementar la lógica de registro
                        // y luego actualizar el estado isRegistered
                      }}
                    >
                      Inscribirme
                    </button>
                  )}
                </div>
              );
            } else {
              console.log("[Debug Inscripción] Renderizando: No Logueado");
              return (
                <div className="flex justify-between items-center">
                  <p>No has iniciado sesión</p>
                  <button 
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
                    onClick={() => router.push('/login')}
                  >
                    Iniciar sesión
                  </button>
                </div>
              );
            }
          })()}
        </div>

        {/* Componente del torneo */}
        <SelectedTournamentComponent {...tournamentProps} />
      </div>
    );
  }

  // Fallback si el tipo de torneo no tiene un componente definido
  return (
    <div>
      <p className="text-red-500">Error: Tipo de torneo '{tournament.type}' no soportado.</p>
      {/* Podrías mostrar detalles básicos aquí si quieres */}
    </div>
  );
} 