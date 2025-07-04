"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import TournamentSidebar from "./tournament-sidebar"
import TournamentPlayersTab from "./tournament-players-tab"
import TournamentCouplesTab from "./tournament-couples-tab"
import TournamentZonesTab from "./tournament-zones-tab"
import TournamentMatchesTab from "./tournament-matches-tab"
import ReadOnlyMatchesTabNew from "./read-only-matches-tab-new"
import TournamentBracketTab from "./tournament-bracket-tab"
import ReadOnlyBracketTab from "./read-only-bracket-tab"

interface PlayerInfo {
  id: string
  first_name: string | null
  last_name: string | null
  score: number | null
  dni?: string | null
  phone?: string | null
}

interface PendingInscription {
  id: string
  couple_id: string
  created_at: string
  couple: {
    id: string
    player1_id: string
    player2_id: string
    player_1_info: PlayerInfo | null
    player_2_info: PlayerInfo | null
  }
}

interface TournamentPageLayoutProps {
  tournamentId: string
  tournamentStatus: string
  individualInscriptions: PlayerInfo[]
  coupleInscriptions: any[]
  maxPlayers?: number
  allPlayers?: PlayerInfo[]
  pendingInscriptions?: PendingInscription[]
  isPublicView?: boolean
}

export default function TournamentPageLayout({
  tournamentId,
  tournamentStatus,
  individualInscriptions,
  coupleInscriptions,
  maxPlayers = 32,
  allPlayers = [],
  pendingInscriptions = [],
  isPublicView = false,
}: TournamentPageLayoutProps) {
  const isTournamentActive = tournamentStatus !== "NOT_STARTED"
  const [activeTab, setActiveTab] = useState(isTournamentActive ? "zones" : "players")

  const renderContent = () => {
    switch (activeTab) {
      case "players":
        return (
          <TournamentPlayersTab
            individualInscriptions={individualInscriptions}
            tournamentId={tournamentId}
            tournamentStatus={tournamentStatus}
            maxPlayers={maxPlayers}
            allPlayers={allPlayers}
          />
        )
      case "couples":
        return (
          <TournamentCouplesTab
            coupleInscriptions={coupleInscriptions}
            tournamentId={tournamentId}
            tournamentStatus={tournamentStatus}
            allPlayers={allPlayers}
          />
        )
      case "zones":
        return (
          <div className="p-4 lg:p-8 overflow-x-hidden">
            <TournamentZonesTab tournamentId={tournamentId} />
          </div>
        )
      case "matches":
        return (
          <div className="p-4 lg:p-8 overflow-x-hidden">
            {isPublicView ? (
              <ReadOnlyMatchesTabNew tournamentId={tournamentId} />
            ) : (
              <TournamentMatchesTab tournamentId={tournamentId} />
            )}
          </div>
        )
      case "brackets":
        return isPublicView ? (
          <ReadOnlyBracketTab tournamentId={tournamentId} />
        ) : (
          <TournamentBracketTab tournamentId={tournamentId} />
        )
      default:
        return null
    }
  }

  return (
    <div className="flex relative bg-gray-50 min-h-full">
      {/* Sidebar */}
      <TournamentSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tournamentStatus={tournamentStatus}
      />

      {/* Main Content Area */}
      <main
        className={cn(
          "flex-1 flex flex-col",
          "lg:ml-56", // Account for desktop sidebar width (reduced from ml-64)
          "w-full",
          "pb-20 lg:pb-0", // Space for mobile FAB button
          "overflow-x-hidden" // Prevent horizontal scroll
        )}
      >
        {/* Content Container */}
        <div className="flex-1 bg-white lg:rounded-tl-xl shadow-sm lg:ml-2 overflow-x-hidden">
          {/* Tab Content */}
          {renderContent()}
        </div>
      </main>
    </div>
  )
} 