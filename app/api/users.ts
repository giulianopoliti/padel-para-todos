import { createClient } from "@/utils/supabase/server";
import { supabase } from "@/lib/supabase";
import { Player, Couple, Category } from "@/types";

export async function getPlayersMale() {
    const { data, error } = await supabase
        .from("players")
        .select("*")
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
            club_id: rawPlayer.club_id,
            gender: rawPlayer.gender || "MALE"
        };
    }) || [];

    // Log mapped players
    console.log("Mapped players:", players);
    console.log("Number of players:", players.length);
    
    return players;
}

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

export async function createPlayer(player: Player) {
    const { data, error } = await supabase
        .from("players")
        .insert(player)
        .select()
        
    return { data, error }
}
