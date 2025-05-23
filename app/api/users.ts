import { createClient } from "@/utils/supabase/server";
import { supabase } from "@/utils/supabase/client";
import { Player, Couple, Category, Role } from "@/types";
import { User } from "@supabase/supabase-js";


export async function getPlayersMale() {
    const { data, error } = await supabase
        .from("players")
        .select(`
            *,
            clubes (
                name
            )
        `)
        .eq("gender", "MALE")
        .order("score", { ascending: false });

    if (error) {
        console.error("Error fetching players:", error);
        return [];
    }
    
    // Log raw data from database
    console.log("Raw data from database:", data);

    // Map the raw data to our Player type
    const players = data?.map((rawPlayer): Player => {
        // Log individual player data before mapping
        console.log("Raw player data:", rawPlayer);
        
        return {
            id: rawPlayer.id,
            firstName: rawPlayer.first_name,    // DB: first_name -> TS: firstName
            lastName: rawPlayer.last_name,      // DB: last_name -> TS: lastName
            score: rawPlayer.score,
            category: rawPlayer.category,
            preferredHand: rawPlayer.preferred_hand,  // DB: preferred_hand -> TS: preferredHand
            racket: rawPlayer.racket,
            preferredSide: rawPlayer.preferred_side,  // DB: preferred_side -> TS: preferredSide
            createdAt: rawPlayer.created_at,    // DB: created_at -> TS: createdAt
            club_name: rawPlayer.clubes?.name || "Sin club",  // Usamos el nombre del club del join
            gender: rawPlayer.gender || "MALE"
        };
    }) || [];

    // Log mapped players
    console.log("Mapped players:", players);
    console.log("Number of players:", players.length);
    
    return players;
}
/*
export async function getPlayersFemale() {
    const { data, error } = await supabase
        .from("players")
        .select("*")
        .eq("gender", "FEMALE")
        .order("score", { ascending: false });

    if (error) {
        console.error("Error fetching players:", error);
        return [];
    }

    // Map the raw data to our Player type
    const players = data?.map((rawPlayer): Player => ({
        id: rawPlayer.id,
        firstName: rawPlayer.first_name,
        lastName: rawPlayer.last_name,
        score: rawPlayer.score,
        category: rawPlayer.category,
        preferredHand: rawPlayer.preferred_hand,
        racket: rawPlayer.racket,
        preferredSide: rawPlayer.preferred_side,
        createdAt: rawPlayer.created_at,
        club_id: rawPlayer.club_id,
        gender: rawPlayer.gender || "FEMALE"
    })) || [];

    return players;
}
*/
export async function getCouples() {
    const { data, error } = await supabase
        .from("couples")
        .select("*");

    if (error) {
        console.error("Error fetching couples:", error);
        return [];
    }

    return data as Couple[];
}

export async function getCategories() {
    const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

    if (error) {
        console.error("Error fetching categories:", error);
        return [];
    }

    return data as Category[];
}

export async function completeProfile(player: Player) {
    const { data, error } = await supabase
        .from("players")
        .insert(player)
        .select()
}

export const getUser = async (): Promise<User | null> => {
    const supabase = await createClient();
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      console.error("Error fetching user:", error);
      return null;
    }
  };
  

  export const getUserRole = async (): Promise<Role | null> => {
    const supabase = await createClient();
    const user = await getUser();
    
    if (!user) {
      console.log("No user ID available, user might be logged out");
      return null;
    }
  
    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
  
    if (error) {
      console.error("Error fetching user role:", error);
      return null;
    }
  
    return data.role as Role;
  };


  export async function getUserByDni(dni: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("dni", dni);

    if (error) {
      console.error("Error fetching user by DNI:", error);
      return null;
    }

    return data;
  }


  export async function getClubById(clubId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("clubes")
      .select("*")
      .eq("id", clubId)
      .single();
  
    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`Club with ID ${clubId} not found.`);
        return null;
      }
      console.error("Error fetching club by ID:", error);
      return null;
    }

    return data;
  }
