"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { useSupabase } from "@/components/supabase-provider";
import type { User as AuthUser } from "@supabase/supabase-js";
import type { User as DbUserType } from "@/types";
import { signout as serverSignout } from "@/app/auth/login/actions";

// 🚀 OPTIMIZACIÓN FASE 1.2: Tipos mejorados con documentación
interface DetailedUserDetails extends DbUserType {
    player_id?: string | null;
    club_id?: string | null;
    coach_id?: string | null;
}

interface UserContextType {
  user: AuthUser | null;      
  userDetails: DetailedUserDetails | null;
  loading: boolean;           // 🔧 Ahora indica loading de detalles, no autenticación
  authLoading: boolean;       // 🆕 Nuevo: loading específico de autenticación
  error: string | null;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null, 
  userDetails: null,
  loading: false,     // 🔧 Cambiado: ya no carga por defecto
  authLoading: false, // 🆕 Nuevo estado
  error: null,
  logout: async () => {},
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  // 🚀 OPTIMIZACIÓN FASE 1.2: Usar initialUser del servidor
  const { user: serverUser } = useSupabase();
  
  const [user, setUser] = useState<AuthUser | null>(serverUser); // 🔧 Inicializar con serverUser
  const [userDetails, setUserDetails] = useState<DetailedUserDetails | null>(null);
  const [loading, setLoading] = useState(false);           // 🔧 Solo para detalles
  const [authLoading, setAuthLoading] = useState(false);   // 🆕 Para autenticación
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // 🚀 OPTIMIZACIÓN FASE 2: Cache simple en memoria
  const userCache = useRef<{
    [key: string]: {
      data: DetailedUserDetails;
      timestamp: number;
    }
  }>({});



