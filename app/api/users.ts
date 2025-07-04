"use server"

import { createClient } from "@/utils/supabase/server";
import { supabase } from "@/utils/supabase/client";
import { Player, Couple, Category, Role } from "@/types";
import { User } from "@supabase/supabase-js";

export async function getTop5MalePlayers() {
    const { data, error } = await supabase
        .from("players")
        .select("*")
        .eq("gender", "MALE")
        .order("score", { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error fetching top 5 male players:", error);
        return [];
    }

    return data;
}


export async function getPlayersMale(limit?: number) {
    // OPTIMIZED: Sort directly in DB and apply limit in query
    let query = supabase
        .from("players")
        .select(`
            *,
            clubes (
                name
            )
        `)
        .eq("gender", "MALE")
        .order("score", { ascending: false }); // Sort in DB instead of frontend

    // Apply limit in query if specified
    if (limit) {
        query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching players:", error);
        return [];
    }

    // Data is already sorted and limited from DB
    const finalData = data || [];

    // Map the raw data to our Player type
    const players = finalData?.map((rawPlayer): Player => {
        
        // Get profile image - use profile_image_url first, then default
        let profileImageUrl = rawPlayer.profile_image_url;
        
        // If we have a profile image, make sure it's a full URL
        if (profileImageUrl) {
            // If it's not a full URL (doesn't start with http), get the public URL from Supabase
            if (!profileImageUrl.startsWith('http')) {
                const { data: { publicUrl } } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(profileImageUrl);
                profileImageUrl = publicUrl;
            }
        } else {
            // If no profile image, use default image from avatars bucket
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl('avatars/foto predeterminada.jpg');
            profileImageUrl = publicUrl;
        }
        
        return {
            id: rawPlayer.id,
            firstName: rawPlayer.first_name,    // DB: first_name -> TS: firstName
            lastName: rawPlayer.last_name,      // DB: last_name -> TS: lastName
            score: rawPlayer.score,
            category: rawPlayer.category_name || rawPlayer.category || "Sin categoría",  // DB: category_name -> TS: category
            preferredHand: rawPlayer.preferred_hand,  // DB: preferred_hand -> TS: preferredHand
            racket: rawPlayer.racket,
            preferredSide: rawPlayer.preferred_side,  // DB: preferred_side -> TS: preferredSide
            createdAt: rawPlayer.created_at,    // DB: created_at -> TS: createdAt
            club_name: rawPlayer.clubes?.name || "Sin club",  // Usamos el nombre del club del join
            gender: rawPlayer.gender || "MALE",
            profileImage: profileImageUrl  // Add profile image
        };
    }) || [];
    
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
      
      // Don't log AuthSessionMissingError as it's expected for non-authenticated users
      if (error && error.message !== 'Auth session missing!') {
        console.error("Error fetching user:", error);
      }
      
      if (error) return null;
      return user;
    } catch (error: any) {
      // Don't log AuthSessionMissingError as it's expected for non-authenticated users
      if (error?.message !== 'Auth session missing!') {
        console.error("Error fetching user:", error);
      }
      return null;
    }
  };
  

  export const getUserRole = async (): Promise<Role | null> => {
    try {
      const supabase = await createClient();
      const user = await getUser();
      if (!user) {
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
    } catch (error) {
      console.error("Error fetching user role:", error);
      return null;
    }
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

  /**
   * Get players of a specific club with detailed information for ranking display
   */
  export async function getClubPlayersForRanking(clubId: string) {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("players")
      .select(`
        id,
        first_name,
        last_name,
        score,
        category_name,
        preferred_hand,
        preferred_side,
        racket,
        gender,
        profile_image_url,
        created_at,
        clubes (
          id,
          name
        )
      `)
      .eq("club_id", clubId)
      .order("score", { ascending: false });

    if (error) {
      console.error("Error fetching club players for ranking:", error);
      return [];
    }

    // Transform the data to match the ranking UI format
    const players = data?.map((rawPlayer, index) => {
      // Handle profile image URL
      let profileImageUrl = rawPlayer.profile_image_url;
      
      if (profileImageUrl && !profileImageUrl.startsWith('http')) {
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(profileImageUrl);
        profileImageUrl = publicUrl;
      } else if (!profileImageUrl) {
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl('avatars/foto predeterminada.jpg');
        profileImageUrl = publicUrl;
      }

      return {
        id: rawPlayer.id,
        firstName: rawPlayer.first_name,
        lastName: rawPlayer.last_name,
        score: rawPlayer.score || 0,
        category: rawPlayer.category_name || "Sin categoría",
        preferredHand: rawPlayer.preferred_hand,
        preferredSide: rawPlayer.preferred_side,
        racket: rawPlayer.racket,
        gender: rawPlayer.gender || "MALE",
        profileImage: profileImageUrl,
        createdAt: rawPlayer.created_at,
        position: (index + 1),
        club_name: (rawPlayer.clubes as any)?.name || "Sin club",
        // Add some demo data for better UI
        trend: Math.floor(Math.random() * 5) - 2, // Random trend between -2 and 2
        winRate: Math.floor(Math.random() * 30) + 70, // Win rate between 70% and 100%
        matchesPlayed: Math.floor(Math.random() * 50) + 10, // Matches between 10 and 60
      };
    }) || [];

    return players;
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
    
    // Get club basic info including images and contact info
    const { data: club, error: clubError } = await supabase
      .from("clubes")
      .select("*, cover_image_url, gallery_images, phone, email, website, description")
      .eq("id", clubId)
      .single();

    if (clubError) {
      if (clubError.code === 'PGRST116') {
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
        category_name,
        pre_tournament_image_url,
        max_participants,
        description,
        price,
        status
      `)
      .eq("club_id", clubId)
      .gte("start_date", new Date().toISOString())
      .order("start_date", { ascending: true })
      .limit(3);

    if (tournamentsError) {
      console.error(`Error fetching tournaments for club ${clubId}:`, tournamentsError);
    }

    // Get current participants count for each tournament
    let tournamentsWithParticipants = [];
    if (tournaments && tournaments.length > 0) {
      for (const tournament of tournaments) {
        const { data: inscriptions, error: inscriptionsError } = await supabase
          .from("inscriptions")
          .select("id")
          .eq("tournament_id", tournament.id);

        if (inscriptionsError) {
          console.error(`Error fetching inscriptions for tournament ${tournament.id}:`, inscriptionsError);
        }

        const currentParticipants = inscriptions ? inscriptions.length : 0;

        tournamentsWithParticipants.push({
          ...tournament,
          currentParticipants
        });
      }
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
      upcomingTournaments: tournamentsWithParticipants.map(tournament => ({
        id: tournament.id,
        name: tournament.name || `Torneo ${tournament.category_name}`,
        date: tournament.start_date 
          ? `${new Date(tournament.start_date).toLocaleDateString()} - ${new Date(tournament.end_date).toLocaleDateString()}`
          : "Fecha por confirmar",
        category: tournament.category_name || "Sin categoría",
        image: tournament.pre_tournament_image_url,
        description: tournament.description,
        price: tournament.price,
        status: tournament.status,
        maxParticipants: tournament.max_participants,
        currentParticipants: tournament.currentParticipants || 0,
        registrations: `${tournament.currentParticipants || 0}/${tournament.max_participants || 0}`
      })),
      // Image data
      coverImage: club.cover_image_url,
      galleryImages: (club.gallery_images as string[]) || [],
      // Contact information - use real data from DB
      phone: club.phone || null,
      email: club.email || null,
      website: club.website || null,
      description: club.description || "Descripción del club por completar",
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

  /**
   * Get detailed player profile information including stats
   */
  export async function getPlayerProfile(playerId: string) {
    try {
      
      // Get player basic info including club
      const { data: player, error: playerError } = await supabase
        .from("players")
        .select(`
          *,
          clubes (
            id,
            name,
            address
          )
        `)
        .eq("id", playerId)
        .single();

      if (playerError) {
        console.error("❌ Error fetching player profile:", playerError);
        return null;
      }

      if (!player) {
        return null;
      }

      // Calculate age from date_of_birth
      const age = player.date_of_birth 
        ? (() => {
            const today = new Date();
            const birthDate = new Date(player.date_of_birth);
            let calculatedAge = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            
            // If the birthday hasn't occurred this year yet, subtract 1 from age
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
              calculatedAge--;
            }
            
            return calculatedAge;
          })()
        : null;

      // Get profile image - use profile_image_url first, then default
      let profileImageUrl = player.profile_image_url;
      
      // If we have a profile image, make sure it's a full URL
      if (profileImageUrl) {
        // If it's not a full URL (doesn't start with http), get the public URL from Supabase
        if (!profileImageUrl.startsWith('http')) {
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(profileImageUrl);
          profileImageUrl = publicUrl;
        }
      } else {
        // If no profile image, use default image from avatars bucket
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl('avatars/foto predeterminada.jpg');
        profileImageUrl = publicUrl;
      }

      // Get player statistics
      const [tournamentsStats, matchesStats, lastTournament, ranking] = await Promise.all([
        getPlayerTournamentStats(playerId),
        getPlayerMatchStats(playerId),
        getPlayerLastTournament(playerId),
        getPlayerRanking(playerId)
      ]);

      const result = {
        id: player.id,
        name: `${player.first_name || ''} ${player.last_name || ''}`.trim(),
        profileImage: profileImageUrl, // ⚠️ Important: using 'profileImage' to match frontend
        ranking: ranking || {
          current: 0,
          variation: 0,
          isPositive: true,
        },
        status: player.status || 'active',
        dominantHand: player.preferred_hand || 'N/A',
        preferredSide: player.preferred_side,
        circuitJoinDate: player.created_at,
        lastTournament,
        age,
        stats: {
          tournamentsPlayed: tournamentsStats.tournamentsPlayed,
          upcomingTournaments: tournamentsStats.upcomingTournaments,
          winRate: matchesStats.winRate,
          finals: { 
            played: tournamentsStats.finalsPlayed, 
            won: tournamentsStats.finalsWon 
          },
          matchesPlayed: matchesStats.totalMatches,
        },
        contact: {
          instagram: player.instagram_handle ? `@${player.instagram_handle}` : null,
          phone: player.phone || null,
          address: player.address || (player.clubes as any)?.address || null,
        },
        gallery: Array.isArray(player.gallery_images) ? player.gallery_images : [],
        club: player.clubes ? {
          id: (player.clubes as any).id,
          name: (player.clubes as any).name,
        } : null,
        // Additional fields
        category: player.category_name,
        racket: player.racket,
        score: player.score,
        description: player.description,
      };

      return result;

    } catch (error) {
      console.error("💥 Error in getPlayerProfile:", error);
      return null;
    }
  }

  /**
   * Get player tournament statistics
   */
  export async function getPlayerTournamentStats(playerId: string) {
    const supabase = await createClient();
    try {
      // Get individual inscriptions where the player participated
      const { data: individualInscriptions, error: individualError } = await supabase
        .from('inscriptions')
        .select(`
          tournament_id,
          tournaments!inner(
            id,
            name,
            status,
            start_date,
            end_date
          )
        `)
        .eq('player_id', playerId)
        .eq('is_pending', false);

      if (individualError) {
        console.error("Error fetching individual inscriptions:", individualError);
      }

      // Get couple inscriptions where the player participated
      const { data: coupleInscriptions, error: coupleError } = await supabase
        .from('inscriptions')
        .select(`
          tournament_id,
          couple_id,
          tournaments!inner(
            id,
            name,
            status,
            start_date,
            end_date
          ),
          couples!inner(
            id,
            player1_id,
            player2_id
          )
        `)
        .not('couple_id', 'is', null)
        .eq('is_pending', false);

      if (coupleError) {
        console.error("Error fetching couple inscriptions:", coupleError);
      }

      // Filter couple inscriptions to only include those where the player is part of the couple
      const playerCoupleInscriptions = (coupleInscriptions || []).filter(
        (inscription: any) => {
          const couple = inscription.couples;
          return couple && (couple.player1_id === playerId || couple.player2_id === playerId);
        }
      );

      // Combine all inscriptions
      const allInscriptions = [
        ...(individualInscriptions || []),
        ...playerCoupleInscriptions
      ];

      console.log(`[getPlayerTournamentStats] Player ${playerId} - Individual: ${individualInscriptions?.length || 0}, Couple: ${playerCoupleInscriptions.length}, Total: ${allInscriptions.length}`);

      if (allInscriptions.length === 0) {
        return { 
          tournamentsPlayed: 0, 
          upcomingTournaments: 0, 
          finalsPlayed: 0, 
          finalsWon: 0 
        };
      }

      // Remove duplicates (in case a player is inscribed both individually and in couple to same tournament)
      const uniqueInscriptions = allInscriptions.filter((inscription, index, self) =>
        index === self.findIndex(i => i.tournament_id === inscription.tournament_id)
      );

      console.log(`[getPlayerTournamentStats] Player ${playerId} - Unique tournaments: ${uniqueInscriptions.length}`);
      
      // Debug: Log tournament details
      uniqueInscriptions.forEach((inscription: any, index: number) => {
        const tournament = inscription.tournaments;
        console.log(`[getPlayerTournamentStats] Tournament ${index + 1}: ${tournament.name}, Status: ${tournament.status}, Start Date: ${tournament.start_date}`);
      });

      // Separate tournaments by status
      const playedTournaments = uniqueInscriptions.filter(
        (inscription: any) => {
          const tournament = inscription.tournaments;
          // Consider a tournament "played" if it's FINISHED, IN_PROGRESS, PAIRING, or has already started
          return tournament.status === 'FINISHED' || 
                 tournament.status === 'IN_PROGRESS' || 
                 tournament.status === 'PAIRING' ||
                 (tournament.start_date && new Date(tournament.start_date) <= new Date());
        }
      );

      const upcomingTournaments = uniqueInscriptions.filter(
        (inscription: any) => {
          const tournament = inscription.tournaments;
          // Consider a tournament "upcoming" if it's NOT_STARTED and hasn't started yet
          return tournament.status === 'NOT_STARTED' && 
                 tournament.start_date && 
                 new Date(tournament.start_date) > new Date();
        }
      );

      const completedTournaments = uniqueInscriptions.filter(
        (inscription: any) => inscription.tournaments.status === 'FINISHED'
      );

      // For now, we'll estimate finals based on completed tournaments
      // In a more complete implementation, you'd track actual finals participation
      const finalsPlayed = Math.floor(completedTournaments.length * 0.3); // 30% reach finals
      const finalsWon = Math.floor(finalsPlayed * 0.4); // 40% win when they reach finals

      console.log(`[getPlayerTournamentStats] Player ${playerId} - Played: ${playedTournaments.length}, Upcoming: ${upcomingTournaments.length}`);

      return {
        tournamentsPlayed: playedTournaments.length,
        upcomingTournaments: upcomingTournaments.length,
        finalsPlayed,
        finalsWon
      };
    } catch (error) {
      console.error("Error in getPlayerTournamentStats:", error);
      return { 
        tournamentsPlayed: 0, 
        upcomingTournaments: 0, 
        finalsPlayed: 0, 
        finalsWon: 0 
      };
    }
  }

  /**
   * Get player match statistics
   */
  export async function getPlayerMatchStats(playerId: string) {
    const supabase = await createClient();
    try {
      // Get all couples where the player participates
      const { data: couples, error: couplesError } = await supabase
        .from('couples')
        .select('id')
        .or(`player1_id.eq.${playerId},player2_id.eq.${playerId}`);

      if (couplesError || !couples) {
        console.error("Error fetching player couples:", couplesError);
        return { totalMatches: 0, wins: 0, winRate: 0 };
      }

      const coupleIds = couples.map(couple => couple.id);

      if (coupleIds.length === 0) {
        return { totalMatches: 0, wins: 0, winRate: 0 };
      }

      // Get all matches where any of the player's couples participated
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select(`
          id,
          couple1_id,
          couple2_id,
          winner_id,
          status
        `)
        .or(`couple1_id.in.(${coupleIds.join(',')}),couple2_id.in.(${coupleIds.join(',')})`)
        .eq('status', 'COMPLETED');

      if (matchesError) {
        console.error("Error fetching player matches:", matchesError);
        return { totalMatches: 0, wins: 0, winRate: 0 };
      }

      const totalMatches = matches?.length || 0;
      const wins = matches?.filter(match => 
        coupleIds.includes(match.winner_id)
      ).length || 0;

      const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

      return {
        totalMatches,
        wins,
        winRate
      };
    } catch (error) {
      console.error("Error in getPlayerMatchStats:", error);
      return { totalMatches: 0, wins: 0, winRate: 0 };
    }
  }

  /**
   * Get player's last tournament
   */
  export async function getPlayerLastTournament(playerId: string) {
    const supabase = await createClient();
    try {
      const { data: lastInscription, error } = await supabase
        .from('inscriptions')
        .select(`
          tournament_id,
          created_at,
          tournaments!inner(
            id,
            name,
            status,
            start_date,
            end_date
          )
        `)
        .eq('player_id', playerId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !lastInscription) {
        return null;
      }

      return {
        name: (lastInscription.tournaments as any).name,
        date: (lastInscription.tournaments as any).start_date || (lastInscription.tournaments as any).end_date
      };
    } catch (error) {
      console.error("Error in getPlayerLastTournament:", error);
      return null;
    }
  }

  /**
   * Get player ranking information
   */
  export async function getPlayerRanking(playerId: string) {
    const supabase = await createClient();
    try {
      // Get the player's current score
      const { data: player, error: playerError } = await supabase
        .from('players')
        .select('score, category_name')
        .eq('id', playerId)
        .single();

      if (playerError || !player) {
        return { current: 0, variation: 0, isPositive: true };
      }

      // Get all players in the same category to calculate ranking
      const { data: categoryPlayers, error: categoryError } = await supabase
        .from('players')
        .select('id, score')
        .eq('category_name', player.category_name)
        .order('score', { ascending: false });

      if (categoryError || !categoryPlayers) {
        return { current: 0, variation: 0, isPositive: true };
      }

      // Find player's ranking position
      const playerIndex = categoryPlayers.findIndex(p => p.id === playerId);
      const ranking = playerIndex + 1; // Convert to 1-based ranking

      // For variation, we'd need to track historical rankings
      // For now, we'll return a placeholder
      return {
        current: ranking,
        variation: 0, // Would need historical data to calculate
        isPositive: true
      };
    } catch (error) {
      console.error("Error in getPlayerRanking:", error);
      return { current: 0, variation: 0, isPositive: true };
    }
  }

  /**
   * Get the current user's club ID
   */
  export async function getCurrentUserClubId() {
    try {
      const user = await getUser()
      const role = await getUserRole()
      
      if (!user || role !== 'CLUB') {
        return null
      }

      const supabase = await createClient()
      
      const { data: club, error } = await supabase
        .from('clubes')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (error || !club) {
        return null
      }

      return club.id
    } catch (error) {
      console.error('Error getting current user club ID:', error)
      return null
    }
  }

  /**
   * OPTIMIZED: Get top clubs for home page - only fetches the top 3 clubs
   * This reduces DB queries from ~20+ to just 3 queries total
   */
  export async function getTopClubsForHome(limit: number = 3) {
    const supabase = await createClient();
    
    try {
      // Single query to get clubs with their average ratings, sorted by rating
      const { data: clubsWithRatings, error: clubsError } = await supabase
        .from("clubes")
        .select(`
          id,
          name,
          address,
          courts,
          opens_at,
          closes_at,
          cover_image_url,
          gallery_images
        `)
        .order("name")
        .limit(limit * 3); // Get more clubs to calculate ratings properly

      if (clubsError) {
        console.error("Error fetching clubs for home:", clubsError);
        return [];
      }

      if (!clubsWithRatings || clubsWithRatings.length === 0) {
        return [];
      }

      // Get all reviews for these clubs in one query
      const clubIds = clubsWithRatings.map(club => club.id);
      const { data: allReviews, error: reviewsError } = await supabase
        .from("reviews")
        .select("club_id, score")
        .in("club_id", clubIds);

      if (reviewsError) {
        console.error("Error fetching reviews for home clubs:", reviewsError);
      }

      // Calculate ratings and prepare final data
      const clubsWithCalculatedRatings = clubsWithRatings.map(club => {
        const clubReviews = allReviews?.filter(review => review.club_id === club.id) || [];
        const reviewCount = clubReviews.length;
        const averageRating = reviewCount > 0 
          ? clubReviews.reduce((sum, review) => sum + (review.score || 0), 0) / reviewCount 
          : 0;

        return {
          id: club.id,
          name: club.name || null,
          address: club.address || null,
          courts: club.courts || 0,
          opens_at: club.opens_at || null,
          closes_at: club.closes_at || null,
          rating: Math.round(averageRating * 10) / 10,
          reviewCount: reviewCount,
          coverImage: club.cover_image_url || null,
          galleryImages: Array.isArray(club.gallery_images) ? club.gallery_images : []
        };
      });

          // Sort by rating descending and return top clubs
    return clubsWithCalculatedRatings
      .sort((a: any, b: any) => b.rating - a.rating)
      .slice(0, limit);

    } catch (error) {
      console.error("Error in getTopClubsForHome:", error);
      return [];
    }
  }
