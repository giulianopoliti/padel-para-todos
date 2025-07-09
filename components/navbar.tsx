"use client";

import { useUser } from "@/contexts/user-context";
import { Suspense, useMemo, useEffect, useState } from "react";
import { getLinksForRole } from "@/config/permissions";
import type { User as AuthUser } from "@supabase/supabase-js";

type Role = "PLAYER" | "CLUB" | "COACH" | "ADMIN"; 

import NavbarClient from './navbar-client';
import SkeletonNavbar from './skeleton-navbar';

// 🔧 OPTIMIZACIÓN FASE 1.3: Links públicos memoizados
const publicLinks = [
  { 
    path: "/", 
    label: "Inicio", 
    icon: "Home" as const,
  },
  { 
    path: "/tournaments", 
    label: "Torneos", 
    icon: "Trophy" as const,
  },
  { 
    path: "/ranking", 
    label: "Ranking", 
    icon: "BarChart" as const,
  },
  { 
    path: "/clubes", 
    label: "Clubes", 
    icon: "MapPin" as const,
  },
];

const profileLinkPaths = ["/edit-profile", "/dashboard"];

interface NavbarClientProps {
  mainLinks: { label: string; icon: string; path: string; }[];
  profileLinks: { label: string; icon: string; path: string; }[];
  user: AuthUser | null;
}

// 🚀 OPTIMIZACIÓN FASE 1.5: Hook personalizado para links optimizados
const useNavbarLinks = (userRole: Role | null) => {
  return useMemo(() => {
    const allAuthLinks = userRole ? getLinksForRole(userRole) : [];
    
    const mainLinks = userRole 
      ? allAuthLinks.filter(link => !profileLinkPaths.includes(link.path))
      : publicLinks;
    
    const profileLinks = userRole 
      ? allAuthLinks.filter(link => profileLinkPaths.includes(link.path))
      : [];

    return { mainLinks, profileLinks };
  }, [userRole]);
};

export default function Navbar() {
  // 🚀 OPTIMIZACIÓN FASE 1.3: Usar nuevos estados de loading
  const { user, userDetails, loading, authLoading, error } = useUser();
  
  // 🚀 FASE 1.3: Estado para forzar resolución de skeleton
  const [forceShowNavbar, setForceShowNavbar] = useState(false);

  // 🚀 FASE 1.3: Timer de recuperación para resolver skeleton colgado
  useEffect(() => {
    const maxWaitTime = 15000; // 15 segundos máximo
    const timer = setTimeout(() => {
      if ((authLoading || loading) && !forceShowNavbar) {
        console.warn('[Navbar Recovery] Forcing skeleton to resolve after 15s timeout');
        console.warn('[Navbar Recovery] States:', { authLoading, loading, hasUser: !!user, hasUserDetails: !!userDetails });
        setForceShowNavbar(true);
      }
    }, maxWaitTime);

    // Limpiar timer si ya no estamos cargando
    if (!authLoading && !loading) {
      setForceShowNavbar(false);
    }
    
    return () => clearTimeout(timer);
  }, [authLoading, loading, forceShowNavbar, user, userDetails]);

  // 🚀 FASE 1.2: Lógica de loading simplificada y robusta
  const showSkeleton = useMemo(() => {
    // Solo mostrar skeleton si:
    // 1. Estamos cargando autenticación inicial
    // 2. O tenemos user pero estamos cargando detalles
    // 3. NUNCA mostrar skeleton si hay error (fallback al navbar básico)
    // 4. NUNCA mostrar skeleton si forceShowNavbar está activo
    if (error) {
      console.log('[Navbar] Error detected, not showing skeleton:', error);
      return false;
    }
    
    if (forceShowNavbar) {
      console.log('[Navbar] Force showing navbar due to timeout recovery');
      return false;
    }
    
    const result = authLoading || (user && loading);
    
    console.log('[Navbar] Skeleton decision:', {
      authLoading,
      hasUser: !!user,
      loading,
      forceShowNavbar,
      showSkeleton: result
    });
    
    return result;
  }, [authLoading, user, loading, error, forceShowNavbar]);

  // 🔧 OPTIMIZACIÓN FASE 1.5: Usar hook optimizado para links
  const userRole = userDetails?.role as Role | null;
  const { mainLinks, profileLinks } = useNavbarLinks(userRole);

  console.log("[Navbar] Loading States:", {
    hasUser: !!user,
    hasUserDetails: !!userDetails,
    authLoading,
    loading,
    hasError: !!error,
    showSkeleton,
    userId: user?.id?.substring(0, 8) || 'none'
  });

  // 🚀 OPTIMIZACIÓN FASE 1.3: Renderizado condicional mejorado
  return (
    <Suspense fallback={<SkeletonNavbar />}>
      {showSkeleton ? (
        <SkeletonNavbar />
      ) : (
        <NavbarClient 
          mainLinks={mainLinks} 
          profileLinks={profileLinks} 
          user={user} 
        />
      )}
    </Suspense>
  );
}
