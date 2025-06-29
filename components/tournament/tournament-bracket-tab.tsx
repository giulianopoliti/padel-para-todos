"use client"

import TournamentBracketVisualization from "./tournament-bracket-visualization"

interface TournamentBracketTabProps {
  tournamentId: string
}

export default function TournamentBracketTab({ tournamentId }: TournamentBracketTabProps) {
  return (
    <div className="h-full flex flex-col">
      <TournamentBracketVisualization tournamentId={tournamentId} />
    </div>
  )
}
