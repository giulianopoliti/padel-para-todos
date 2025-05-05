import TournamentLayout from "./tournament-layout"
import TournamentHeader from "./tournament-header"
import MatchTable from "./match-table"
import { formatDate } from "./utils"
import type { BaseTournamentProps } from "./tournament-types"
import type { LargeMatch } from "@/types"
import { useRouter } from 'next/navigation'

export default function EliminationTournament({
  tournament,
  category,
  matches,
  couples,
}: Omit<BaseTournamentProps, 'matches'> & { matches: LargeMatch[] }) {
  const router = useRouter()

  return (
    <TournamentLayout onBack={() => router.back()}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <TournamentHeader
            tournament={tournament}
            category={category}
            type="ELIMINATION"
          />
        </div>
      </div>

      <MatchTable 
        matches={matches}
        formatDate={formatDate} 
      />
    </TournamentLayout>
  )
} 