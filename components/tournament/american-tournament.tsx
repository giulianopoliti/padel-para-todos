import TournamentLayout from "./tournament-layout"
import TournamentHeader from "./tournament-header"
import MatchTable from "./match-table"
import { formatDate } from "./utils"
import type { TournamentDetailsProps } from "./tournament-types"
import type { AmericanMatch } from "@/types"

export default function AmericanTournament({
  tournament,
  category,
  matches,
  user,
  isRegistered,
  loading,
  router,
  onRegister,
}: TournamentDetailsProps) {
  console.log("[AmericanTournament] Props received - User:", user);
  console.log("[AmericanTournament] Props received - Loading:", loading);
  console.log("[AmericanTournament] Props received - Is Registered:", isRegistered);

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
            type="AMERICAN"
          />
        </div>
      </div>

      <MatchTable 
        matches={matches as AmericanMatch[]} 
        formatDate={formatDate} 
      />
    </TournamentLayout>
  )
} 