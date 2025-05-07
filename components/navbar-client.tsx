"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";
import type { User as AuthUser } from "@supabase/supabase-js";
import NavbarUserProfile from "./navbar-user-profile";

interface NavLink {
  label: string;
  icon: string;
  path: string;
}

interface NavbarClientProps {
  mainLinks: NavLink[];
  profileLinks: NavLink[];
  user: AuthUser | null;
}

export default function NavbarClient({ mainLinks, profileLinks, user }: NavbarClientProps) {
  const pathname = usePathname();
  
  return (
    <header className="bg-teal-600 text-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/home" className="text-xl font-bold flex items-center">
            <Trophy className="h-6 w-6 mr-2" />
            <span>PadelPRO</span>
          </Link>
          
          <nav className="flex items-center space-x-1">
            {mainLinks.map((link) => (
              <Link 
                key={link.path}
                href={link.path}
                className={`px-3 py-2 rounded text-sm font-medium ${
                  pathname === link.path 
                    ? "bg-white text-teal-700 hover:bg-white/90" 
                    : "hover:bg-teal-500"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
            
          <div className="ml-4">
            {user ? (
              <NavbarUserProfile profileLinks={profileLinks} />
            ) : (
              <Button asChild variant="secondary" className="bg-white text-teal-700 hover:bg-white/90 rounded-full">
                <Link href="/login">Iniciar Sesión</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 