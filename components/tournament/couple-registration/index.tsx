"use client"

import { useState, useEffect } from "react"
import PlayerCoupleForm from "./forms/player-couple-form"
import ClubCoupleForm from "./forms/club-couple-form"
import { useUser } from "@/contexts/user-context"

interface PlayerInfo {
  id: string
  first_name: string | null
  last_name: string | null
  score?: number | null
  dni?: string | null
  phone?: string | null
}

interface CoupleRegistrationProps {
  tournamentId: string
  onComplete: (success: boolean) => void
  players: PlayerInfo[]
}

export default function CoupleRegistration({ 
  tournamentId, 
  onComplete,
  players 
}: CoupleRegistrationProps) {
  const [isClubUser, setIsClubUser] = useState<boolean>(false)
  const { user: contextUser, userDetails } = useUser()

  // Detect user type (club or player)
  useEffect(() => {
    setIsClubUser(!userDetails?.player_id)
  }, [userDetails])

  return (
    <div className="w-full">
      {isClubUser ? (
        <ClubCoupleForm
          tournamentId={tournamentId}
          onComplete={onComplete}
          players={players}
        />
      ) : (
        <PlayerCoupleForm
          tournamentId={tournamentId}
          onComplete={onComplete}
          players={players}
          playerUserId={userDetails?.player_id}
        />
      )}
    </div>
  )
} 