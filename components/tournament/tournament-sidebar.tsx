"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import {
  Users,
  Trophy,
  ListChecks,
  GitFork,
  Menu,
  X,
  UserPlus,
} from "lucide-react"

interface TournamentSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  tournamentStatus: string
}

interface NavItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  requiresActive?: boolean
}

const navItems: NavItem[] = [
  {
    id: "players",
    label: "Jugadores",
    icon: UserPlus,
  },
  {
    id: "couples",
    label: "Parejas",
    icon: Users,
  },
  {
    id: "zones",
    label: "Zonas",
    icon: ListChecks,
    requiresActive: true,
  },
  {
    id: "matches",
    label: "Partidos",
    icon: Trophy,
    requiresActive: true,
  },
  {
    id: "brackets",
    label: "Llaves",
    icon: GitFork,
    requiresActive: true,
  },
]

export default function TournamentSidebar({
  activeTab,
  onTabChange,
  tournamentStatus,
}: TournamentSidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()
  const isTournamentActive = tournamentStatus !== "NOT_STARTED"

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  const handleNavClick = (itemId: string) => {
    onTabChange(itemId)
    setIsMobileOpen(false)
  }

  const NavContent = () => (
    <nav className="flex flex-col gap-1 px-2">
      {navItems.map((item) => {
        // Skip items that require active tournament if tournament is not active
        if (item.requiresActive && !isTournamentActive) {
          return null
        }

        const Icon = item.icon
        const isActive = activeTab === item.id

        return (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            className={cn(
              "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200",
              "hover:bg-slate-100 active:scale-95",
              isActive
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "text-slate-700 hover:text-slate-900"
            )}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="default"
              size="icon"
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg h-14 w-14 rounded-full"
              aria-label="Abrir menú de navegación"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Navegación</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileOpen(false)}
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 h-screen w-56 bg-white border-r border-gray-200 shadow-sm z-10">
        <div className="h-full flex flex-col pt-24">
          <div className="px-4 pb-4">
            <h2 className="text-lg font-semibold text-slate-900">Navegación</h2>
            <p className="text-sm text-slate-500 mt-1">Secciones del torneo</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            <NavContent />
          </div>
        </div>
      </aside>
    </>
  )
} 