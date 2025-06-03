"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trophy, Menu, X, BarChart3, Calendar, MapPin, User, Bell, Search, Home } from "lucide-react"
import type { User as AuthUser } from "@supabase/supabase-js"
import NavbarUserProfile from "./navbar-user-profile"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { getIcon, IconName } from "@/components/icons"
import CPALogo from "@/components/ui/cpa-logo"

interface NavLink {
  label: string
  icon: string
  path: string
}

interface NavbarClientProps {
  mainLinks: NavLink[]
  profileLinks: NavLink[]
  user: AuthUser | null
}

// Helper function to get the correct icon component
const getIconComponent = (iconName: string) => {
  // Map of common icon names to Lucide components
  const iconMap: Record<string, any> = {
    Home: Home,
    Trophy: Trophy,
    Calendar: Calendar,
    BarChart3: BarChart3,
    MapPin: MapPin,
    User: User,
    BarChart: BarChart3, // Fallback for ranking
  }
  
  // Try to get from iconMap first, then from getIcon function
  if (iconMap[iconName]) {
    return iconMap[iconName]
  }
  
  // Try to get from the existing getIcon function
  try {
    return getIcon(iconName as IconName)
  } catch {
    // Fallback to Trophy if icon not found
    return Trophy
  }
}

export default function NavbarClient({ mainLinks, profileLinks, user }: NavbarClientProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-gray-900 shadow-md">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <CPALogo />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-2">
            {mainLinks.map((link) => {
              const IconComponent = getIconComponent(link.icon)
              const isActive = pathname === link.path

              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`flex items-center space-x-2 px-5 py-2.5 rounded-full text-base transition-all duration-200 ${
                    isActive ? "bg-blue-600 text-white font-medium" : "text-gray-300 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  <IconComponent className="h-5 w-5" />
                  <span>{link.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-300 hover:text-white hover:bg-gray-800 rounded-full"
            >
              <Search className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-300 hover:text-white hover:bg-gray-800 rounded-full"
            >
              <Bell className="h-5 w-5" />
            </Button>
            
            {user ? (
              <NavbarUserProfile profileLinks={profileLinks} />
            ) : (
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-300 hover:text-white hover:bg-gray-800 px-4 py-2 text-base"
                  asChild
                >
                  <Link href="/login">Iniciar Sesión</Link>
                </Button>
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-base"
                  asChild
                >
                  <Link href="/register">Registrarse</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-full text-gray-300 hover:text-white hover:bg-gray-800"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-gray-800 py-4"
            >
              <nav className="space-y-2">
                {mainLinks.map((link) => {
                  const IconComponent = getIconComponent(link.icon)
                  const isActive = pathname === link.path

                  return (
                    <Link
                      key={link.path}
                      href={link.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-base transition-all duration-200 ${
                        isActive ? "bg-blue-600 text-white" : "text-gray-300 hover:text-white hover:bg-gray-800"
                      }`}
                    >
                      <IconComponent className="h-5 w-5" />
                      <span>{link.label}</span>
                    </Link>
                  )
                })}
              </nav>

              <div className="flex flex-col space-y-2 mt-4 pt-4 border-t border-gray-800">
                {user ? (
                  <div className="px-4">
                    <NavbarUserProfile profileLinks={profileLinks} />
                  </div>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      className="justify-start text-gray-300 hover:text-white hover:bg-gray-800 text-base"
                      asChild
                    >
                      <Link href="/login">Iniciar Sesión</Link>
                    </Button>
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 text-white text-base"
                      asChild
                    >
                      <Link href="/register">Registrarse</Link>
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
