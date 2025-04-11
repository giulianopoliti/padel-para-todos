import { supabase } from "@/lib/supabase";
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
                    address
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
                club: rawTournament.club,
                createdAt: rawTournament.created_at,
                startDate: rawTournament.start_date,
                endDate: rawTournament.end_date,
                category: rawTournament.category,
                gender: rawTournament.gender || "MALE",
                status: rawTournament.status || "NOT_STARTED",
                type: rawTournament.type || "AMERICAN"
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
    
