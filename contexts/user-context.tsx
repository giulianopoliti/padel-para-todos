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
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null, 
  userDetails: null,
  loading: true, 
  error: null,
  logout: async () => {},
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userDetails, setUserDetails] = useState<DetailedUserDetails | null>(null); // Use detailed type
  const [loading, setLoading] = useState(true); // loading is true until initial check is complete
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Function to fetch specific user details from your database
  const fetchUserDetailsInternal = useCallback(async (userId: string) => {
    if (!userId) {
      setUserDetails(null); // Clear details if no userId
      return;
    }
    console.log(`[UserContext] Fetching DB user details for auth ID: ${userId}`);
    setError(null); // Clear previous error

    try {
        const { data: basicUserData, error: dbError } = await supabase
            .from("users") 
            .select("id, email, role")
            .eq("id", userId)
            .single();

        if (dbError || !basicUserData) {
            console.error("[UserContext] Error fetching basic user details:", dbError?.message);
            setUserDetails(null); 
            setError(dbError?.code === 'PGRST116' ? "Perfil de usuario no encontrado." : "Error fetching user details.");
            return;
        }

        console.log("[UserContext] Basic user details fetched:", basicUserData);
        let finalUserDetails: DetailedUserDetails = { ...basicUserData };

        if (basicUserData.role === 'PLAYER') {
            const { data: playerData, error: playerError } = await supabase
                .from('players')
                .select('id')
                .eq('user_id', basicUserData.id)
                .single();
            if (playerError) console.error("[UserContext] Error fetching player ID:", playerError.message);
            else if (playerData) finalUserDetails.player_id = playerData.id;
        } else if (basicUserData.role === 'CLUB') {
             const { data: clubData, error: clubError } = await supabase
                .from('clubes')
                .select('id')
                .eq('user_id', basicUserData.id) 
                .single();
            if (clubError) console.error("[UserContext] Error fetching club ID:", clubError.message);
            else if (clubData) finalUserDetails.club_id = clubData.id;
        } else if (basicUserData.role === 'COACH') {
             const { data: coachData, error: coachError } = await supabase
                .from('coaches')
                .select('id')
                .eq('user_id', basicUserData.id) 
                .single();
            if (coachError) console.error("[UserContext] Error fetching coach ID:", coachError.message);
            else if (coachData) finalUserDetails.coach_id = coachData.id;
        }
        setUserDetails(finalUserDetails);
        console.log("[UserContext] Final user details (with role ID):", finalUserDetails);
    } catch (err: any) {
        console.error("[UserContext] Unexpected error fetching user details:", err);
        setUserDetails(null);
        setError(`Unexpected error: ${err.message}`);
    }
  }, []);

  // Logout function using server action
  const logout = useCallback(async () => {
    setError(null);
    console.log("[UserContext] Attempting logout...");
    try {
      const result = await serverSignout(); 
      if (result.success) {
        setUser(null);
        setUserDetails(null);
        console.log("[UserContext] Logout successful via server action.");
        router.push("/login"); 
        router.refresh(); 
      } else {
        throw new Error(result.error || "Server action signout failed");
      }
    } catch (err: any) {
      console.error("[UserContext] Logout error:", err);
      setError(err.message || "Failed to logout.");
    } 
  }, [router]);

  // Effect to handle auth state changes
  useEffect(() => {
    let isMounted = true;
    console.log("[UserContext] Initializing auth state listener and initial load.");

    async function initialLoad() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          throw sessionError;
        }

        if (isMounted) {
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          console.log("[UserContext] Initial session checked:", currentUser ? `User ID: ${currentUser.id}` : "No session");
          if (currentUser) {
            await fetchUserDetailsInternal(currentUser.id);
          } else {
            setUserDetails(null); // Ensure userDetails is cleared if no user
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("[UserContext] Error during initial load:", err);
          setError("Failed during initial load: " + err.message);
          setUser(null); // Clear user on error
          setUserDetails(null); // Clear details on error
        }
      } finally {
        if (isMounted) {
          setLoading(false); // This is the single point where initial loading is set to false
          console.log("[UserContext] Initial load complete. Loading set to false.");
        }
      }
    }

    initialLoad();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        console.log(`[UserContext] Auth event: ${event}`, session ? `Session User: ${session.user.id}` : "No session");

        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            await fetchUserDetailsInternal(currentUser.id);
          }
        } else {
          setUserDetails(null);
          if (event === 'SIGNED_OUT') {
            // Optionally redirect or clear further app state
            router.push('/login'); 
          }
        }
      }
    );

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
      console.log("[UserContext] Auth listener unsubscribed.");
    };
  }, [router]); // Added router to dependency array for logout's router.push

  const contextValue = useMemo(() => ({ 
    user,
    userDetails,
    loading,
    error,
    logout
  }), [user, userDetails, loading, error, logout]);

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
