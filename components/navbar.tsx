"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Menu, User, LogOut, Trophy, Users, Calendar } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { User as UserType } from "@/types"

export default function Navbar() {
  const pathname = usePathname()
  const [user, setUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    async function getUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        const { data } = await supabase.from("users").select("*").eq("id", session.user.id).single()

        if (data) {
          setUser(data as UserType)
        }
      }

      setLoading(false)
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        const { data } = await supabase.from("users").select("*").eq("id", session.user.id).single()

        if (data) {
          setUser(data as UserType)
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  const getDashboardLink = () => {
    if (!user) return "/login"

    switch (user.role) {
      case "CLUB":
        return "/dashboard/club"
      case "JUGADOR":
        return "/dashboard/player"
      case "ENTRENADOR":
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
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold flex items-center">
              <Trophy className="h-6 w-6 mr-2" />
              <span>Torneos de Pádel</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                  pathname === item.href ? "bg-white text-padel-green-600" : "hover:bg-padel-green-500"
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}

            {!loading && (
              <>
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="relative h-8 w-8 rounded-full bg-white text-padel-green-600 hover:bg-white/90"
                      >
                        <User className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={getDashboardLink()}>Panel de Control</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/profile">Perfil</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Cerrar Sesión</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button asChild variant="secondary" className="bg-white text-padel-green-600 hover:bg-white/90">
                    <Link href="/login">Iniciar Sesión</Link>
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Mobile Navigation Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
              className="text-white hover:bg-padel-green-500"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                  pathname === item.href ? "bg-white text-padel-green-600" : "hover:bg-padel-green-500"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}

            {!loading && (
              <>
                {user ? (
                  <>
                    <Link
                      href={getDashboardLink()}
                      className="flex items-center px-3 py-2 rounded-md text-base font-medium hover:bg-padel-green-500"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Panel de Control
                    </Link>
                    <Link
                      href="/profile"
                      className="flex items-center px-3 py-2 rounded-md text-base font-medium hover:bg-padel-green-500"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Perfil
                    </Link>
                    <button
                      onClick={() => {
                        handleSignOut()
                        setMobileMenuOpen(false)
                      }}
                      className="flex items-center w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-padel-green-500"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Cerrar Sesión
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="flex items-center px-3 py-2 rounded-md text-base font-medium bg-white text-padel-green-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Iniciar Sesión
                  </Link>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

