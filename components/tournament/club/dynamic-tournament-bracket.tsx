"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { CoupleInfo, MatchInfo } from "./types"

interface DynamicTournamentBracketProps {
  matches: MatchInfo[]
  onOpenResultDialog: (match: MatchInfo) => void
  isTournamentFinished: boolean
}

export default function DynamicTournamentBracket({
  matches,
  onOpenResultDialog,
  isTournamentFinished,
}: DynamicTournamentBracketProps) {
  const [bracketMatches, setBracketMatches] = useState<Record<string, MatchInfo[]>>({})
  const [roundNames, setRoundNames] = useState<string[]>([])

  useEffect(() => {
    if (!matches || matches.length === 0) return

    // Group matches by round
    const matchesByRound: Record<string, MatchInfo[]> = {}
    matches.forEach((match) => {
      if (!matchesByRound[match.round]) {
        matchesByRound[match.round] = []
      }
      matchesByRound[match.round].push(match)
    })

    // Determine round order
    const roundOrder = ["ROUND_OF_32", "ROUND_OF_16", "QUARTERFINAL", "SEMIFINAL", "FINAL"].filter(
      (round) => matchesByRound[round] && matchesByRound[round].length > 0,
    )

    setBracketMatches(matchesByRound)
    setRoundNames(roundOrder)
  }, [matches])

  // Render name of couple
  const renderCoupleName = (couple: CoupleInfo | undefined) => {
    if (!couple) return "—"

    const player1Name = `${couple.player_1_info?.first_name || ""} ${couple.player_1_info?.last_name || ""}`.trim()
    const player2Name = `${couple.player_2_info?.first_name || ""} ${couple.player_2_info?.last_name || ""}`.trim()

    return `${player1Name} / ${player2Name}`
  }

  // Get friendly round name for display
  const getFriendlyRoundName = (roundName: string): string => {
    switch (roundName) {
      case "ROUND_OF_32":
        return "Dieciseisavos de Final"
      case "ROUND_OF_16":
        return "Octavos de Final"
      case "QUARTERFINAL":
        return "Cuartos de Final"
      case "SEMIFINAL":
        return "Semifinales"
      case "FINAL":
        return "Final"
      default:
        return roundName
    }
  }

  // Get color scheme based on round
  const getRoundColorScheme = (roundName: string) => {
    switch (roundName) {
      case "ROUND_OF_32":
      case "ROUND_OF_16":
        return {
          headerColor: "text-violet-700",
          borderColor: "border-violet-200",
          bgColor: "bg-violet-50",
          textColor: "text-violet-700",
        }
      case "QUARTERFINAL":
        return {
          headerColor: "text-teal-700",
          borderColor: "border-teal-200",
          bgColor: "bg-teal-50",
          textColor: "text-teal-700",
        }
      case "SEMIFINAL":
        return {
          headerColor: "text-emerald-700",
          borderColor: "border-emerald-200",
          bgColor: "bg-emerald-50",
          textColor: "text-emerald-700",
        }
      case "FINAL":
        return {
          headerColor: "text-blue-700",
          borderColor: "border-blue-200",
          bgColor: "bg-blue-50",
          textColor: "text-blue-700",
        }
      default:
        return {
          headerColor: "text-slate-700",
          borderColor: "border-slate-200",
          bgColor: "bg-slate-50",
          textColor: "text-slate-700",
        }
    }
  }

  if (roundNames.length === 0) {
    return (
      <div className="text-center p-8">
        <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8 text-blue-600"
          >
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
            <path d="M4 22h16"></path>
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
          </svg>
        </div>
        <h3 className="text-xl font-medium text-blue-700 mb-2">Llave final no disponible</h3>
        <p className="text-slate-500 max-w-md mx-auto text-sm">La llave final se generará cuando el torneo comience.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-6xl overflow-x-auto">
        <div className="flex justify-center gap-6 p-4 min-w-[800px]">
          {roundNames.map((roundName, roundIndex) => {
            const roundMatches = bracketMatches[roundName] || []
            const colors = getRoundColorScheme(roundName)

            return (
              <div key={roundName} className="flex flex-col space-y-4">
                <h3 className={`text-center font-medium ${colors.headerColor} mb-2`}>
                  {getFriendlyRoundName(roundName)}
                </h3>

                <div className="space-y-4 flex flex-col justify-around h-full">
                  {roundMatches.map((match, matchIndex) => (
                    <Card
                      key={match.id}
                      className={`${match.status === "COMPLETED" ? colors.bgColor : "bg-white"} ${colors.borderColor}`}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">
                          {getFriendlyRoundName(roundName)} {matchIndex + 1}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <div
                              className={`font-medium ${
                                match.status === "COMPLETED" && match.winner_id === match.couple1_id
                                  ? colors.textColor
                                  : "text-slate-700"
                              }`}
                            >
                              {renderCoupleName(match.couple1)}
                            </div>
                            {match.status === "COMPLETED" && (
                              <div className={`font-bold text-lg ${colors.textColor}`}>{match.result_couple1}</div>
                            )}
                          </div>

                          <div className="flex justify-between items-center">
                            <div
                              className={`font-medium ${
                                match.status === "COMPLETED" && match.winner_id === match.couple2_id
                                  ? colors.textColor
                                  : "text-slate-700"
                              }`}
                            >
                              {renderCoupleName(match.couple2)}
                            </div>
                            {match.status === "COMPLETED" && (
                              <div className={`font-bold text-lg ${colors.textColor}`}>{match.result_couple2}</div>
                            )}
                          </div>

                          {match.status !== "COMPLETED" &&
                            !isTournamentFinished &&
                            match.couple1_id &&
                            match.couple2_id && (
                              <Button
                                size="sm"
                                variant="outline"
                                className={`w-full mt-2 ${colors.borderColor} ${colors.textColor} hover:${colors.bgColor}`}
                                onClick={() => onOpenResultDialog(match)}
                              >
                                Cargar Resultado
                              </Button>
                            )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
