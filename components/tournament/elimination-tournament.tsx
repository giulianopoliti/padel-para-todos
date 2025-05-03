import TournamentLayout from "./tournament-layout"
import TournamentHeader from "./tournament-header"
import MatchTable from "./match-table"
import { formatDate } from "./utils"
import type { TournamentDetailsProps } from "./tournament-types"
import type { LargeMatch } from "@/types"

export default function EliminationTournament({
  tournament,
  category,
  matches,
  user,
  isRegistered,
  loading,
  router,
  onRegister,
}: TournamentDetailsProps) {
  console.log("[EliminationTournament] Props received - User:", user);
  console.log("[EliminationTournament] Props received - Loading:", loading);
  console.log("[EliminationTournament] Props received - Is Registered:", isRegistered);

  return (
    <TournamentLayout onBack={() => router.back()}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <TournamentHeader
            tournament={tournament}
            category={category}
            user={user}
            isRegistered={isRegistered}
            loading={loading}
            isRegistering={false}
            router={router}
            onRegister={onRegister}
            type="ELIMINATION"
          />
        </div>
      </div>

      <MatchTable 
        matches={matches as LargeMatch[]} 
        formatDate={formatDate} 
      />
    </TournamentLayout>
  )
} 