import { createClient } from '@/utils/supabase/server'
import TournamentDetailsClient from './tournament-details-client'
import type { Tournament, Match, Category } from '@/types'
import type { Database } from '@/database.types';
import type { Tables } from '@/database.types';

// Define base Couple type from generated types
type Couple = Database["public"]["Tables"]["couples"]["Row"];
type PlayerInfo = { id: string; first_name: string | null; last_name: string | null };

// Define the processed couple type used during data fetching in this component
// Note: This is defined locally. The client component uses its own definition or the one from tournament-types.ts
type ProcessedCouple = Couple & {
    player_1_info: PlayerInfo | null;
    player_2_info: PlayerInfo | null;
};

// Define Inscription type
type Inscription = Tables<"inscriptions">;

// Define el tipo para las props, incluyendo params
type TournamentDetailsPageProps = {
  params: { id: string };
};

// Asegúrate de que la función acepte las props con params
export default async function TournamentDetailsPage({ params }: TournamentDetailsPageProps) {
  // Accede a id a través de params.id
  const tournamentId = params.id;
  console.log(` Server   Fetching data for tournament ID: ${tournamentId}`);

  if (!tournamentId) {
    // Considera mostrar un error o redirigir si no hay ID
    return <div>Error: ID de torneo no proporcionado.</div>;
  }

  const supabase = await createClient();

  // Fetch tournament details
  const { data: tournamentData, error: tournamentError } = await supabase
    .from('tournaments')
    .select(`
      *,
      club:club_id (
        id,
        name,
        address
      )
    `)
    .eq('id', tournamentId)
    .single();

  // Fetch category details (assuming a relation or separate query needed)
  // Placeholder: Adjust query based on your actual schema
  const categoryName = tournamentData?.category; // Example: get category_id from tournament
  let categoryData: Category | null = null;
  if (categoryName) {
      const { data: catData, error: categoryError } = await supabase
          .from('categories')
          .select('*')
          .eq('name', categoryName)
          .single();
      if (categoryError) console.error(" Server   Error fetching category:", categoryError);
      else categoryData = catData as Category;
  }

  // Fetch matches
  const { data: matchesData, error: matchesError } = await supabase
    .from('matches')
    .select('*')
    .eq('tournament_id', tournamentId);
  console.log(' Server  matchesData', matchesData)

    // Fetch inscriptions for the tournament without trying to join couples
    const { data: inscriptionsRawData, error: inscriptionsErrorRaw } = await supabase
        .from('inscriptions')
        .select('id, player_id, couple_id, tournament_id') // Select necessary fields
        .eq('tournament_id', tournamentId);

    if (inscriptionsErrorRaw) {
        console.error(" Server   Error fetching raw inscriptions:", inscriptionsErrorRaw);
        // Handle error appropriately - maybe return default empty array
    }
    const inscriptionsDataRaw = (inscriptionsRawData || []) as Inscription[];

    // Now let's fetch couples separately if needed
    let couplesData: ProcessedCouple[] = [];
    const coupleIds = inscriptionsDataRaw
        .filter(insc => insc.couple_id)
        .map(insc => insc.couple_id)
        .filter((id): id is string => id !== null);

    if (coupleIds.length > 0) {
        const { data: couplesRawData, error: couplesError } = await supabase
            .from('couples')
            .select(`
                id,
                player_1,
                player_2
            `)
            .in('id', coupleIds);

        if (couplesError) {
            console.error(" Server   Error fetching couples:", couplesError);
        } else if (couplesRawData) {
            // Now fetch player data for these couples
            const playerIds = couplesRawData.flatMap(couple => [
                couple.player_1, 
                couple.player_2
            ]).filter((id): id is string => id !== null);

            if (playerIds.length > 0) {
                const { data: playersData, error: playersError } = await supabase
                    .from('players')
                    .select('id, first_name, last_name')
                    .in('id', playerIds);

                if (playersError) {
                    console.error(" Server   Error fetching couple player details:", playersError);
                } else if (playersData) {
                    // Create a map of players for easy lookup
                    const playerMap = new Map<string, PlayerInfo>();
                    playersData.forEach(player => {
                        playerMap.set(player.id, player);
                    });

                    // Build processed couples data
                    couplesData = couplesRawData.map(couple => {
                        const player1Info = couple.player_1 ? playerMap.get(couple.player_1) || null : null;
                        const player2Info = couple.player_2 ? playerMap.get(couple.player_2) || null : null;

                        return {
                            id: couple.id,
                            created_at: new Date().toISOString(), // Default creation date
                            player_1: couple.player_1,
                            player_2: couple.player_2,
                            player_1_info: player1Info,
                            player_2_info: player2Info
                        };
                    });
                }
            }
        }
    }

  // Identify single player inscriptions and fetch their names
  const singlePlayerIds = inscriptionsDataRaw
      .filter(insc => !insc.couple_id && insc.player_id)
      .map(insc => insc.player_id);
      
  let singlePlayersData: PlayerInfo[] = [];
  if (singlePlayerIds.length > 0) {
    const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('id, first_name, last_name')
        .in('id', singlePlayerIds);

    if (playersError) {
        console.error(" Server   Error fetching single player names:", playersError);
    } else {
        singlePlayersData = (playersData || []) as PlayerInfo[];
    }
  }

  // Handle potential errors during data fetching
  if (tournamentError) {
    console.error(" Server   Error fetching tournament:", tournamentError);
    // Decide how to handle error: show error message, redirect, etc.
    return <div>Error al cargar el torneo.</div>;
  }
    if (matchesError) {
        console.error(" Server   Error fetching matches:", matchesError);
        // Potentially return an error or default matches
    }


  return (
    <TournamentDetailsClient
      initialTournament={tournamentData as Tournament | null}
      initialCategory={categoryData}
      initialMatches={(matchesData as Match[]) || []}
      initialCouples={couplesData || []}
      initialInscriptions={inscriptionsDataRaw}
      initialSinglePlayers={singlePlayersData}
    />
  );
}

