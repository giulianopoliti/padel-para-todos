import type React from "react"

interface Match {
  id: string
  couple1: { player1: string; player2: string }
  couple2: { player1: string; player2: string }
  score1: number | null
  score2: number | null
  status: "pending" | "completed"
}

interface MatchCardProps {
  match: Match
}

const MatchCard: React.FC<MatchCardProps> = ({ match }) => {
  const renderCoupleName = (couple: { player1: string; player2: string }) => {
    return `${couple.player1} / ${couple.player2}`
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center">
        <div>
          <div className="font-medium text-slate-600">{renderCoupleName(match.couple1)}</div>
          <div className="font-medium text-slate-600 mt-2">{renderCoupleName(match.couple2)}</div>
        </div>
        <div>
          {match.status === "pending" && (
            <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full border border-amber-100">
              Pendiente
            </span>
          )}
          {match.status === "completed" && (
            <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full border border-green-100">
              Completado
            </span>
          )}
        </div>
      </div>
      <div className="flex justify-between mt-4">
        <div>{match.score1 !== null && <span className="text-lg font-semibold">{match.score1}</span>}</div>
        <div>{match.score2 !== null && <span className="text-lg font-semibold">{match.score2}</span>}</div>
      </div>
    </div>
  )
}

export default MatchCard
