"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client"; // Use the new client
import type { User as AuthUser } from "@supabase/supabase-js"; // Supabase Auth User type
import type { User as DbUserType } from "@/types"; // Import role-specific types if defined
import { signout as serverSignout } from "@/app/auth/login/actions"; // Server action for signout

// Define a more detailed UserDetails type
// Adjust based on your actual DbUserType and related tables
interface DetailedUserDetails extends DbUserType {
    player_id?: string | null; // Add optional fields for related IDs
    club_id?: string | null;
    coach_id?: string | null;
}

interface UserContextType {
  user: AuthUser | null;      
  userDetails: DetailedUserDetails | null; // Use the detailed type
  loading: boolean;
  error: string | null;
  fetchUserDetails: (userId: string) => Promise<void>; 
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({ 
  user: null, 
  userDetails: null,
  loading: true, 
  error: null,
  fetchUserDetails: async () => {},
  logout: async () => {},
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userDetails, setUserDetails] = useState<DetailedUserDetails | null>(null); // Use detailed type
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Function to fetch specific user details from your database
  const fetchUserDetails = useCallback(async (userId: string) => {
    if (!userId) return;
    console.log(`[UserContext] Fetching DB user details for auth ID: ${userId}`);
    setError(null); // Clear previous error
    // No need to set loading here, handled by caller effect

    try {
        // First, get the basic user info (role, email, etc.)
        const { data: basicUserData, error: dbError } = await supabase
            .from("users") 
            .select("id, email, role") // Select required fields including role
            .eq("id", userId) // Query using auth_id from Auth user
            .single();

        if (dbError || !basicUserData) {
            console.error("[UserContext] Error fetching basic user details:", dbError?.message);
            setUserDetails(null); 
            setError(dbError?.code === 'PGRST116' ? "Perfil de usuario no encontrado." : "Error fetching user details.");
            return;
        }

        console.log("[UserContext] Basic user details fetched:", basicUserData);
        let finalUserDetails: DetailedUserDetails = { ...basicUserData };

        // Now, conditionally fetch the role-specific ID
        if (basicUserData.role === 'PLAYER') {
            const { data: playerData, error: playerError } = await supabase
                .from('players')
                .select('id')
                .eq('user_id', basicUserData.id) // Match players.user_id with users.id
                .single();
            if (playerError) console.error("[UserContext] Error fetching player ID:", playerError.message);
            else if (playerData) finalUserDetails.player_id = playerData.id;
        } else if (basicUserData.role === 'CLUB') {
            // Fetch club ID similarly
             const { data: clubData, error: clubError } = await supabase
                .from('clubes')
                .select('id')
                .eq('user_id', basicUserData.id) 
                .single();
            if (clubError) console.error("[UserContext] Error fetching club ID:", clubError.message);
            else if (clubData) finalUserDetails.club_id = clubData.id;
        } else if (basicUserData.role === 'COACH') {
            // Fetch coach ID similarly
             const { data: coachData, error: coachError } = await supabase
                .from('coaches')
                .select('id')
                .eq('user_id', basicUserData.id) 
                .single();
            if (coachError) console.error("[UserContext] Error fetching coach ID:", coachError.message);
            else if (coachData) finalUserDetails.coach_id = coachData.id;
        }

        console.log("[UserContext] Final user details (with role ID):", finalUserDetails);
        setUserDetails(finalUserDetails);

    } catch (err: any) {
        console.error("[UserContext] Unexpected error fetching user details:", err);
        setUserDetails(null);
        setError(`Unexpected error: ${err.message}`);
    }
  }, []);

  // Logout function using server action
  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);
    console.log("[UserContext] Attempting logout...");
    try {
      const result = await serverSignout(); // Call server action
      if (result.success) {
        setUser(null);
        setUserDetails(null);
        console.log("[UserContext] Logout successful via server action.");
        router.push("/login"); // Redirect to login after logout
        router.refresh(); // Force refresh to clear state
      } else {
        throw new Error(result.error || "Server action signout failed");
      }
    } catch (err: any) {
      console.error("[UserContext] Logout error:", err);
      setError(err.message || "Failed to logout.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Effect to handle auth state changes
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    console.log("[UserContext] Initializing auth state listener.");

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          fetchUserDetails(currentUser.id);
        } else {
          setUserDetails(null);
        }
        setLoading(false);
        console.log("[UserContext] Initial session checked:", currentUser ? `User ID: ${currentUser.id}` : "No session");
      }
    }).catch(err => {
        if (isMounted) {
            console.error("[UserContext] Error getting initial session:", err);
            setLoading(false);
            setError("Failed to get initial session.");
        }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        console.log(`[UserContext] Auth event: ${event}`, session ? `Session User: ${session.user.id}` : "No session");

        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          // Fetch details if user logs in or session is restored
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
            await fetchUserDetails(currentUser.id);
          }
        } else {
          // Clear details if user logs out
          setUserDetails(null);
        }
         // Update loading state only after potential fetch
        setLoading(false); 
      }
    );

    // Cleanup
    return () => {
      isMounted = false;
      subscription?.unsubscribe();
      console.log("[UserContext] Auth listener unsubscribed.");
    };
  }, [fetchUserDetails]); // Dependency array

  // Memoize context value
  const contextValue = useMemo(() => ({ 
    user,
    userDetails,
    loading,
    error,
    fetchUserDetails,
    logout
  }), [user, userDetails, loading, error, fetchUserDetails, logout]);

  return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
};

// Custom hook to use the User context
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
