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
    
    setError(null); // Clear previous error

    try {
        const { data: basicUserData, error: dbError } = await supabase
            .from("users") 
            .select("id, email, role")
            .eq("id", userId)
            .maybeSingle(); // Use maybeSingle instead of single to handle "no rows" case

        if (dbError) {
            setUserDetails(null); 
            setError("Error fetching user details.");
            return;
        }

        if (!basicUserData) {
            // User exists in auth but not in our users table
            // This can happen when registration was incomplete or rejected
    
            setUserDetails(null);
            setError("Tu registro está incompleto o fue bloqueado. Contacta al administrador por WhatsApp +5491169405063 para resolverlo.");
            return;
        }

        
        let finalUserDetails: DetailedUserDetails = { ...basicUserData };

        if (basicUserData.role === 'PLAYER') {
            const { data: playerData, error: playerError } = await supabase
                .from('players')
                .select('id, status')
                .eq('user_id', basicUserData.id)
                .single();
            if (!playerError && playerData) {
                finalUserDetails.player_id = playerData.id;
                
                // Check if player is blocked due to DNI conflict
                if (playerData.status === 'inactive') {
                    setError("Tu cuenta fue bloqueada por un conflicto de datos. Contacta al administrador por WhatsApp +5491169405063 para resolverlo.");
                }
            }
        } else if (basicUserData.role === 'CLUB') {
             const { data: clubData, error: clubError } = await supabase
                .from('clubes')
                .select('id')
                .eq('user_id', basicUserData.id) 
                .single();
            if (!clubError && clubData) finalUserDetails.club_id = clubData.id;
        } else if (basicUserData.role === 'COACH') {
             const { data: coachData, error: coachError } = await supabase
                .from('coaches')
                .select('id')
                .eq('user_id', basicUserData.id) 
                .single();
            if (!coachError && coachData) finalUserDetails.coach_id = coachData.id;
        }
        setUserDetails(finalUserDetails);
    } catch (err: any) {
        setUserDetails(null);
        setError(`Unexpected error: ${err.message}`);
    }
  }, []);

  // Logout function using server action
  const logout = useCallback(async () => {
    setError(null);
    try {
      const result = await serverSignout(); 
      if (result.success) {
        setUser(null);
        setUserDetails(null);
        // Let the component handle navigation instead of auto-redirecting
        // router.push("/login"); 
        router.refresh(); 
      } else {
        throw new Error(result.error || "Server action signout failed");
      }
    } catch (err: any) {
      setError(err.message || "Failed to logout.");
    } 
  }, [router]);

  // Effect to handle auth state changes
  useEffect(() => {
    let isMounted = true;
    

    async function initialLoad() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        // Don't treat missing session as an error - it's normal for non-authenticated users
        if (sessionError && sessionError.message !== 'Auth session missing!') {
          throw sessionError;
        }

        if (isMounted) {
          const currentUser = session?.user ?? null;
          setUser(currentUser);
  
          if (currentUser) {
            await fetchUserDetailsInternal(currentUser.id);
          } else {
            setUserDetails(null); // Ensure userDetails is cleared if no user
          }
        }
      } catch (err: any) {
        if (isMounted) {
          // Don't treat AuthSessionMissingError as an error - it's expected for non-authenticated users
          if (err?.message !== 'Auth session missing!') {
            setError("Failed during initial load: " + err.message);
          }
          setUser(null); // Clear user on error
          setUserDetails(null); // Clear details on error
        }
      } finally {
        if (isMounted) {
          setLoading(false); // This is the single point where initial loading is set to false
  
        }
      }
    }

    initialLoad();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;


        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            await fetchUserDetailsInternal(currentUser.id);
          }
        } else {
          setUserDetails(null);
          if (event === 'SIGNED_OUT') {
            // Let the component handle navigation instead of auto-redirecting
            // router.push('/login'); 
          }
        }
      }
    );

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
      
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
