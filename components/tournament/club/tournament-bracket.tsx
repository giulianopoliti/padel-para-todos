"use client"

import DynamicTournamentBracket from "./dynamic-tournament-bracket"
import type { MatchInfo } from "./types"

interface TournamentBracketProps {
  matches: MatchInfo[]
  onOpenResultDialog: (match: MatchInfo) => void
  isTournamentFinished: boolean
}

export default function TournamentBracket({
  matches,
  onOpenResultDialog,
  isTournamentFinished,
}: TournamentBracketProps) {
  return (
    <DynamicTournamentBracket
      matches={matches}
      onOpenResultDialog={onOpenResultDialog}
      isTournamentFinished={isTournamentFinished}
    />
  )
}
