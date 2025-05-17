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
}

export default function TournamentDetailsTabs({
  individualInscriptions,
  coupleInscriptions,
  tournamentId,
  tournamentStatus,
  maxPlayers = 32,
  allPlayers = [],
}: TournamentDetailsTabProps) {
  const [activeTab, setActiveTab] = useState("players")
  const isTournamentActive = tournamentStatus !== "NOT_STARTED"

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-100 hover:border-teal-100 transition-all duration-300">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full border-b border-slate-200 rounded-t-xl bg-slate-50">
          <TabsTrigger
            value="players"
            className="flex-1 py-3 data-[state=active]:bg-white data-[state=active]:text-teal-600 data-[state=active]:shadow-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-teal-500"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Jugadores
          </TabsTrigger>
          <TabsTrigger
            value="couples"
            className="flex-1 py-3 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500"
          >
            <Users className="mr-2 h-4 w-4" />
            Parejas
          </TabsTrigger>
          {isTournamentActive && (
            <>
              <TabsTrigger
                value="zones"
                className="flex-1 py-3 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500"
              >
                <ListChecks className="mr-2 h-4 w-4" />
                Zonas
              </TabsTrigger>
              <TabsTrigger
                value="matches"
                className="flex-1 py-3 data-[state=active]:bg-white data-[state=active]:text-teal-600 data-[state=active]:shadow-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-teal-500"
              >
                <Trophy className="mr-2 h-4 w-4" />
                Partidos
              </TabsTrigger>
              <TabsTrigger
                value="brackets"
                className="flex-1 py-3 data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-purple-500"
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
            <TabsContent value="zones" className="p-6">
              <TournamentZonesTab tournamentId={tournamentId} />
            </TabsContent>

            <TabsContent value="matches" className="p-6">
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
