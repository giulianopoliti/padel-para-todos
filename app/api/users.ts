"use server"

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



  export async function getClubes() {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("clubes")
      .select("*");

    if (error) {
      console.error("Error fetching clubes:", error);
      return [];
    }

    console.log("Clubes:", data);

    return data;
  }
  
  export async function getPlayersByClubId(clubId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("club_id", clubId);

    if (error) {
      console.error("Error fetching players by club ID:", error);
      return [];
    }

    return data;
  }

  // =================== CLUB FUNCTIONS ===================
  
  /**
   * Get all clubs with their services
   */
  export async function getClubesWithServices() {
    const supabase = await createClient();
    
    try {
      // First get all clubs
      const { data: clubs, error: clubsError } = await supabase
        .from("clubes")
        .select("id, name, address, instagram, courts, opens_at, closes_at, cover_image_url, gallery_images")
        .order("name");

      if (clubsError) {
        console.error("Error fetching clubs:", clubsError);
        return [];
      }

      if (!clubs || clubs.length === 0) {
        return [];
      }

      // Get services for each club
      const clubsWithServices = await Promise.all(
        clubs.map(async (club) => {
          try {
            const { data: services, error: servicesError } = await supabase
              .from("services_clubes")
              .select(`
                services (
                  id,
                  name
                )
              `)
              .eq("club_id", club.id);

            if (servicesError) {
              console.error(`Error fetching services for club ${club.id}:`, servicesError);
            }

            // Get average rating and review count
            const { data: reviews, error: reviewsError } = await supabase
              .from("reviews")
              .select("score")
              .eq("club_id", club.id);

            if (reviewsError) {
              console.error(`Error fetching reviews for club ${club.id}:`, reviewsError);
            }

            const reviewCount = reviews?.length || 0;
            const averageRating = reviewCount > 0 && reviews
              ? reviews.reduce((sum, review) => sum + (review.score || 0), 0) / reviewCount 
              : 0;

            // Return plain object with only serializable data
            return {
              id: club.id,
              name: club.name || null,
              address: club.address || null,
              instagram: club.instagram || null,
              courts: club.courts || 0,
              opens_at: club.opens_at || null,
              closes_at: club.closes_at || null,
              services: services?.map(s => s.services).filter(Boolean) || [],
              rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
              reviewCount: reviewCount,
              coverImage: club.cover_image_url || null,
              galleryImages: Array.isArray(club.gallery_images) ? club.gallery_images : []
            };
          } catch (error) {
            console.error(`Error processing club ${club.id}:`, error);
            // Return a safe fallback object
            return {
              id: club.id,
              name: club.name || null,
              address: club.address || null,
              instagram: club.instagram || null,
              courts: club.courts || 0,
              opens_at: club.opens_at || null,
              closes_at: club.closes_at || null,
              services: [],
              rating: 0,
              reviewCount: 0,
              coverImage: club.cover_image_url || null,
              galleryImages: []
            };
          }
        })
      );

      return clubsWithServices;
    } catch (error) {
      console.error("Error in getClubesWithServices:", error);
      return [];
    }
  }

  /**
   * Get detailed information for a single club
   */
  export async function getClubDetails(clubId: string) {
    const supabase = await createClient();
    
    // Get club basic info including images
    const { data: club, error: clubError } = await supabase
      .from("clubes")
      .select("*, cover_image_url, gallery_images")
      .eq("id", clubId)
      .single();

    if (clubError) {
      if (clubError.code === 'PGRST116') {
        console.log(`Club with ID ${clubId} not found.`);
        return null;
      }
      console.error("Error fetching club details:", clubError);
      return null;
    }

    if (!club) return null;

    // Get club services
    const { data: services, error: servicesError } = await supabase
      .from("services_clubes")
      .select(`
        services (
          id,
          name
        )
      `)
      .eq("club_id", clubId);

    if (servicesError) {
      console.error(`Error fetching services for club ${clubId}:`, servicesError);
    }

    // Get club reviews with player info
    const { data: reviews, error: reviewsError } = await supabase
      .from("reviews")
      .select(`
        score,
        review_description,
        players (
          first_name,
          last_name
        )
      `)
      .eq("club_id", clubId);

    if (reviewsError) {
      console.error(`Error fetching reviews for club ${clubId}:`, reviewsError);
    }

    // Calculate ratings
    const reviewCount = reviews?.length || 0;
    const averageRating = reviewCount > 0 && reviews
      ? reviews.reduce((sum, review) => sum + (review.score || 0), 0) / reviewCount 
      : 0;

    // Get upcoming tournaments for this club
    const { data: tournaments, error: tournamentsError } = await supabase
      .from("tournaments")
      .select(`
        id,
        name,
        start_date,
        end_date,
        category_name
      `)
      .eq("club_id", clubId)
      .gte("start_date", new Date().toISOString())
      .order("start_date", { ascending: true })
      .limit(3);

    if (tournamentsError) {
      console.error(`Error fetching tournaments for club ${clubId}:`, tournamentsError);
    }

    return {
      ...club,
      services: services?.map(s => s.services).filter(Boolean) || [],
      rating: Number(averageRating.toFixed(1)),
      reviewCount,
      reviews: reviews?.map(review => ({
        score: review.score,
        description: review.review_description,
        playerName: (review as any).players 
          ? `${(review as any).players.first_name} ${(review as any).players.last_name}`
          : "Usuario anónimo",
        date: new Date().toISOString() // Placeholder since no date in reviews table
      })) || [],
      upcomingTournaments: tournaments?.map(tournament => ({
        id: tournament.id,
        name: tournament.name || `Torneo ${tournament.category_name}`,
        date: tournament.start_date 
          ? `${new Date(tournament.start_date).toLocaleDateString()} - ${new Date(tournament.end_date).toLocaleDateString()}`
          : "Fecha por confirmar",
        category: tournament.category_name || "Sin categoría"
      })) || [],
      // Image data
      coverImage: club.cover_image_url,
      galleryImages: (club.gallery_images as string[]) || [],
      // Default values
      phone: "+54 11 1234-5678", // Default, should be a DB field
      email: "info@club.com", // Default, should be a DB field  
      website: "www.club.com", // Default, should be a DB field
      description: "Descripción del club por completar", // Default, should be a DB field
    };
  }

  /**
   * Get all available services
   */
  export async function getServices() {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching services:", error);
      return [];
    }

    return data || [];
  }

  /**
   * Add a review for a club
   */
  export async function addClubReview(clubId: string, playerId: string, score: number, description: string) {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("reviews")
      .insert({
        club_id: clubId,
        player_id: playerId, 
        score,
        review_description: description
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding club review:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  }

  /**
   * Get reviews for a specific club
   */
  export async function getClubReviews(clubId: string) {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("reviews")
      .select(`
        score,
        review_description,
        players (
          first_name,
          last_name
        )
      `)
      .eq("club_id", clubId)
      .order("score", { ascending: false });

    if (error) {
      console.error("Error fetching club reviews:", error);
      return [];
    }

    return data?.map(review => ({
      score: review.score,
      description: review.review_description,
      playerName: (review as any).players 
        ? `${(review as any).players.first_name} ${(review as any).players.last_name}`
        : "Usuario anónimo",
      date: new Date().toISOString() // Placeholder since no date in reviews table
    })) || [];
  }

  // =================== CLUB IMAGES FUNCTIONS ===================

  /**
   * Upload cover image for a club
   */
  export async function uploadClubCoverImage(clubId: string, file: File) {
    const supabase = await createClient();
    
    try {
      // Generate file path: clubes/{clubId}/cover.{extension}
      const fileExtension = file.name.split('.').pop();
      const fileName = `${clubId}/cover.${fileExtension}`;
      
      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('clubes')
        .upload(fileName, file, {
          upsert: true // Replace if exists
        });

      if (uploadError) {
        console.error('Error uploading cover image:', uploadError);
        return { success: false, error: uploadError.message };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('clubes')
        .getPublicUrl(fileName);

      // Update club record with cover image URL
      const { error: updateError } = await supabase
        .from('clubes')
        .update({ cover_image_url: publicUrl })
        .eq('id', clubId);

      if (updateError) {
        console.error('Error updating club cover image URL:', updateError);
        return { success: false, error: updateError.message };
      }

      return { success: true, url: publicUrl };
    } catch (error) {
      console.error('Unexpected error uploading cover image:', error);
      return { success: false, error: 'Error inesperado al subir la imagen' };
    }
  }

  /**
   * Upload gallery image for a club
   */
  export async function uploadClubGalleryImage(clubId: string, file: File) {
    const supabase = await createClient();
    
    try {
      // Get current gallery images
      const { data: club, error: fetchError } = await supabase
        .from('clubes')
        .select('gallery_images')
        .eq('id', clubId)
        .single();

      if (fetchError) {
        console.error('Error fetching club gallery:', fetchError);
        return { success: false, error: fetchError.message };
      }

      const currentGallery = club.gallery_images as string[] || [];
      const imageNumber = currentGallery.length + 1;
      
      // Generate file path: clubes/{clubId}/gallery/{number}.{extension}
      const fileExtension = file.name.split('.').pop();
      const fileName = `${clubId}/gallery/${imageNumber}.${fileExtension}`;
      
      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('clubes')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Error uploading gallery image:', uploadError);
        return { success: false, error: uploadError.message };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('clubes')
        .getPublicUrl(fileName);

      // Update club record with new gallery image
      const updatedGallery = [...currentGallery, publicUrl];
      const { error: updateError } = await supabase
        .from('clubes')
        .update({ gallery_images: updatedGallery })
        .eq('id', clubId);

      if (updateError) {
        console.error('Error updating club gallery:', updateError);
        return { success: false, error: updateError.message };
      }

      return { success: true, url: publicUrl, galleryImages: updatedGallery };
    } catch (error) {
      console.error('Unexpected error uploading gallery image:', error);
      return { success: false, error: 'Error inesperado al subir la imagen' };
    }
  }

  /**
   * Remove gallery image from a club
   */
  export async function removeClubGalleryImage(clubId: string, imageUrl: string) {
    const supabase = await createClient();
    
    try {
      // Get current gallery images
      const { data: club, error: fetchError } = await supabase
        .from('clubes')
        .select('gallery_images')
        .eq('id', clubId)
        .single();

      if (fetchError) {
        console.error('Error fetching club gallery:', fetchError);
        return { success: false, error: fetchError.message };
      }

      const currentGallery = club.gallery_images as string[] || [];
      const updatedGallery = currentGallery.filter(url => url !== imageUrl);

      // Update club record
      const { error: updateError } = await supabase
        .from('clubes')
        .update({ gallery_images: updatedGallery })
        .eq('id', clubId);

      if (updateError) {
        console.error('Error updating club gallery:', updateError);
        return { success: false, error: updateError.message };
      }

      // Extract file path from URL and delete from storage
      const urlParts = imageUrl.split('/');
      const fileName = urlParts.slice(-3).join('/'); // clubId/gallery/filename
      
      const { error: deleteError } = await supabase.storage
        .from('clubes')
        .remove([fileName]);

      if (deleteError) {
        console.error('Error deleting image from storage:', deleteError);
        // Don't return error here as the DB update was successful
      }

      return { success: true, galleryImages: updatedGallery };
    } catch (error) {
      console.error('Unexpected error removing gallery image:', error);
      return { success: false, error: 'Error inesperado al eliminar la imagen' };
    }
  }

  /**
   * Get all images for a club (cover + gallery)
   */
  export async function getClubImages(clubId: string) {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('clubes')
      .select('cover_image_url, gallery_images')
      .eq('id', clubId)
      .single();

    if (error) {
      console.error('Error fetching club images:', error);
      return { coverImage: null, galleryImages: [] };
    }

    return {
      coverImage: data.cover_image_url,
      galleryImages: (data.gallery_images as string[]) || []
    };
  }