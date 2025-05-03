import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/contexts/user-context"
import { useAuth } from "@/components/auth-provider"
import { toast } from "@/components/ui/use-toast"
import type { Tournament } from "@/types"

export function useTournamentRegistration(tournament: Tournament | null) {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, userId } = useAuth()
  const [user, setUser] = useState<any>(null)
  const [userLoading, setUserLoading] = useState(true)
  const [isRegistered, setIsRegistered] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  
  // Obtener datos del usuario cuando se confirme la autenticación
  useEffect(() => {
    const fetchUserData = async () => {
      if (authLoading) return;
      
      if (!isAuthenticated || !userId) {
        console.log("[useTournamentRegistration] No autenticado");
        setUser(null);
        setUserLoading(false);
        return;
      }
      
      try {
        console.log("[useTournamentRegistration] Obteniendo datos del usuario:", userId);
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .single();
          
        if (error) {
          console.error("[useTournamentRegistration] Error al obtener datos del usuario:", error);
          setUser(null);
        } else {
          console.log("[useTournamentRegistration] Datos del usuario obtenidos:", data);
          setUser(data);
        }
      } catch (err) {
        console.error("[useTournamentRegistration] Error inesperado:", err);
        setUser(null);
      } finally {
        setUserLoading(false);
      }
    };
    
    fetchUserData();
  }, [isAuthenticated, userId, authLoading]);

  // Verificar si el usuario ya está inscrito en el torneo
  useEffect(() => {
    const checkRegistration = async () => {
      // Ejecutar solo cuando el usuario haya cargado y exista, y tengamos el torneo
      if (userLoading || !user || !tournament) {
        setIsRegistered(false); 
        return;
      }

      try {
        console.log("[Effect] Verificando inscripción para usuario:", user.id, "en torneo:", tournament.id);
        
        const { data, error } = await supabase
          .from("inscriptions")
          .select("*")
          .eq("tournament_id", tournament.id)
          .eq("player_id", user.id)
          .single();
        
        console.log("[Effect] Resultado de la verificación:", data, error);
        // Establecer isRegistered basado en si se encontró una inscripción
        setIsRegistered(!!data);
      } catch (error) {
        // Si hay error (ej: no se encontró registro con .single()), asumir no registrado
        if (typeof error === 'object' && error !== null && 'code' in error) {
          const supabaseError = error as { code: string; message: string };
          if (supabaseError.code !== 'PGRST116') { // Ignorar error 'No rows found'
            console.error("Error checking registration:", supabaseError.message);
          }
        } else {
          console.error("An unexpected error occurred:", error);
        }
        setIsRegistered(false);
      }
    };

    checkRegistration();
  }, [tournament, user, userLoading]);

  const handleRegister = async () => {
    if (!user || !tournament || isRegistering) return;
    
    setIsRegistering(true);
    
    try {
      // Verificar si el usuario tiene perfil de jugador
      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .select("*")
        .eq("user_id", user.id)
        .single();
        
      if (playerError) {
        toast({
          title: "Error",
          description: "Debes completar tu perfil de jugador antes de inscribirte a un torneo",
          variant: "destructive"
        });
        router.push("/profile");
        return;
      }
      
      // Registrar al jugador en el torneo
      const { error } = await supabase
        .from("inscriptions")
        .insert({
          tournament_id: tournament.id,
          player_id: user.id,
          registered_at: new Date().toISOString(),
          status: "PENDING" // Puede ser PENDING, CONFIRMED, REJECTED
        });
        
      if (error) {
        throw error;
      }
      
      setIsRegistered(true);
      toast({
        title: "¡Inscripción exitosa!",
        description: "Te has inscrito correctamente al torneo"
      });
      
    } catch (error) {
      console.error("Error al registrarse:", error);
      toast({
        title: "Error",
        description: "Hubo un problema al registrarte en el torneo. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsRegistering(false);
    }
  };

  // Depuración final
  useEffect(() => {
    console.log("[useTournamentRegistration] ESTADO FINAL:", {
      isAuthenticated,
      userId,
      authLoading,
      userFromState: !!user,
      isLoading: userLoading,
      isRegistered
    })
  }, [isAuthenticated, userId, authLoading, user, userLoading, isRegistered]);

  return {
    user,
    userLoading: userLoading || authLoading,
    isRegistered,
    isRegistering,
    router,
    handleRegister
  };
} 