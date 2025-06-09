"use client"

import ReadOnlyBracketVisualization from "./read-only-bracket-visualization"

interface ReadOnlyBracketTabProps {
  tournamentId: string
}

export default function ReadOnlyBracketTab({ tournamentId }: ReadOnlyBracketTabProps) {
  return (
    <div className="p-8">
      <ReadOnlyBracketVisualization tournamentId={tournamentId} />
    </div>
  )
} 