"use client"

import { useState, useEffect, useCallback } from "react"
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
import { startTournament } from "@/app/api/tournaments/actions"; // Import start tournament action
import { Button } from "@/components/ui/button"; // Import Button for potential use in handler
import ClubRegisterPlayer from "@/components/tournament/club-register-player"; // Import the new component
import ClubRegisterCouple from "@/components/tournament/club-register-couple"; // Import the couples component
import { supabase } from "@/utils/supabase/client"; // Import the client-side Supabase client

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
  const [refreshCounter, setRefreshCounter] = useState(0); // Add a counter to force refresh
  const { user: contextUser, userDetails, loading: contextLoading } = useUser();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  const router = useRouter()
  
  if (!tournament) {
    return <TournamentNotFound onBackToTournaments={() => router.push("/tournaments")} />
  }

  // Determinar si el usuario actual es dueño del club del torneo
  const isClubOwner = contextUser && userDetails?.role === "CLUB" && userDetails?.club_id === tournament.club?.id;
  
  // Determinar si el torneo ya comenzó
  const isTournamentActive = tournament.status !== "NOT_STARTED";

  // Función para recargar los datos de jugadores inscritos directamente
  const reloadPlayerData = async () => {
    if (isReloading) return; // Evitar recargas simultáneas
    
    setIsReloading(true);
    console.log("⏳ Recargando datos de jugadores inscritos...");
    
    try {
      // Usar el cliente importado
      if (!supabase) {
        console.error("❌ Cliente Supabase no disponible");
        return;
      }
      
      // 1. Obtener inscripciones del torneo
      const { data: inscriptionsData, error: inscriptionsError } = await supabase
        .from('inscriptions')
        .select('id, player_id, couple_id, tournament_id')
        .eq('tournament_id', tournament.id);
      
      if (inscriptionsError) {
        console.error("❌ Error al obtener inscripciones:", inscriptionsError);
        return;
      }
      
      // 2. Extraer IDs de jugadores individuales
      const singlePlayerIds = inscriptionsData
        .filter((insc: any) => !insc.couple_id && insc.player_id)
        .map((insc: any) => insc.player_id);
      
      console.log(`✅ Encontrados ${singlePlayerIds.length} jugadores individuales`);
      
      // 3. Obtener datos de jugadores individuales
      if (singlePlayerIds.length > 0) {
        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select('id, first_name, last_name')
          .in('id', singlePlayerIds);
        
        if (playersError) {
          console.error("❌ Error al obtener datos de jugadores:", playersError);
        } else {
          console.log(`✅ Datos actualizados de ${playersData.length} jugadores`);
          setSinglePlayers(playersData || []);
        }
      } else {
        // No hay jugadores individuales
        setSinglePlayers([]);
      }
      
      setInscriptions(inscriptionsData as Inscription[] || []);
      
      // Forzar actualización de la UI
      router.refresh();
      
    } catch (error) {
      console.error("❌ Error al recargar datos:", error);
    } finally {
      setIsReloading(false);
    }
  };

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

  // Add handler for starting tournament
  const handleStartTournament = async () => {
    if (!tournament || !isClubOwner) {
      console.error("Cannot start tournament: Not authorized or missing tournament data");
      return;
    }
    
    if (window.confirm("¿Está seguro que desea iniciar el torneo? Una vez iniciado, no se podrán registrar más jugadores.")) {
      try {
        const result = await startTournament(tournament.id);
        if (result.success) {
          // Redirect to the pairing page
          router.push(`/tournaments/${tournament.id}/pairing`);
        }
      } catch (error) {
        console.error("Error al iniciar torneo:", error);
        alert("No se pudo iniciar el torneo. Por favor, intente nuevamente.");
      }
    }
  };

  // Add a handler to refresh player list after registration
  const handlePlayerRegistered = () => {
    console.log("🔄 Jugador registrado, actualizando datos...");
    setRefreshCounter(prev => prev + 1);
    
    // Pequeño retraso para asegurar que los datos del servidor estén actualizados
    setTimeout(() => {
      reloadPlayerData();
    }, 800);
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

  // Añadir efecto de depuración y refresco cuando cambia refreshCounter
  useEffect(() => {
    console.log("Tournament details loaded or refreshed:");
    console.log("Single Players:", singlePlayers);
    console.log("Inscriptions:", inscriptions);
    console.log("Couples:", couples);
    
    // Recargar los datos cuando refreshCounter cambia
    if (refreshCounter > 0) {
      console.log(`🔄 Refrescando datos (contador: ${refreshCounter})`);
      // El reloadPlayerData ya se llama en handlePlayerRegistered
    }
  }, [singlePlayers, inscriptions, couples, refreshCounter, router]);

  if (SelectedTournamentComponent) {
    return (
      <div className="space-y-4">
        {/* Registration button section */}
        <div className="flex justify-between p-4 bg-white rounded-lg shadow-sm">
          <div>
            {/* Start Tournament Button - solo visible para dueños de club cuando el torneo no ha iniciado */}
            {isClubOwner && !isTournamentActive && (
              <Button 
                onClick={handleStartTournament} 
                className="bg-blue-600 hover:bg-blue-700"
              >
                Comenzar Torneo
              </Button>
            )}
          </div>
          
          <div>
            {contextUser ? (
              <Button 
                onClick={handleRegister} 
                disabled={isRegistering || isTournamentActive} 
                className="bg-green-600 hover:bg-green-700"
              >
                {isRegistering ? "Procesando..." : "Inscribirme"}
              </Button>
            ) : (
              <Button 
                onClick={() => router.push('/login')} 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isTournamentActive}
              >
                Iniciar sesión para inscribirme
              </Button>
            )}
          </div>
        </div>

        {/* Debug info */}
        <div className="p-4 bg-gray-100 text-sm rounded">
          <p>Debug info:</p>
          <p>Single players count: {singlePlayers?.length || 0}</p>
          <p>Inscriptions count: {inscriptions?.length || 0}</p> 
          <p>Couples count: {couples?.length || 0}</p>
          <p>Tournament status: {tournament.status}</p>
        </div>

        {/* Sección de torneo */}
        <SelectedTournamentComponent {...tournamentProps} />
        
        {/* Sección de registro de jugadores por el club */}
        {isClubOwner && !isTournamentActive && (
          <ClubRegisterPlayer 
            tournamentId={tournament.id}
            isClubOwner={isClubOwner}
            isTournamentActive={isTournamentActive}
            onPlayerRegistered={handlePlayerRegistered}
          />
        )}
        
        {/* Sección de registro de parejas por el club */}
        {isClubOwner && !isTournamentActive && (
          <ClubRegisterCouple 
            tournamentId={tournament.id}
            isClubOwner={isClubOwner}
            isTournamentActive={isTournamentActive}
            onCoupleRegistered={handlePlayerRegistered}
          />
        )}
        
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