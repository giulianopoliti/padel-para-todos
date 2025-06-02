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
  const [activeTab, setActiveTab] = useState("players")
  const isTournamentActive = tournamentStatus !== "NOT_STARTED"

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full bg-slate-50 border-b border-gray-200 rounded-t-xl p-2">
          <TabsTrigger
            value="players"
            className="flex-1 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-lg"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Jugadores
          </TabsTrigger>
          <TabsTrigger
            value="couples"
            className="flex-1 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-lg"
          >
            <Users className="mr-2 h-4 w-4" />
            Parejas
          </TabsTrigger>
          {isTournamentActive && (
            <>
              <TabsTrigger
                value="zones"
                className="flex-1 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-lg"
              >
                <ListChecks className="mr-2 h-4 w-4" />
                Zonas
              </TabsTrigger>
              <TabsTrigger
                value="matches"
                className="flex-1 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-lg"
              >
                <Trophy className="mr-2 h-4 w-4" />
                Partidos
              </TabsTrigger>
              <TabsTrigger
                value="brackets"
                className="flex-1 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-lg"
              >
                <GitFork className="mr-2 h-4 w-4" />
                Llaves
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="players" className="p-0">
          <TournamentPlayersTab
            individualInscriptions={individualInscriptions}
            tournamentId={tournamentId}
            tournamentStatus={tournamentStatus}
            maxPlayers={maxPlayers}
            allPlayers={allPlayers}
          />
        </TabsContent>

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
              <TournamentMatchesTab tournamentId={tournamentId} />
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
