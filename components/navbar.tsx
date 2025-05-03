"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { User as UserIcon, LogOut, Trophy, Users, Calendar } from "lucide-react"
import { useSupabase } from "@/components/supabase-provider"
import { supabase } from "@/lib/supabase"
import { useState, useEffect } from "react"

export default function Navbar() {
  const pathname = usePathname()
  const { user, userDetails, loading } = useSupabase()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (menuOpen && !target.closest('.user-menu-container')) {
        setMenuOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  const getDashboardLink = () => {
    if (!userDetails) return "/login"
    switch (userDetails?.role) {
      case "CLUB":
        return "/dashboard/club"
      case "PLAYER":
        return "/dashboard/player"
      case "COACH":
        return "/dashboard/coach"
      default:
        return "/"
    }
  }

  const navItems = [
    { name: "Inicio", href: "/", icon: <Calendar className="h-4 w-4 mr-2" /> },
    { name: "Torneos", href: "/tournaments", icon: <Trophy className="h-4 w-4 mr-2" /> },
    { name: "Ranking", href: "/ranking", icon: <Users className="h-4 w-4 mr-2" /> },
  ]

  return (
    <nav className="bg-padel-green-600 text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold flex items-center">
            <Trophy className="h-6 w-6 mr-2" />
            Torneos de Pádel
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${pathname === item.href ? "bg-white text-padel-green-600" : "hover:bg-padel-green-500"}`}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}

            {/* Authentication Menu */}
            {loading ? (
              <div className="h-8 w-8 animate-pulse bg-white/30 rounded-full"></div>
            ) : user ? (
              <div className="relative user-menu-container cursor-pointer">
                <button 
                  type="button"
                  onClick={() => {
                    console.log('Click en avatar');
                    setMenuOpen(!menuOpen);
                  }}
                  className="bg-white rounded-full p-2 cursor-pointer"
                >
                  <UserIcon className="h-5 w-5 text-padel-green-600" />
                </button>
                
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <div className="px-4 py-2 text-sm font-medium text-gray-700 border-b">Mi Cuenta</div>
                    <Link 
                      href={getDashboardLink()} 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      onClick={() => setMenuOpen(false)}
                    >
                      Panel de Control
                    </Link>
                    <Link 
                      href={`/profile/${userDetails?.id}`} 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      onClick={() => setMenuOpen(false)}
                    >
                      Perfil
                    </Link>
                    <div className="border-t my-1"></div>
                    <button 
                      onClick={() => {
                        handleSignOut();
                        setMenuOpen(false);
                      }} 
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                    >
                      <div className="flex items-center">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Cerrar Sesión</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button asChild variant="secondary" className="bg-white text-padel-green-600 hover:bg-white/90">
                <Link href="/login">Iniciar Sesión</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
