"use client";

import { useUser } from "@/contexts/user-context";
import { Suspense, useMemo } from "react";
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

  // 🔧 OPTIMIZACIÓN FASE 1.3: Lógica de loading mejorada
  const isInitialAuthLoading = authLoading;
  const isUserDetailsLoading = user && loading;
  const isUserDetailsWaiting = user && !userDetails && !error && !loading;
  
  const showSkeleton = isInitialAuthLoading || isUserDetailsLoading || isUserDetailsWaiting;

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
