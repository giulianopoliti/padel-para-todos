"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserPlus, Users, Trophy, ListChecks, GitFork } from "lucide-react"
import TournamentZonesTab from "./tournament-zones-tab"
import TournamentMatchesTab from "./tournament-matches-tab"
import TournamentPlayersTab from "@/components/tournament/tournament-players-tab"
import TournamentCouplesTab from "@/components/tournament/tournament-couples-tab"
import TournamentBracketTab from "./tournament-bracket-tab"

interface PlayerInfo {
  id: string
  first_name: string | null
  last_name: string | null
  score: number | null
  dni?: string | null
  phone?: string | null
}

interface CoupleInfo {
  id: string
  tournament_id: string
  player_1_id: string | null
  player_2_id: string | null
  created_at: string
  player_1_info: PlayerInfo | null
  player_2_info: PlayerInfo | null
}

interface TournamentDetailsTabProps {
  individualInscriptions: PlayerInfo[]
  coupleInscriptions: CoupleInfo[]
  tournamentId: string
  tournamentStatus: string
  maxPlayers?: number
  allPlayers?: PlayerInfo[]
  pendingInscriptions?: any[]
}

export default function TournamentDetailsTabs({
  individualInscriptions,
  coupleInscriptions,
  tournamentId,
  tournamentStatus,
  maxPlayers = 32,
  allPlayers = [],
  pendingInscriptions = [],
}: TournamentDetailsTabProps) {
  const isTournamentActive = tournamentStatus !== "NOT_STARTED"
  const [activeTab, setActiveTab] = useState(isTournamentActive ? "couples" : "players")

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full bg-slate-50 border-b border-gray-200 rounded-t-xl p-2 flex-wrap sm:flex-nowrap gap-1">
          {!isTournamentActive && (
            <TabsTrigger
              value="players"
              className="flex-1 min-w-0 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-lg text-xs sm:text-sm"
            >
              <UserPlus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Jugadores</span>
              <span className="sm:hidden">Jugad.</span>
            </TabsTrigger>
          )}
          <TabsTrigger
            value="couples"
            className="flex-1 min-w-0 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-lg text-xs sm:text-sm"
          >
            <Users className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Parejas</span>
            <span className="sm:hidden">Parejas</span>
          </TabsTrigger>
          {isTournamentActive && (
            <>
              <TabsTrigger
                value="zones"
                className="flex-1 min-w-0 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-lg text-xs sm:text-sm"
              >
                <ListChecks className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Zonas</span>
                <span className="sm:hidden">Zonas</span>
              </TabsTrigger>
              <TabsTrigger
                value="matches"
                className="flex-1 min-w-0 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-lg text-xs sm:text-sm"
              >
                <Trophy className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Partidos</span>
                <span className="sm:hidden">Partidos</span>
              </TabsTrigger>
              <TabsTrigger
                value="brackets"
                className="flex-1 min-w-0 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-lg text-xs sm:text-sm"
              >
                <GitFork className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Llaves</span>
                <span className="sm:hidden">Llaves</span>
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {!isTournamentActive && (
          <TabsContent value="players" className="p-0">
            <TournamentPlayersTab
              individualInscriptions={individualInscriptions}
              tournamentId={tournamentId}
              tournamentStatus={tournamentStatus}
              maxPlayers={maxPlayers}
              allPlayers={allPlayers}
            />
          </TabsContent>
        )}

        <TabsContent value="couples" className="p-0">
          <TournamentCouplesTab
            coupleInscriptions={coupleInscriptions}
            tournamentId={tournamentId}
            tournamentStatus={tournamentStatus}
            allPlayers={allPlayers}
          />
        </TabsContent>

        {isTournamentActive && (
          <>
            <TabsContent value="zones" className="p-8">
              <TournamentZonesTab tournamentId={tournamentId} />
            </TabsContent>

            <TabsContent value="matches" className="p-8">
              <TournamentMatchesTab tournamentId={tournamentId} isOwner={true} />
            </TabsContent>

            <TabsContent value="brackets" className="p-0">
              <TournamentBracketTab tournamentId={tournamentId} />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  )
}
