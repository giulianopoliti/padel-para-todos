"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trophy, Menu } from 'lucide-react'
import type { User as AuthUser } from "@supabase/supabase-js"
import NavbarUserProfile from "./navbar-user-profile"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

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

export default function NavbarClient({ mainLinks, profileLinks, user }: NavbarClientProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="bg-gradient-to-r from-violet-600 to-emerald-500 text-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-14">
          <Link href="/home" className="text-lg font-bold flex items-center">
            <div className="bg-white rounded-full p-1.5 mr-2">
              <Trophy className="h-4 w-4 text-violet-600" />
            </div>
            <span>PadelPRO</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {mainLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 ${
                  pathname === link.path
                    ? "bg-white text-violet-600 shadow-sm"
                    : "hover:bg-white/10 text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white p-1.5 rounded-full hover:bg-white/10"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="ml-4 hidden md:block">
            {user ? (
              <NavbarUserProfile profileLinks={profileLinks} />
            ) : (
              <Button
                asChild
                size="sm"
                variant="secondary"
                className="bg-white text-violet-600 hover:bg-white/90 rounded-full shadow-sm"
              >
                <Link href="/login">Iniciar Sesión</Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-white/10 shadow-lg"
          >
            <div className="container mx-auto px-4 py-3">
              <nav className="flex flex-col space-y-2">
                {mainLinks.map((link) => (
                  <Link
                    key={link.path}
                    href={link.path}
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${
                      pathname === link.path
                        ? "bg-gradient-to-r from-violet-100 to-emerald-100 text-violet-600"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                {!user && (
                  <Link
                    href="/login"
                    className="bg-gradient-to-r from-violet-600 to-emerald-500 text-white py-2 px-4 rounded-lg text-sm font-medium text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Iniciar Sesión
                  </Link>
                )}
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