  // 🔧 OPTIMIZACIÓN FASE 2: Función optimizada para fetch de detalles con cache
  const fetchUserDetailsInternal = useCallback(async (userId: string) => {
    if (!userId) {
      setUserDetails(null);
      return;
    }
    
    // 🔧 OPTIMIZACIÓN FASE 2: Verificar cache (3 minutos de vida)
    const cached = userCache.current[userId];
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < 180000) { // 3 minutos
      console.log('[UserContext] Using cached user details');
      setUserDetails(cached.data);
      return;
    }
    
    setLoading(true);    // 🔧 Solo afecta loading de detalles
    setError(null);

    try {
        // 🚀 FASE 1.1: Query con timeout aplicado
        const basicUserQuery = supabase
            .from("users") 
            .select("id, email, role, avatar_url")
            .eq("id", userId)
            .maybeSingle();
        
        const { data: basicUserData, error: dbError } = await Promise.race([
            basicUserQuery,
            new Promise((_, reject) => 
                setTimeout(() => {
                    console.error('[UserContext] Basic user query timeout after 8s');
                    reject(new Error('Basic user query timeout'));
                }, 8000)
            )
        ]) as any;

        if (dbError) {
            setUserDetails(null); 
            setError("Error fetching user details.");
            return;
        }

        if (!basicUserData) {
            setUserDetails(null);
            setError("Tu registro está incompleto o fue bloqueado. Contacta al administrador por WhatsApp +5491169405063 para resolverlo.");
            return;
        }

        let finalUserDetails: DetailedUserDetails = { ...basicUserData };

        // 🔧 OPTIMIZACIÓN FASE 2: Queries paralelas optimizadas
        const promises = [];
        
        // 🚀 FASE 1.1: Queries de roles con timeout aplicado
        if (basicUserData.role === 'PLAYER') {
            promises.push(
                Promise.race([
                    supabase
                        .from('players')
                        .select('id, status')
                        .eq('user_id', basicUserData.id)
                        .single(),
                    new Promise((_, reject) => 
                        setTimeout(() => {
                            console.error('[UserContext] Player query timeout after 5s');
                            reject(new Error('Player query timeout'));
                        }, 5000)
                    )
                ]).then(({ data: playerData, error: playerError }: any) => {
                    if (!playerError && playerData) {
                        finalUserDetails.player_id = playerData.id;
                        
                        if (playerData.status === 'inactive') {
                            setError("Tu cuenta fue bloqueada por un conflicto de datos. Contacta al administrador por WhatsApp +5491169405063 para resolverlo.");
                        }
                    }
                }).catch((error) => {
                    console.error('[UserContext] Player data fetch failed:', error);
                    // No bloqueamos la operación, solo loggeamos
                })
            );
        } else if (basicUserData.role === 'CLUB') {
            promises.push(
                Promise.race([
                    supabase
                        .from('clubes')
                        .select('id')
                        .eq('user_id', basicUserData.id) 
                        .single(),
                    new Promise((_, reject) => 
                        setTimeout(() => {
                            console.error('[UserContext] Club query timeout after 5s');
                            reject(new Error('Club query timeout'));
                        }, 5000)
                    )
                ]).then(({ data: clubData, error: clubError }: any) => {
                    if (!clubError && clubData) {
                        finalUserDetails.club_id = clubData.id;
                    }
                }).catch((error) => {
                    console.error('[UserContext] Club data fetch failed:', error);
                    // No bloqueamos la operación, solo loggeamos
                })
            );
        } else if (basicUserData.role === 'COACH') {
            promises.push(
                Promise.race([
                    supabase
                        .from('coaches')
                        .select('id')
                        .eq('user_id', basicUserData.id) 
                        .single(),
                    new Promise((_, reject) => 
                        setTimeout(() => {
                            console.error('[UserContext] Coach query timeout after 5s');
                            reject(new Error('Coach query timeout'));
                        }, 5000)
                    )
                ]).then(({ data: coachData, error: coachError }: any) => {
                    if (!coachError && coachData) {
                        finalUserDetails.coach_id = coachData.id;
                    }
                }).catch((error) => {
                    console.error('[UserContext] Coach data fetch failed:', error);
                    // No bloqueamos la operación, solo loggeamos
                })
            );
        }

        // 🔧 FASE 1.1: Ejecutar todas las queries en paralelo con timeout global  
        const globalTimeout = new Promise((_, reject) => 
            setTimeout(() => {
                console.error('[UserContext] Global operation timeout after 12s');
                reject(new Error('Global operation timeout'));
            }, 12000)
        );

        await Promise.race([
            Promise.allSettled(promises), // Usar allSettled en lugar de all
            globalTimeout
        ]);
        
        console.log('[UserContext] User details fetched successfully:', {
            userId: userId.substring(0, 8),
            role: basicUserData.role,
            hasRoleId: !!(finalUserDetails.player_id || finalUserDetails.club_id || finalUserDetails.coach_id)
        });
        
        // 🔧 OPTIMIZACIÓN FASE 2: Guardar en cache
        userCache.current[userId] = {
          data: finalUserDetails,
          timestamp: now
        };
        
        setUserDetails(finalUserDetails);
        
    } catch (err: any) {
        console.error('[UserContext] Critical error in fetchUserDetails:', err);
        setUserDetails(null);
        
        // 🚀 FASE 1.1: Manejo de errores mejorado
        if (err.message.includes('timeout')) {
            setError("La conexión está lenta. Intenta refrescar la página.");
        } else {
            setError(`Error inesperado: ${err.message}`);
        }
    } finally {
        // 🚀 FASE 1.1: CRÍTICO - Siempre resolver el estado de loading
        console.log('[UserContext] Resolving loading state for user:', userId.substring(0, 8));
        setLoading(false);
    }
  }, []);

  // 🔧 OPTIMIZACIÓN FASE 1.2: Logout optimizado (sin cambios funcionales)
  const logout = useCallback(async () => {
    console.log("[UserContext] Starting optimistic logout process...");
    setError(null);
    
    const previousUser = user;
    const previousUserDetails = userDetails;
    
    console.log("[UserContext] Clearing state optimistically...");
    setUser(null);
    setUserDetails(null);
    
    try {
      console.log("[UserContext] Calling server signout...");
      const result = await serverSignout(); 
      
      console.log("[UserContext] Server signout result:", result);
      
      if (result.success) {
        console.log("[UserContext] Server signout successful");
        console.log("[UserContext] Optimistic logout completed successfully");
        return;
      } else {
        console.warn("[UserContext] Server signout failed:", result.error);
        
        if (result.error === 'Auth session missing!') {
          console.log("[UserContext] Session already missing, logout successful");
          return;
        }
        
        console.log("[UserContext] Attempting direct Supabase logout...");
        const { error: directLogoutError } = await supabase.auth.signOut({ scope: 'local' });
        
        if (directLogoutError) {
          console.error("[UserContext] Direct logout also failed:", directLogoutError);
          throw new Error(`Logout failed: ${directLogoutError.message}`);
        }
        
        console.log("[UserContext] Direct logout successful");
      }
    } catch (err: any) {
      console.error("[UserContext] Logout error:", err);
      
      console.log("[UserContext] Keeping optimistic logout despite error");
      
      if (typeof window !== 'undefined') {
        console.log("[UserContext] Force redirecting to login due to error...");
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
        return;
      }
      
      setError(err.message || "Error al cerrar sesión, pero la sesión se cerró localmente.");
    } 
  }, [user, userDetails, router]);

  // 🚀 OPTIMIZACIÓN FASE 1.2: Effect optimizado para usar initialUser
  useEffect(() => {
    let isMounted = true;
    
    // 🔧 OPTIMIZACIÓN CRÍTICA: Usar initialUser del servidor primero
    async function initializeFromServer() {
      console.log("[UserContext] Initializing from server user:", !!serverUser);
      
      if (!isMounted) return;
      
      // 🔧 Si tenemos serverUser, usarlo inmediatamente
      if (serverUser) {
        console.log("[UserContext] Using server user, fetching details...");
        setUser(serverUser);
        await fetchUserDetailsInternal(serverUser.id);
      } else {
        console.log("[UserContext] No server user, checking client session...");
        
        // 🔧 Solo si no hay serverUser, verificar en cliente
        setAuthLoading(true);
        
        try {
          // 🚀 FASE 1.5: Timeout para getSession también
          const sessionPromise = supabase.auth.getSession();
          const sessionTimeout = new Promise((_, reject) => 
            setTimeout(() => {
              console.error('[UserContext] getSession timeout after 8s');
              reject(new Error('getSession timeout'));
            }, 8000)
          );

          const { data: { session }, error: sessionError } = await Promise.race([
            sessionPromise,
            sessionTimeout
          ]) as any;
          
          if (sessionError && sessionError.message !== 'Auth session missing!') {
            throw sessionError;
          }

          if (isMounted) {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
    
            if (currentUser) {
              console.log("[UserContext] Found client session, fetching details...");
              try {
                await fetchUserDetailsInternal(currentUser.id);
              } catch (detailsError: any) {
                console.error('[UserContext] Error fetching user details during init:', detailsError);
                // No setear error aquí para no bloquear la UI, solo loggear
                setUserDetails(null);
              }
            } else {
              setUserDetails(null);
            }
          }
        } catch (err: any) {
          console.error('[UserContext] Error during client session check:', err);
          if (isMounted) {
            if (err?.message !== 'Auth session missing!' && !err?.message?.includes('timeout')) {
              setError("Problema de conexión durante la carga inicial. Intenta refrescar la página.");
            }
            setUser(null);
            setUserDetails(null);
          }
        } finally {
          // 🚀 FASE 1.5: CRÍTICO - Siempre resolver authLoading
          if (isMounted) {
            console.log('[UserContext] Resolving authLoading state');
            setAuthLoading(false);
          }
        }
      }
    }

    initializeFromServer();

    // 🔧 Auth state listener optimizado con manejo de errores
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        console.log("[UserContext] Auth state changed:", event);
        
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            try {
              // 🚀 FASE 1.5: Manejo de errores en auth state change
              await fetchUserDetailsInternal(currentUser.id);
            } catch (error: any) {
              console.error('[UserContext] Error fetching details in auth state change:', error);
              // No setear error para no interferir con la experiencia de usuario
              // Solo asegurar que el estado se resuelve
              setUserDetails(null);
            }
          }
        } else {
          setUserDetails(null);
          setError(null); // Limpiar errores cuando no hay usuario
        }
      }
    );

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [serverUser]); // 🚀 FASE 1.4: Removido fetchUserDetailsInternal para evitar dependencias circulares

  // 🔧 OPTIMIZACIÓN FASE 1.2: Memoización mejorada
  const contextValue = useMemo(() => ({ 
    user,
    userDetails,
    loading,
    authLoading,
    error,
    logout
  }), [user, userDetails, loading, authLoading, error, logout]);

  return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
}; 

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
