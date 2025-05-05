"use client"

import { useState, useEffect } from "react"
import AmericanTournament from "@/components/tournament/american-tournament"
import EliminationTournament from "@/components/tournament/elimination-tournament"
import TournamentNotFound from "@/components/tournament/not-found"
import RegisteredPlayers from "@/components/tournament/registered-players"
import type { Tournament, Match, Category, AmericanMatch, LargeMatch } from "@/types"
import type { User as SupabaseAuthUser } from '@supabase/supabase-js';
import type { Database } from "@/database.types"; // Import Database
import type { Tables } from "@/database.types";
type Inscription = Tables<"inscriptions">;
import type { BaseTournamentProps } from "@/components/tournament/tournament-types" // Keep this for now
import { useRouter } from 'next/navigation'
import { useUser } from "@/contexts/user-context"
import { registerPlayerForTournament } from "./actions"; // Import the server action
import { Button } from "@/components/ui/button"; // Import Button for potential use in handler

// Define base Couple type from generated types
type Couple = Database["public"]["Tables"]["couples"]["Row"];
type PlayerInfo = { id: string; first_name: string | null; last_name: string | null };

// Define the processed couple type used in this client and passed down
// We might need to export this or redefine in tournament-types.ts later
 type ProcessedCouple = Couple & {
    player_1_info: PlayerInfo | null;
    player_2_info: PlayerInfo | null;
};

interface TournamentDetailsClientProps {
  initialTournament: Tournament | null
  initialCategory: Category | null
  initialMatches: Match[]
  initialCouples: ProcessedCouple[] // Expect ProcessedCouple
  initialInscriptions: Inscription[] // Add initial inscriptions
  initialSinglePlayers: PlayerInfo[]; // Add prop for single players
}

// --- Estrategia: Mapa de Tipos de Torneo a Componentes ---
// Adjust the type assertion for the components if needed, though BaseTournamentProps update should handle it
const tournamentComponents: { [key: string]: React.ComponentType<any> } = { // Use any temporarily
  AMERICAN: AmericanTournament, 
  ELIMINATION: EliminationTournament,
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
  initialCouples, 
  initialInscriptions,
  initialSinglePlayers // Receive single players
}: TournamentDetailsClientProps) {
  // Mantenemos estado local para los datos del torneo
  const [tournament, setTournament] = useState<Tournament | null>(initialTournament)
  const [matches, setMatches] = useState<Match[]>(initialMatches)
  const [couples, setCouples] = useState<ProcessedCouple[]>(initialCouples) // Use ProcessedCouple[] state
  const [category, setCategory] = useState<Category | null>(initialCategory)
  const [inscriptions, setInscriptions] = useState<Inscription[]>(initialInscriptions); // Add state for inscriptions
  const [singlePlayers, setSinglePlayers] = useState<PlayerInfo[]>(initialSinglePlayers); // Add state
  const { user: contextUser, userDetails, loading: contextLoading } = useUser();
  const [isRegistering, setIsRegistering] = useState(false);

  const router = useRouter()
  
  if (!tournament) {
    return <TournamentNotFound onBackToTournaments={() => router.push("/tournaments")} />
  }

  const SelectedTournamentComponent = tournamentComponents[tournament.type];

  // Define the registration handler
  const handleRegister = async () => {
    if (!contextUser || !tournament) {
        console.error("Cannot register: User or tournament data missing.");
        alert("Error: No se pudo obtener la información del usuario o torneo.");
        return;
    }
    
    setIsRegistering(true); // Set loading state
    console.log(`Attempting registration for user ${contextUser.id} in tournament ${tournament.id}`);

    try {
        const result = await registerPlayerForTournament(tournament.id);
        alert(result.message); // Show result message to user

        if (result.success) {
            console.log("Registration successful via action.");
        }
    } catch (error) {
        console.error("Error calling registration action:", error);
        alert("Ocurrió un error inesperado durante la inscripción.");
    } finally {
        setIsRegistering(false); // Unset loading state regardless of outcome
    }
  };

  // Pass props down - remove isRegistered
  const tournamentProps = {
      tournament,
      category,
      matches,
      couples, 
      singlePlayers, 
      user: contextUser,
      isAuthenticated: !!contextUser,
      loading: contextLoading || isRegistering, 
      onRegister: handleRegister, // Pass the handler (will likely be simplified/moved)
  };

  // Añadir efecto de depuración
  useEffect(() => {
    console.log("Tournament details loaded:");
    console.log("Single Players:", singlePlayers);
    console.log("Inscriptions:", inscriptions);
    console.log("Couples:", couples);
  }, [singlePlayers, inscriptions, couples]);

  if (SelectedTournamentComponent) {
    return (
      <div className="space-y-4">
        {/* Registration button section */}
        <div className="flex justify-end p-4 bg-white rounded-lg shadow-sm">
          {contextUser ? (
            <Button 
              onClick={handleRegister} 
              disabled={isRegistering} 
              className="bg-green-600 hover:bg-green-700"
            >
              {isRegistering ? "Procesando..." : "Inscribirme"}
            </Button>
          ) : (
            <Button 
              onClick={() => router.push('/login')} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              Iniciar sesión para inscribirme
            </Button>
          )}
        </div>

        {/* Debug info */}
        <div className="p-4 bg-gray-100 text-sm rounded">
          <p>Debug info:</p>
          <p>Single players count: {singlePlayers?.length || 0}</p>
          <p>Inscriptions count: {inscriptions?.length || 0}</p> 
          <p>Couples count: {couples?.length || 0}</p>
        </div>

        {/* Sección de torneo */}
        <SelectedTournamentComponent {...tournamentProps} />
        
        {/* Sección de jugadores inscritos - con condición extra */}
        <div className="mt-8">
          <RegisteredPlayers 
            singlePlayers={singlePlayers || []} 
            isLoading={contextLoading || isRegistering} 
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-red-500">Error: Tipo de torneo '{tournament.type}' no soportado.</p>
    </div>
  );
} 