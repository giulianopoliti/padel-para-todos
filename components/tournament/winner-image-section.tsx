"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import UploadWinnerImage from "./upload-winner-image"
import WinnerImageDisplay from "./winner-image-display"

interface WinnerImageSectionProps {
  tournament: any
  tournamentId: string
}

export default function WinnerImageSection({ tournament, tournamentId }: WinnerImageSectionProps) {
  const [winnerImageUrl, setWinnerImageUrl] = useState(tournament.winner_image_url)
  const [isEditing, setIsEditing] = useState(!tournament.winner_image_url) // Start in edit mode if no image
  const router = useRouter()

  const handleImageUploaded = (url: string) => {
    setWinnerImageUrl(url)
    setIsEditing(false) // Switch to display mode after successful upload
    // Refresh the page to show the updated data
    router.refresh()
  }

  const handleEditClick = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  if (isEditing || !winnerImageUrl) {
    return (
      <UploadWinnerImage
        tournamentId={tournamentId}
        tournamentName={tournament.name}
        existingImageUrl={winnerImageUrl}
        onImageUploaded={handleImageUploaded}
        showCancelButton={!!winnerImageUrl}
        onCancel={handleCancelEdit}
      />
    )
  }

  return (
    <WinnerImageDisplay
      tournamentName={tournament.name}
      winnerImageUrl={winnerImageUrl}
      showEditOption={true}
      onEditClick={handleEditClick}
    />
  )
} 