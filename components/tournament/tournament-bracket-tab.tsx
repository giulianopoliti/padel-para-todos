"use client"

import TournamentBracketVisualization from "./tournament-bracket-visualization"

interface TournamentBracketTabProps {
  tournamentId: string
}

export default function TournamentBracketTab({ tournamentId }: TournamentBracketTabProps) {
  return (
    <div className="p-8">
      <TournamentBracketVisualization tournamentId={tournamentId} />
    </div>
  )
}
