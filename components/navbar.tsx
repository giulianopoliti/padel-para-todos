"use client";

import { useUser } from "@/contexts/user-context"; // Updated context hook
import { Suspense } from "react";
import { getLinksForRole } from "@/config/permissions"; // Import link generator
import dynamic from 'next/dynamic';
import type { User as AuthUser } from "@supabase/supabase-js";

// Type for roles used in this component, ensure consistency with permissions.ts
type Role = "PLAYER" | "CLUB" | "COACH" | "ADMIN"; 

// Import the actual components directly for type safety
import NavbarClient from './navbar-client';
import SkeletonNavbar from './skeleton-navbar';

// Define the public links that should always be visible
const publicLinks = [
  { 
    path: "/home", 
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
  {
    path: "/coaches",
    label: "Entrenadores",
    icon: "User" as const,
  },
];

// Define the expected props for NavbarClient explicitly
interface NavbarClientProps {
  mainLinks: { label: string; icon: string; path: string; }[];
  profileLinks: { label: string; icon: string; path: string; }[];
  user: AuthUser | null; // Expecting Supabase Auth User
}

// Use dynamic import with proper typing
const DynamicNavbarClient = dynamic<NavbarClientProps>(() => import('./navbar-client'), { 
  ssr: false,
  loading: () => <SkeletonNavbar /> // Show skeleton while loading client component
});

export default function Navbar() {
  // Use the updated user context hook
  // user = Supabase Auth User | null
  // userDetails = Your DB User Info | null (contains role)
  // loading = context loading state
  const { user, userDetails, loading } = useUser();

  // Determine the role based on userDetails, default to null if no details
  // We need userDetails to determine the links.
  const userRole = userDetails?.role as Role | null;

  // Generate links based on the role from userDetails. 
  // If no role (not logged in, or details not loaded), generate links for a "PUBLIC" or default state.
  // We need a way to handle the 'PUBLIC' case if needed, or perhaps getLinksForRole handles null?
  // For now, let's assume getLinksForRole needs a valid role, or we show minimal links.
  const allAuthLinks = userRole ? getLinksForRole(userRole) : [];
  
  const profileLinkPaths = ["/edit-profile", "/settings"];

  const mainLinks = userRole 
    ? allAuthLinks.filter(link => !profileLinkPaths.includes(link.path))
    : publicLinks;
  
  const profileLinks = userRole 
    ? allAuthLinks.filter(link => profileLinkPaths.includes(link.path))
    : [];

  console.log("[Navbar] State:", { 
    isAuth: !!user, // Check if Supabase auth user exists
    userId: user?.id,
    dbDetailsLoaded: !!userDetails,
    userRole: userDetails?.role,
    loading, // Context loading state
    mainLinksGenerated: mainLinks.length,
    profileLinksGenerated: profileLinks.length
  });
  
  // Determine if we should show the skeleton
  // Show if context is loading OR if we have an auth user but haven't loaded their DB details yet
  const showSkeleton = loading || (user && !userDetails);
  
  return (
    <Suspense fallback={<SkeletonNavbar />}>
      {showSkeleton ? (
        <SkeletonNavbar />
      ) : (
        <DynamicNavbarClient mainLinks={mainLinks} profileLinks={profileLinks} user={user} /> 
      )}
    </Suspense>
  );
}
