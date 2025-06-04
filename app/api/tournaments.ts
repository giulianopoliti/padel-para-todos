import { supabase } from "@/utils/supabase/client";
import { Category, Tournament } from "@/types";

export async function getTournaments() {
    try {
        const { data, error } = await supabase
            .from("tournaments")
            .select(`
                *,
                club:clubes (
                    id,
                    name,
                    address,
                    cover_image_url
                )
            `);

        if (error) {
            console.error("Error fetching tournaments:", error);
            return [];
        }

        // Map the raw data to our Tournament type
        const tournaments = data?.map((rawTournament): Tournament => {
            return {
                id: rawTournament.id,
                name: rawTournament.name,
                club: {
                    ...rawTournament.club,
                    image: rawTournament.club?.cover_image_url // Map cover_image_url to image for compatibility
                },
                createdAt: rawTournament.created_at,
                startDate: rawTournament.start_date,
                endDate: rawTournament.end_date,
                category: rawTournament.category,
                gender: rawTournament.gender || "MALE",
                status: rawTournament.status || "NOT_STARTED",
                type: rawTournament.type || "AMERICAN",
                pre_tournament_image_url: rawTournament.pre_tournament_image_url,
                price: rawTournament.price,
                description: rawTournament.description,
                address: rawTournament.address,
                time: rawTournament.time,
                prize: rawTournament.prize,
                maxParticipants: rawTournament.max_participants,
                currentParticipants: rawTournament.current_participants
            };
        }) || [];

        return tournaments;
    } catch (error) {
        console.error("Error in getTournaments:", error);
        return [];
    }
}

export async function getCategories() {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name")
  
    if (error) {
      console.error("Error fetching categories:", error)
      return []
    }
  
    return data as Category[]
}

export async function getWeeklyWinners() {
    try {
        // Calculate date 7 days ago
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        // Get tournaments finished in the last 7 days with winner information
        const { data: tournaments, error } = await supabase
            .from('tournaments')
            .select('id, name, winner_image_url, end_date, winner_id')
            .eq('status', 'FINISHED')
            .not('winner_id', 'is', null)
            .not('winner_image_url', 'is', null)
            .gte('end_date', weekAgo.toISOString())
            .order('end_date', { ascending: false })
            .limit(6);

        if (error || !tournaments) {
            console.error('Error fetching weekly winners:', error);
            return [];
        }

        // Get winner details for each tournament
        const winnersWithDetails = [];
        for (const tournament of tournaments) {
            const { data: couple, error: coupleError } = await supabase
                .from('couples')
                .select(`
                    id,
                    player1:players!couples_player1_id_fkey(first_name, last_name),
                    player2:players!couples_player2_id_fkey(first_name, last_name)
                `)
                .eq('id', tournament.winner_id)
                .single();

            if (!coupleError && couple) {
                const player1 = Array.isArray(couple.player1) ? couple.player1[0] : couple.player1;
                const player2 = Array.isArray(couple.player2) ? couple.player2[0] : couple.player2;

                winnersWithDetails.push({
                    id: tournament.id,
                    tournamentName: tournament.name,
                    winnerImageUrl: tournament.winner_image_url,
                    endDate: tournament.end_date,
                    winner: {
                        id: couple.id,
                        player1Name: `${player1?.first_name || ''} ${player1?.last_name || ''}`.trim(),
                        player2Name: `${player2?.first_name || ''} ${player2?.last_name || ''}`.trim(),
                    }
                });
            }
        }

        return winnersWithDetails;
    } catch (error) {
        console.error('Unexpected error fetching weekly winners:', error);
        return [];
    }
}

export async function getTournamentById(id: string) {
    try {
        const { data: tournamentData, error: tournamentError } = await supabase
        .from('tournaments')
        .select(`
        *,
        club:clubes (
        id,
        name,
        address
      )
    `)
        .eq('id', id)
        .single()
    
            // Map the raw data to our Tournament type
            const tournament: Tournament = {
                id: tournamentData.id,
                name: tournamentData.name,
                club: tournamentData.club,
                createdAt: tournamentData.created_at,
                startDate: tournamentData.start_date,
                endDate: tournamentData.end_date,
                category: tournamentData.category,
                gender: tournamentData.gender || "MALE",
                status: tournamentData.status || "NOT_STARTED",
                type: tournamentData.type || "AMERICAN"
            };
    
            return tournament;
        } catch (error) {
            console.error("Error in getTournamentById:", error);
            return null;
        }
    }
    
