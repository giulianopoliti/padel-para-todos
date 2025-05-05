import TournamentLayout from "./tournament-layout"
import TournamentHeader from "./tournament-header"
import MatchTable from "./match-table"
import { formatDate } from "./utils"
import type { BaseTournamentProps } from "./tournament-types"
import type { AmericanMatch } from "@/types"
import { useRouter } from 'next/navigation'

export default function AmericanTournament({
  tournament,
  category,
  matches,
  couples,
}: Omit<BaseTournamentProps, 'matches'> & { matches: AmericanMatch[] }) {
  const router = useRouter()

  return (
    <TournamentLayout onBack={() => router.back()}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <TournamentHeader
            tournament={tournament}
            category={category}
            type="AMERICAN"
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