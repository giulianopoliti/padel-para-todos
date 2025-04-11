import { supabase } from "@/lib/supabase";
import { Category, Tournament } from "@/types";

export async function getTournaments() {
    try {
        const { data, error } = await supabase
            .from("tournaments")
            .select("*");

        if (error) {
            console.error("Error fetching tournaments:", error);
            return [];
        }

        // Log raw data from database
        console.log("Raw data from database:", data);

        // Map the raw data to our Tournament type
        const tournaments = data?.map((rawTournament): Tournament => {
            // Log individual tournament data before mapping
            console.log("Raw tournament data:", rawTournament);
            
            return {
                id: rawTournament.id,
                name: rawTournament.name,
                clubId: rawTournament.club_id,      // DB: club_id -> TS: clubId
                createdAt: rawTournament.created_at, // DB: created_at -> TS: createdAt
                startDate: rawTournament.start_date, // DB: start_date -> TS: startDate
                endDate: rawTournament.end_date,     // DB: end_date -> TS: endDate
                category: rawTournament.category,
                gender: rawTournament.gender || "MALE", // Default to MALE if not specified
                status: rawTournament.status || "NOT_STARTED" // Default to NOT_STARTED if not specified
            };
        }) || [];

        // Log mapped tournaments
        console.log("Mapped tournaments:", tournaments);
        console.log("Number of tournaments:", tournaments.length);
        
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
