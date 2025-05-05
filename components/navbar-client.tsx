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
  links: NavLink[];
  user: AuthUser | null;
}

export default function NavbarClient({ links, user }: NavbarClientProps) {
  const pathname = usePathname();
  
  return (
    <header className="bg-padel-green-600 text-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold flex items-center">
            <Trophy className="h-6 w-6 mr-2" />
            <span>Torneos de Pádel</span>
          </Link>
          
          <nav className="flex items-center space-x-4">
            {links.map((link) => (
              <Link 
                key={link.path}
                href={link.path}
                className={`px-3 py-2 rounded text-sm font-medium ${
                  pathname === link.path ? "bg-white text-padel-green-600" : "hover:bg-padel-green-500"
                }`}
              >
                {link.label}
              </Link>
            ))}
            
            <div className="ml-4">
              {user ? (
                <NavbarUserProfile />
              ) : (
                <Button asChild variant="secondary" className="bg-white text-padel-green-600 hover:bg-white/90">
                  <Link href="/login">Iniciar Sesión</Link>
                </Button>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
} 