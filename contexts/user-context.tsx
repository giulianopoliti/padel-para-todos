"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client"; // Use the new client
import type { User as AuthUser } from "@supabase/supabase-js"; // Supabase Auth User type
import type { User as DbUserType } from "@/types"; // Your custom DB user type
import { signout as serverSignout } from "@/app/auth/login/actions"; // Server action for signout

interface UserContextType {
  user: AuthUser | null;      // Use Supabase Auth User type here
  userDetails: DbUserType | null; // Keep your specific user details separate
  loading: boolean;
  error: string | null;
  fetchUserDetails: (userId: string) => Promise<void>; // Function to fetch DB details
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
  const [userDetails, setUserDetails] = useState<DbUserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Function to fetch specific user details from your database
  const fetchUserDetails = useCallback(async (userId: string) => {
    if (!userId) return; // Guard against fetching without an ID
    console.log(`[UserContext] Fetching DB user details for ID: ${userId}`);
    try {
      const { data, error: dbError } = await supabase
        .from("users") // Your user table name
        .select("id, email, role") // Select the fields you need
        .eq("id", userId)
        .single();

      if (dbError) {
        console.error("[UserContext] Error fetching user details from DB:", dbError.message);
        setUserDetails(null); // Clear details on error
        setError("Error fetching user details.");
        return;
      }

      console.log("[UserContext] DB User details fetched:", data);
      setUserDetails(data as DbUserType);
      setError(null); // Clear previous errors
    } catch (err) {
      console.error("[UserContext] Unexpected error fetching user details:", err);
      setUserDetails(null);
      setError("Unexpected error fetching user details.");
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
